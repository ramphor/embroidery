/* global EmbroideryConfig */
var App;

Marionette.TemplateCache.prototype.compileTemplate = function( rawTemplate, options ) {
	options = {
		evaluate: /<#([\s\S]+?)#>/g,
		interpolate: /{{{([\s\S]+?)}}}/g,
		escape: /{{([^}]+?)}}(?!})/g
	};

	return _.template( rawTemplate, options );
};

App = Marionette.Application.extend( {
	helpers: require( 'embroidery-editor-utils/helpers' ),
	heartbeat: require( 'embroidery-editor-utils/heartbeat' ),
	imagesManager: require( 'embroidery-editor-utils/images-manager' ),
	debug: require( 'embroidery-editor-utils/debug' ),
	schemes: require( 'embroidery-editor-utils/schemes' ),
	presetsFactory: require( 'embroidery-editor-utils/presets-factory' ),
	templates: require( 'embroidery-templates/manager' ),
	ajax: require( 'embroidery-editor-utils/ajax' ),
	conditions: require( 'embroidery-editor-utils/conditions' ),
	hotKeys: require( 'embroidery-utils/hot-keys' ),
	history:  require( 'modules/history/assets/js/module' ),

	channels: {
		editor: Backbone.Radio.channel( 'EMBROIDERY:editor' ),
		data: Backbone.Radio.channel( 'EMBROIDERY:data' ),
		panelElements: Backbone.Radio.channel( 'EMBROIDERY:panelElements' ),
		dataEditMode: Backbone.Radio.channel( 'EMBROIDERY:editmode' ),
		deviceMode: Backbone.Radio.channel( 'EMBROIDERY:deviceMode' ),
		templates: Backbone.Radio.channel( 'EMBROIDERY:templates' )
	},

	// Exporting modules that can be used externally
	modules: {
		element: {
			Model: require( 'embroidery-elements/models/element' )
		},
		ControlsStack: require( 'embroidery-views/controls-stack' ),
		Module: require( 'embroidery-utils/module' ),
		RepeaterRowView: require( 'embroidery-controls/repeater-row' ),
		SettingsModel: require( 'embroidery-elements/models/base-settings' ),
		WidgetView: require( 'embroidery-elements/views/widget' ),
		panel: {
			Menu: require( 'embroidery-panel/pages/menu/menu' )
		},
		controls: {
			Base: require( 'embroidery-controls/base' ),
			BaseData: require( 'embroidery-controls/base-data' ),
			BaseMultiple: require( 'embroidery-controls/base-multiple' ),
			Button: require( 'embroidery-controls/button' ),
			Color: require( 'embroidery-controls/color' ),
			Dimensions: require( 'embroidery-controls/dimensions' ),
			Image_dimensions: require( 'embroidery-controls/image-dimensions' ),
			Media: require( 'embroidery-controls/media' ),
			Slider: require( 'embroidery-controls/slider' ),
			Wysiwyg: require( 'embroidery-controls/wysiwyg' ),
			Choose: require( 'embroidery-controls/choose' ),
			Url: require( 'embroidery-controls/base-multiple' ),
			Font: require( 'embroidery-controls/font' ),
			Section: require( 'embroidery-controls/section' ),
			Tab: require( 'embroidery-controls/tab' ),
			Repeater: require( 'embroidery-controls/repeater' ),
			Wp_widget: require( 'embroidery-controls/wp_widget' ),
			Icon: require( 'embroidery-controls/icon' ),
			Gallery: require( 'embroidery-controls/gallery' ),
			Select2: require( 'embroidery-controls/select2' ),
			Date_time: require( 'embroidery-controls/date-time' ),
			Code: require( 'embroidery-controls/code' ),
			Box_shadow: require( 'embroidery-controls/box-shadow' ),
			Text_shadow: require( 'embroidery-controls/box-shadow' ),
			Structure: require( 'embroidery-controls/structure' ),
			Animation: require( 'embroidery-controls/select2' ),
			Hover_animation: require( 'embroidery-controls/select2' ),
			Order: require( 'embroidery-controls/order' ),
			Switcher: require( 'embroidery-controls/switcher' ),
			Number: require( 'embroidery-controls/number' ),
			Popover_toggle: require( 'embroidery-controls/popover-toggle' )
		},
		saver: {
			footerBehavior: require( './components/saver/behaviors/footer-saver' )
		},
		templateLibrary: {
			ElementsCollectionView: require( 'embroidery-panel/pages/elements/views/elements' )
		}
	},

	backgroundClickListeners: {
		popover: {
			element: '.embroidery-controls-popover',
			ignore: '.embroidery-control-popover-toggle-toggle, .embroidery-control-popover-toggle-toggle-label'
		}
	},

	_defaultDeviceMode: 'desktop',

	addControlView: function( controlID, ControlView ) {
		this.modules.controls[ controlID[0].toUpperCase() + controlID.slice( 1 ) ] = ControlView;
	},

	checkEnvCompatibility: function() {
		return this.envData.gecko || this.envData.webkit;
	},

	getElementData: function( modelElement ) {
		var elType = modelElement.get( 'elType' );

		if ( 'widget' === elType ) {
			var widgetType = modelElement.get( 'widgetType' );

			if ( ! this.config.widgets[ widgetType ] ) {
				return false;
			}

			return this.config.widgets[ widgetType ];
		}

		if ( ! this.config.elements[ elType ] ) {
			return false;
		}

		return this.config.elements[ elType ];
	},

	getElementControls: function( modelElement ) {
		var self = this,
			elementData = self.getElementData( modelElement );

		if ( ! elementData ) {
			return false;
		}

		var isInner = modelElement.get( 'isInner' ),
			controls = {};

		_.each( elementData.controls, function( controlData, controlKey ) {
			if ( isInner && controlData.hide_in_inner || ! isInner && controlData.hide_in_top ) {
				return;
			}

			controls[ controlKey ] = _.extend( {}, self.config.controls[ controlData.type ], controlData  );
		} );

		return controls;
	},

	getControlView: function( controlID ) {
		var capitalizedControlName = controlID[0].toUpperCase() + controlID.slice( 1 ),
			View = this.modules.controls[ capitalizedControlName ];

		if ( ! View ) {
			var controlData = this.config.controls[ controlID ],
				isUIControl = -1 !== controlData.features.indexOf( 'ui' );

			View = this.modules.controls[ isUIControl ? 'Base' : 'BaseData' ];
		}

		return View;
	},

	getPanelView: function() {
		return this.getRegion( 'panel' ).currentView;
	},

	initEnvData: function() {
		this.envData = _.pick( tinymce.EditorManager.Env, [ 'desktop', 'webkit', 'gecko', 'ie', 'opera' ] );
	},

	initComponents: function() {
		var EventManager = require( 'embroidery-utils/hooks' ),
			Settings = require( 'embroidery-editor/components/settings/settings' ),
			Saver = require( 'embroidery-editor/components/saver/manager' ),
			Notifications = require( 'embroidery-editor-utils/notifications' );

		this.hooks = new EventManager();

		this.saver = new Saver();

		this.settings = new Settings();

		/**
		 * @deprecated - use `this.settings.page` instead
		 */
		this.pageSettings = this.settings.page;

		this.templates.init();

		this.initDialogsManager();

		this.notifications = new Notifications();

		this.ajax.init();
	},

	initDialogsManager: function() {
		this.dialogsManager = new DialogsManager.Instance();
	},

	initElements: function() {
		var ElementCollection = require( 'embroidery-elements/collections/elements' ),
			config = this.config.data;

		// If it's an reload, use the not-saved data
		if ( this.elements ) {
			config = this.elements.toJSON();
		}

		this.elements = new ElementCollection( config );
	},

	initPreview: function() {
		var $ = jQuery;

		this.$previewWrapper = $( '#embroidery-preview' );

		this.$previewResponsiveWrapper = $( '#embroidery-preview-responsive-wrapper' );

		var previewIframeId = 'embroidery-preview-iframe';

		// Make sure the iFrame does not exist.
		if ( ! this.$preview ) {
			this.$preview = $( '<iframe>', {
				id: previewIframeId,
				src: this.config.preview_link + '&' + ( new Date().getTime() ),
				allowfullscreen: 1
			} );

			this.$previewResponsiveWrapper.append( this.$preview );
		}

		this.$preview
			.on( 'load', this.onPreviewLoaded.bind( this ) )
			.one( 'load', this.checkPageStatus.bind( this ) );
	},

	initFrontend: function() {
		var frontendWindow = this.$preview[0].contentWindow;

		window.embroideryFrontend = frontendWindow.embroideryFrontend;

		frontendWindow.embroidery = this;

		embroideryFrontend.init();

		embroideryFrontend.elementsHandler.initHandlers();

		this.trigger( 'frontend:init' );
	},

	initClearPageDialog: function() {
		var self = this,
			dialog;

		self.getClearPageDialog = function() {
			if ( dialog ) {
				return dialog;
			}

			dialog = this.dialogsManager.createWidget( 'confirm', {
				id: 'embroidery-clear-page-dialog',
				headerMessage: embroidery.translate( 'clear_page' ),
				message: embroidery.translate( 'dialog_confirm_clear_page' ),
				position: {
					my: 'center center',
					at: 'center center'
				},
				strings: {
					confirm: embroidery.translate( 'delete' ),
					cancel: embroidery.translate( 'cancel' )
				},
				onConfirm: function() {
					self.getRegion( 'sections' ).currentView.collection.reset();
				}
			} );

			return dialog;
		};
	},

	initHotKeys: function() {
		var keysDictionary = {
			del: 46,
			d: 68,
			l: 76,
			m: 77,
			p: 80,
			s: 83
		};

		var $ = jQuery,
			hotKeysHandlers = {},
			hotKeysManager = this.hotKeys;

		hotKeysHandlers[ keysDictionary.del ] = {
			deleteElement: {
				isWorthHandling: function( event ) {
					var isEditorOpen = 'editor' === embroidery.getPanelView().getCurrentPageName();

					if ( ! isEditorOpen ) {
						return false;
					}

					var $target = $( event.target );

					if ( $target.is( ':input, .embroidery-input' ) ) {
						return false;
					}

					return ! $target.closest( '.embroidery-inline-editing' ).length;
				},
				handle: function() {
					embroidery.getPanelView().getCurrentPageView().getOption( 'editedElementView' ).removeElement();
				}
			}
		};

		hotKeysHandlers[ keysDictionary.d ] = {
			duplicateElement: {
				isWorthHandling: function( event ) {
					return hotKeysManager.isControlEvent( event );
				},
				handle: function() {
					var panel = embroidery.getPanelView();

					if ( 'editor' !== panel.getCurrentPageName() ) {
						return;
					}

					panel.getCurrentPageView().getOption( 'editedElementView' ).duplicate();
				}
			}
		};

		hotKeysHandlers[ keysDictionary.l ] = {
			showTemplateLibrary: {
				isWorthHandling: function( event ) {
					return hotKeysManager.isControlEvent( event ) && event.shiftKey;
				},
				handle: function() {
					embroidery.templates.showTemplatesModal();
				}
			}
		};

		hotKeysHandlers[ keysDictionary.m ] = {
			changeDeviceMode: {
				devices: [ 'desktop', 'tablet', 'mobile' ],
				isWorthHandling: function( event ) {
					return hotKeysManager.isControlEvent( event ) && event.shiftKey;
				},
				handle: function() {
					var currentDeviceMode = embroidery.channels.deviceMode.request( 'currentMode' ),
						modeIndex = this.devices.indexOf( currentDeviceMode );

					modeIndex++;

					if ( modeIndex >= this.devices.length ) {
						modeIndex = 0;
					}

					embroidery.changeDeviceMode( this.devices[ modeIndex ] );
				}
			}
		};

		hotKeysHandlers[ keysDictionary.p ] = {
			changeEditMode: {
				isWorthHandling: function( event ) {
					return hotKeysManager.isControlEvent( event );
				},
				handle: function() {
					embroidery.getPanelView().modeSwitcher.currentView.toggleMode();
				}
			}
		};

		hotKeysHandlers[ keysDictionary.s ] = {
			saveEditor: {
				isWorthHandling: function( event ) {
					return hotKeysManager.isControlEvent( event );
				},
				handle: function() {
					embroidery.saver.saveDraft();
				}
			}
		};

		_.each( hotKeysHandlers, function( handlers, keyCode ) {
			_.each( handlers, function( handler, handlerName ) {
				hotKeysManager.addHotKeyHandler( keyCode, handlerName, handler );
			} );
		} );

		hotKeysManager.bindListener( this.$window.add( embroideryFrontend.getElements( '$window' ) ) );
	},

	preventClicksInsideEditor: function() {
		this.$previewContents.on( 'click', function( event ) {
			var $target = jQuery( event.target ),
				editMode = embroidery.channels.dataEditMode.request( 'activeMode' ),
				isClickInsideEmbroidery = !! $target.closest( '#embroidery, .pen-menu' ).length,
				isTargetInsideDocument = this.contains( $target[0] );

			if ( isClickInsideEmbroidery && 'edit' === editMode || ! isTargetInsideDocument ) {
				return;
			}

			if ( $target.closest( 'a:not(.embroidery-clickable)' ).length ) {
				event.preventDefault();
			}

			if ( ! isClickInsideEmbroidery ) {
				var panelView = embroidery.getPanelView();

				if ( 'elements' !== panelView.getCurrentPageName() ) {
					panelView.setPage( 'elements' );
				}
			}
		} );
	},

	addBackgroundClickArea: function( element ) {
		element.addEventListener( 'click', this.onBackgroundClick.bind( this ), true );
	},

	addBackgroundClickListener: function( key, listener ) {
		this.backgroundClickListeners[ key ] = listener;
	},

	showFatalErrorDialog: function( options ) {
		var defaultOptions = {
			id: 'embroidery-fatal-error-dialog',
			headerMessage: '',
			message: '',
			position: {
				my: 'center center',
				at: 'center center'
			},
			strings: {
				confirm: embroidery.translate( 'learn_more' ),
				cancel: embroidery.translate( 'go_back' )
			},
			onConfirm: null,
			onCancel: function() {
				parent.history.go( -1 );
			},
			hide: {
				onBackgroundClick: false,
				onButtonClick: false
			}
		};

		options = jQuery.extend( true, defaultOptions, options );

		this.dialogsManager.createWidget( 'confirm', options ).show();
	},

	checkPageStatus: function() {
		if ( embroidery.config.current_revision_id !== embroidery.config.post_id ) {
			this.notifications.showToast( {
				message: this.translate( 'working_on_draft_notification' ),
				buttons: [
					{
						name: 'view_revisions',
						text: embroidery.translate( 'view_all_revisions' ),
						callback: function() {
							var panel = embroidery.getPanelView();

							panel.setPage( 'historyPage' );

							panel.getCurrentPageView().activateTab( 'revisions' );
						}
					}
				]
			} );
		}
	},

	onStart: function() {
		this.$window = jQuery( window );

		NProgress.start();
		NProgress.inc( 0.2 );

		this.config = EmbroideryConfig;

		Backbone.Radio.DEBUG = false;
		Backbone.Radio.tuneIn( 'EMBROIDERY' );

		this.initComponents();

		this.initEnvData();

		if ( ! this.checkEnvCompatibility() ) {
			this.onEnvNotCompatible();
		}

		this.channels.dataEditMode.reply( 'activeMode', 'edit' );

		this.listenTo( this.channels.dataEditMode, 'switch', this.onEditModeSwitched );

		this.initClearPageDialog();

		this.addBackgroundClickArea( document );

		this.$window.trigger( 'embroidery:init' );

		this.initPreview();

		this.logSite();
	},

	onPreviewLoaded: function() {
		NProgress.done();

		var previewWindow = this.$preview[0].contentWindow;

		if ( ! previewWindow.embroideryFrontend ) {
			this.onPreviewLoadingError();

			return;
		}

		this.$previewContents = this.$preview.contents();

		var $previewEmbroideryEl = this.$previewContents.find( '#embroidery' );

		if ( ! $previewEmbroideryEl.length ) {
			this.onPreviewElNotFound();

			return;
		}

		this.initFrontend();

		this.initElements();

		this.initHotKeys();

		this.heartbeat.init();

		var iframeRegion = new Marionette.Region( {
			// Make sure you get the DOM object out of the jQuery object
			el: $previewEmbroideryEl[0]
		} );

		this.schemes.init();

		this.schemes.printSchemesStyle();

		this.preventClicksInsideEditor();

		this.addBackgroundClickArea( embroideryFrontend.getElements( '$document' )[0] );

		var Preview = require( 'embroidery-views/preview' ),
			PanelLayoutView = require( 'embroidery-layouts/panel/panel' );

		this.addRegions( {
			sections: iframeRegion,
			panel: '#embroidery-panel'
		} );

		this.getRegion( 'sections' ).show( new Preview( {
			collection: this.elements
		} ) );

		this.getRegion( 'panel' ).show( new PanelLayoutView() );

		this.$previewContents
		    .children() // <html>
		    .addClass( 'embroidery-html' )
		    .children( 'body' )
		    .addClass( 'embroidery-editor-active' );

		this.setResizablePanel();

		this.changeDeviceMode( this._defaultDeviceMode );

		jQuery( '#embroidery-loading, #embroidery-preview-loading' ).fadeOut( 600 );

		_.defer( function() {
			embroideryFrontend.getElements( 'window' ).jQuery.holdReady( false );
		} );

		this.enqueueTypographyFonts();

		this.onEditModeSwitched();

		this.trigger( 'preview:loaded' );
	},

	onEditModeSwitched: function() {
		var activeMode = this.channels.dataEditMode.request( 'activeMode' );

		if ( 'edit' === activeMode ) {
			this.exitPreviewMode();
		} else {
			this.enterPreviewMode( 'preview' === activeMode );
		}
	},

	onEnvNotCompatible: function() {
		this.showFatalErrorDialog( {
			headerMessage: this.translate( 'device_incompatible_header' ),
			message: this.translate( 'device_incompatible_message' ),
			strings: {
				confirm: embroidery.translate( 'proceed_anyway' )
			},
			hide: {
				onButtonClick: true
			},
			onConfirm: function() {
				this.hide();
			}
		} );
	},

	onPreviewLoadingError: function() {
		this.showFatalErrorDialog( {
			headerMessage: this.translate( 'preview_not_loading_header' ),
			message: this.translate( 'preview_not_loading_message' ),
			onConfirm: function() {
				open( embroidery.config.help_preview_error_url, '_blank' );
			}
		} );
	},

	onPreviewElNotFound: function() {
		this.showFatalErrorDialog( {
			headerMessage: this.translate( 'preview_el_not_found_header' ),
			message: this.translate( 'preview_el_not_found_message' ),
			onConfirm: function() {
				open( embroidery.config.help_the_content_url, '_blank' );
			}
		} );
	},

	onBackgroundClick: function( event ) {
		jQuery.each( this.backgroundClickListeners, function() {
			var elementToHide = this.element,
				$clickedTarget = jQuery( event.target );

			// If it's a label that associated with an input
			if ( $clickedTarget[0].control ) {
				$clickedTarget = $clickedTarget.add( $clickedTarget[0].control );
			}

			if ( this.ignore && $clickedTarget.closest( this.ignore ).length ) {
				return;
			}

			var $clickedTargetClosestElement = $clickedTarget.closest( elementToHide );

			jQuery( elementToHide ).not( $clickedTargetClosestElement ).hide();
		} );
	},

	setResizablePanel: function() {
		var self = this,
			side = embroidery.config.is_rtl ? 'right' : 'left';

		self.panel.$el.resizable( {
			handles: embroidery.config.is_rtl ? 'w' : 'e',
			minWidth: 200,
			maxWidth: 680,
			start: function() {
				self.$previewWrapper
					.addClass( 'ui-resizable-resizing' )
					.css( 'pointer-events', 'none' );
			},
			stop: function() {
				self.$previewWrapper
					.removeClass( 'ui-resizable-resizing' )
					.css( 'pointer-events', '' );

				embroidery.channels.data.trigger( 'scrollbar:update' );
			},
			resize: function( event, ui ) {
				self.$previewWrapper
					.css( side, ui.size.width );
			}
		} );
	},

	enterPreviewMode: function( hidePanel ) {
		var $elements = this.$previewContents.find( 'body' );

		if ( hidePanel ) {
			$elements = $elements.add( 'body' );
		}

		$elements
			.removeClass( 'embroidery-editor-active' )
			.addClass( 'embroidery-editor-preview' );

		if ( hidePanel ) {
			// Handle panel resize
			this.$previewWrapper.css( embroidery.config.is_rtl ? 'right' : 'left', '' );

			this.panel.$el.css( 'width', '' );
		}
	},

	exitPreviewMode: function() {
		this.$previewContents
			.find( 'body' )
			.add( 'body' )
			.removeClass( 'embroidery-editor-preview' )
			.addClass( 'embroidery-editor-active' );
	},

	changeEditMode: function( newMode ) {
		var dataEditMode = embroidery.channels.dataEditMode,
			oldEditMode = dataEditMode.request( 'activeMode' );

		dataEditMode.reply( 'activeMode', newMode );

		if ( newMode !== oldEditMode ) {
			dataEditMode.trigger( 'switch', newMode );
		}
	},

	reloadPreview: function() {
		jQuery( '#embroidery-preview-loading' ).show();

		this.$preview[0].contentWindow.location.reload( true );
	},

	clearPage: function() {
		this.getClearPageDialog().show();
	},

	changeDeviceMode: function( newDeviceMode ) {
		var oldDeviceMode = this.channels.deviceMode.request( 'currentMode' );

		if ( oldDeviceMode === newDeviceMode ) {
			return;
		}

		jQuery( 'body' )
			.removeClass( 'embroidery-device-' + oldDeviceMode )
			.addClass( 'embroidery-device-' + newDeviceMode );

		this.channels.deviceMode
			.reply( 'previousMode', oldDeviceMode )
			.reply( 'currentMode', newDeviceMode )
			.trigger( 'change' );
	},

	enqueueTypographyFonts: function() {
		var self = this,
			typographyScheme = this.schemes.getScheme( 'typography' );

		_.each( typographyScheme.items, function( item ) {
			self.helpers.enqueueFont( item.value.font_family );
		} );
	},

	translate: function( stringKey, templateArgs, i18nStack ) {
		if ( ! i18nStack ) {
			i18nStack = this.config.i18n;
		}

		var string = i18nStack[ stringKey ];

		if ( undefined === string ) {
			string = stringKey;
		}

		if ( templateArgs ) {
			string = string.replace( /{(\d+)}/g, function( match, number ) {
				return undefined !== templateArgs[ number ] ? templateArgs[ number ] : match;
			} );
		}

		return string;
	},

	compareVersions: function( versionA, versionB, operator ) {
		var prepareVersion = function( version ) {
			version = version + '';

			return version.replace( /[^\d.]+/, '.-1.' );
		};

		versionA  = prepareVersion( versionA );
		versionB = prepareVersion( versionB );

		if ( versionA === versionB ) {
			return ! operator || /^={2,3}$/.test( operator );
		}

		var versionAParts = versionA.split( '.' ).map( Number ),
			versionBParts = versionB.split( '.' ).map( Number ),
			longestVersionParts = Math.max( versionAParts.length, versionBParts.length );

		for ( var i = 0; i < longestVersionParts; i++ ) {
			var valueA = versionAParts[ i ] || 0,
				valueB = versionBParts[ i ] || 0;

			if ( valueA !== valueB ) {
				return this.conditions.compare( valueA, valueB, operator );
			}
		}
	},

	logSite: function() {
		var text = '',
			style = '';

		if ( this.envData.gecko ) {
			var asciiText = [
				' ;;;;;;;;;;;;;;; ',
				';;;  ;;       ;;;',
				';;;  ;;;;;;;;;;;;',
				';;;  ;;;;;;;;;;;;',
				';;;  ;;       ;;;',
				';;;  ;;;;;;;;;;;;',
				';;;  ;;;;;;;;;;;;',
				';;;  ;;       ;;;',
				' ;;;;;;;;;;;;;;; '
			];

			text += '%c' + asciiText.join( '\n' ) + '\n';

			style = 'color: #C42961';
		} else {
			text += '%c00';

			style = 'line-height: 1.6; font-size: 20px; background-image: url("' + embroidery.config.assets_url + 'images/logo-icon.png"); color: transparent; background-repeat: no-repeat; background-size: cover';
		}

		text += '%c\nLove using Embroidery? Join our growing community of Embroidery developers: %chttps://github.com/pojome/embroidery';

		setTimeout( console.log.bind( console, text, style, 'color: #9B0A46', '' ) );
	}
} );

module.exports = ( window.embroidery = new App() ).start();
