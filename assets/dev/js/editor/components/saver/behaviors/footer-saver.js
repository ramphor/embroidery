module.exports = Marionette.Behavior.extend( {
	previewWindow: null,

	ui: function() {
		return {
			buttonPreview: '#embroidery-panel-saver-button-preview',
			buttonPublish: '#embroidery-panel-saver-button-publish',
			buttonPublishLabel: '#embroidery-panel-saver-button-publish-label',
			menuSaveDraft: '#embroidery-panel-saver-menu-save-draft',
			lastEditedWrapper: '.embroidery-last-edited-wrapper'
		};
	},

	events: function() {
		return {
			'click @ui.buttonPreview': 'onClickButtonPreview',
			'click @ui.buttonPublish': 'onClickButtonPublish',
			'click @ui.menuSaveDraft': 'onClickMenuSaveDraft'
		};
	},

	initialize: function() {
		embroidery.saver
			.on( 'before:save', this.onBeforeSave.bind( this ) )
			.on( 'after:save', this.onAfterSave.bind( this ) )
			.on( 'after:saveError', this.onAfterSaveError.bind( this ) )
			.on( 'page:status:change', this.onPageStatusChange );

		embroidery.settings.page.model.on( 'change', this.onPageSettingsChange.bind( this ) );
	},

	onRender: function() {
		this.setMenuItems( embroidery.settings.page.model.get( 'post_status' ) );
		this.addTooltip();
	},

	onPageSettingsChange: function( settings ) {
		var changed = settings.changed;

		if ( ! _.isUndefined( changed.post_status ) ) {
			this.setMenuItems( changed.post_status );

			this.refreshWpPreview();

			// Refresh page-settings post-status value.
			if ( 'page_settings' === embroidery.getPanelView().getCurrentPageName() ) {
				embroidery.getPanelView().getCurrentPageView().render();
			}
		}
	},

	onPageStatusChange: function( newStatus ) {
		if ( 'publish' === newStatus ) {
			embroidery.notifications.showToast( {
				message: embroidery.translate( 'publish_notification' ),
				buttons: [
					{
						name: 'view_page',
						text: embroidery.translate( 'have_a_look' ),
						callback: function() {
							open( embroidery.config.post_link );
						}
					}
				]
			} );
		}
	},

	onBeforeSave: function( options ) {
		NProgress.start();
		if ( 'autosave' === options.status ) {
			this.ui.lastEditedWrapper.addClass( 'embroidery-state-active' );
		} else {
			this.ui.buttonPublish.addClass( 'embroidery-button-state' );
		}
	},

	onAfterSave: function( data ) {
		NProgress.done();
		this.ui.buttonPublish.removeClass( 'embroidery-button-state' );
		this.ui.lastEditedWrapper.removeClass( 'embroidery-state-active' );
		this.refreshWpPreview();
		this.setLastEdited( data );
	},

	setLastEdited: function( data ) {
		this.ui.lastEditedWrapper
			.removeClass( 'embroidery-button-state' )
			.find( '.embroidery-last-edited' )
			.html( data.config.last_edited );
	},

	onAfterSaveError: function() {
		NProgress.done();
		this.ui.buttonPublish.removeClass( 'embroidery-button-state' );
	},

	onClickButtonPreview: function() {
		// Open immediately in order to avoid popup blockers.
		this.previewWindow = open( embroidery.config.wp_preview.url, embroidery.config.wp_preview.target );

		if ( embroidery.saver.isEditorChanged() ) {
			if ( embroidery.saver.xhr ) {
				embroidery.saver.xhr.abort();
				embroidery.saver.isSaving = false;
			}

			embroidery.saver.doAutoSave();
		}
	},

	onClickButtonPublish: function() {
		var postStatus = embroidery.settings.page.model.get( 'post_status' );
		switch ( postStatus ) {
			case 'publish':
			case 'private':
				embroidery.saver.update();
				break;
			case 'draft':
				if ( embroidery.config.current_user_can_publish ) {
					embroidery.saver.publish();
				} else {
					embroidery.saver.savePending();
				}
				break;
			case 'pending': // User cannot change post status
			case undefined: // TODO: as a contributor it's undefined instead of 'pending'.
				if ( embroidery.config.current_user_can_publish ) {
					embroidery.saver.publish();
				} else {
					embroidery.saver.update();
				}
				break;
		}
	},

	onClickMenuSaveDraft: function() {
		embroidery.saver.saveDraft();
	},

	setMenuItems: function( postStatus ) {
		var publishLabel = 'publish';

		switch ( postStatus ) {
			case 'publish':
			case 'private':
				publishLabel = 'update';
				break;
			case 'draft':
				if ( ! embroidery.config.current_user_can_publish ) {
					publishLabel = 'submit';
				}
				break;
			case 'pending': // User cannot change post status
			case undefined: // TODO: as a contributor it's undefined instead of 'pending'.
				if ( ! embroidery.config.current_user_can_publish ) {
					publishLabel = 'update';
				}
				break;
		}

		this.ui.buttonPublishLabel.html( embroidery.translate( publishLabel ) );
	},

	addTooltip: function() {
		// Create tooltip on controls
		this.$el.find( '.tooltip-target' ).tipsy( {
			// `n` for down, `s` for up
			gravity: 's',
			title: function() {
				return this.getAttribute( 'data-tooltip' );
			}
		} );
	},

	refreshWpPreview: function() {
		if ( this.previewWindow ) {
			// Refresh URL form updated config.
			try {
				this.previewWindow.location = embroidery.config.wp_preview.url;
			} catch ( e ) {
				// If the this.previewWindow is closed or it's domain was changed.
				// Do nothing.
			}
		}
	}
} );
