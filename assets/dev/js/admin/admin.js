( function( $ ) {
	'use strict';

	var EmbroideryAdminApp = {

		maintenanceMode: null,

		cacheElements: function() {
			this.cache = {
				$window: $( window ),
				$body: $( 'body' ),
				$switchMode: $( '#embroidery-switch-mode' ),
				$goToEditLink: $( '#embroidery-go-to-edit-page-link' ),
				$switchModeInput: $( '#embroidery-switch-mode-input' ),
				$switchModeButton: $( '#embroidery-switch-mode-button' ),
				$embroideryLoader: $( '.embroidery-loader' ),
				$builderEditor: $( '#embroidery-editor' ),
				$importButton: $( '#embroidery-import-template-trigger' ),
				$importArea: $( '#embroidery-import-template-area' ),
				$settingsForm: $( '#embroidery-settings-form' ),
				$settingsTabsWrapper: $( '#embroidery-settings-tabs-wrapper' )
			};

			this.cache.$settingsFormPages = this.cache.$settingsForm.find( '.embroidery-settings-form-page' );

			this.cache.$activeSettingsPage = this.cache.$settingsFormPages.filter( '.embroidery-active' );

			this.cache.$settingsTabs = this.cache.$settingsTabsWrapper.children();

			this.cache.$activeSettingsTab = this.cache.$settingsTabs.filter( '.nav-tab-active' );
		},

		toggleStatus: function() {
			var isEmbroideryMode = this.isEmbroideryMode();

			this.cache.$body
			    .toggleClass( 'embroidery-editor-active', isEmbroideryMode )
			    .toggleClass( 'embroidery-editor-inactive', ! isEmbroideryMode );
		},

		bindEvents: function() {
			var self = this;

			self.cache.$switchModeButton.on( 'click', function( event ) {
				event.preventDefault();

				if ( self.isEmbroideryMode() ) {
					self.cache.$switchModeInput.val( '' );
				} else {
					self.cache.$switchModeInput.val( true );

					var $wpTitle = $( '#title' );

					if ( ! $wpTitle.val() ) {
						$wpTitle.val( 'Embroidery #' + $( '#post_ID' ).val() );
					}

					if ( wp.autosave ) {
						wp.autosave.server.triggerSave();
					}

					self.animateLoader();

					$( document ).on( 'heartbeat-tick.autosave', function() {
						self.cache.$window.off( 'beforeunload.edit-post' );

						window.location = self.cache.$goToEditLink.attr( 'href' );
					} );
				}

				self.toggleStatus();
			} );

			self.cache.$goToEditLink.on( 'click', function() {
				self.animateLoader();
			} );

			$( 'div.notice.embroidery-message-dismissed' ).on( 'click', 'button.notice-dismiss', function( event ) {
				event.preventDefault();

				$.post( ajaxurl, {
					action: 'embroidery_set_admin_notice_viewed',
					notice_id: $( this ).closest( '.embroidery-message-dismissed' ).data( 'notice_id' )
				} );
			} );

			$( '#embroidery-clear-cache-button' ).on( 'click', function( event ) {
				event.preventDefault();
				var $thisButton = $( this );

				$thisButton.removeClass( 'success' ).addClass( 'loading' );

				$.post( ajaxurl, {
					action: 'embroidery_clear_cache',
					_nonce: $thisButton.data( 'nonce' )
				} )
					.done( function() {
						$thisButton.removeClass( 'loading' ).addClass( 'success' );
					} );
			} );

			$( '#embroidery-library-sync-button' ).on( 'click', function( event ) {
				event.preventDefault();
				var $thisButton = $( this );

				$thisButton.removeClass( 'success' ).addClass( 'loading' );

				$.post( ajaxurl, {
					action: 'embroidery_reset_library',
					_nonce: $thisButton.data( 'nonce' )
				} )
					.done( function() {
						$thisButton.removeClass( 'loading' ).addClass( 'success' );
					} );
			} );

			$( '#embroidery-replace-url-button' ).on( 'click', function( event ) {
				event.preventDefault();
				var $this = $( this ),
					$tr = $this.parents( 'tr' ),
					$from = $tr.find( '[name="from"]' ),
					$to = $tr.find( '[name="to"]' );

				$this.removeClass( 'success' ).addClass( 'loading' );

				$.post( ajaxurl, {
					action: 'embroidery_replace_url',
					from: $from.val(),
					to: $to.val(),
					_nonce: $this.data( 'nonce' )
				} )
					.done( function( response ) {
						$this.removeClass( 'loading' );

						if ( response.success ) {
							$this.addClass( 'success' );
						}

						var dialogsManager = new DialogsManager.Instance();
							dialogsManager.createWidget( 'alert', {
								message: response.data
							} ).show();
					} );
			} );

			self.cache.$settingsTabs.on( {
				click: function( event ) {
					event.preventDefault();

					event.currentTarget.focus(); // Safari does not focus the tab automatically
				},
				focus: function() { // Using focus event to enable navigation by tab key
					var hrefWithoutHash = location.href.replace( /#.*/, '' );

					history.pushState( {}, '', hrefWithoutHash + this.hash );

					self.goToSettingsTabFromHash();
				}
			} );

			$( '.embroidery-rollback-button' ).on( 'click', function( event ) {
				event.preventDefault();

				var $this = $( this ),
					dialogsManager = new DialogsManager.Instance();

				dialogsManager.createWidget( 'confirm', {
					headerMessage: EmbroideryAdminConfig.i18n.rollback_to_previous_version,
					message: EmbroideryAdminConfig.i18n.rollback_confirm,
					strings: {
						confirm: EmbroideryAdminConfig.i18n.yes,
						cancel: EmbroideryAdminConfig.i18n.cancel
					},
					onConfirm: function() {
						$this.addClass( 'loading' );

						location.href = $this.attr( 'href' );
					}
				} ).show();
			} );

			$( '.embroidery_css_print_method select' ).on( 'change', function() {
				var $descriptions = $( '.embroidery-css-print-method-description' );

				$descriptions.hide();
				$descriptions.filter( '[data-value="' + $( this ).val() + '"]' ).show();
			} ).trigger( 'change' );
		},

		init: function() {
			this.cacheElements();

			this.bindEvents();

			this.initTemplatesImport();

			this.initMaintenanceMode();

			this.goToSettingsTabFromHash();
		},

		initTemplatesImport: function() {
			if ( ! this.cache.$body.hasClass( 'post-type-embroidery_library' ) ) {
				return;
			}

			var self = this,
				$importButton = self.cache.$importButton,
				$importArea = self.cache.$importArea;

			self.cache.$formAnchor = $( 'h1' );

			$( '#wpbody-content' ).find( '.page-title-action:last' ).after( $importButton );

			self.cache.$formAnchor.after( $importArea );

			$importButton.on( 'click', function() {
				$( '#embroidery-import-template-area' ).toggle();
			} );
		},

		initMaintenanceMode: function() {
			var MaintenanceMode = require( 'embroidery-admin/maintenance-mode' );

			this.maintenanceMode = new MaintenanceMode();
		},

		isEmbroideryMode: function() {
			return !! this.cache.$switchModeInput.val();
		},

		animateLoader: function() {
			this.cache.$goToEditLink.addClass( 'embroidery-animate' );
		},

		goToSettingsTabFromHash: function() {
			var hash = location.hash.slice( 1 );

			if ( hash ) {
				this.goToSettingsTab( hash );
			}
		},

		goToSettingsTab: function( tabName ) {
			var $activePage = this.cache.$settingsFormPages.filter( '#' + tabName );

			if ( ! $activePage.length ) {
				return;
			}

			this.cache.$activeSettingsPage.removeClass( 'embroidery-active' );

			this.cache.$activeSettingsTab.removeClass( 'nav-tab-active' );

			var $activeTab = this.cache.$settingsTabs.filter( '#embroidery-settings-' + tabName );

			$activePage.addClass( 'embroidery-active' );

			$activeTab.addClass( 'nav-tab-active' );

			this.cache.$settingsForm.attr( 'action', 'options.php#' + tabName  );

			this.cache.$activeSettingsPage = $activePage;

			this.cache.$activeSettingsTab = $activeTab;
		}
	};

	$( function() {
		EmbroideryAdminApp.init();
	} );

	window.embroideryAdmin = EmbroideryAdminApp;
}( jQuery ) );
