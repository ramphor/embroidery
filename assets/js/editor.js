(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var Module = require( 'embroidery-utils/module' );

module.exports = Module.extend( {
	autoSaveTimer: null,

	autosaveInterval: embroidery.config.autosave_interval * 1000,

	isSaving: false,

	isChangedDuringSave: false,

	__construct: function() {
		this.setWorkSaver();
	},

	startTimer: function( hasChanges ) {
		clearTimeout( this.autoSaveTimer );
		if ( hasChanges ) {
			this.autoSaveTimer = window.setTimeout( _.bind( this.doAutoSave, this ), this.autosaveInterval );
		}
	},

	saveDraft: function() {
		if ( ! this.isEditorChanged() ) {
			return;
		}

		var postStatus = embroidery.settings.page.model.get( 'post_status' );

		switch ( postStatus ) {
			case 'publish':
			case 'private':
				this.doAutoSave();
				break;
			default:
				// Update and create a revision
				this.update();
		}
	},

	doAutoSave: function() {
		var editorMode = embroidery.channels.dataEditMode.request( 'activeMode' );

		// Avoid auto save for Revisions Preview changes.
		if ( 'edit' !== editorMode ) {
			return;
		}

		this.saveAutoSave();
	},

	saveAutoSave: function( options ) {
		if ( ! this.isEditorChanged() ) {
			return;
		}

		options = _.extend( {
			status: 'autosave'
		}, options );

		this.saveEditor( options );
	},

	savePending: function( options ) {
		options = _.extend( {
			status: 'pending'
		}, options );

		this.saveEditor( options );
	},

	discard: function() {
		var self = this;
		embroidery.ajax.send( 'discard_changes', {
			data: {
				post_id: embroidery.config.post_id
			},

			success: function() {
				self.setFlagEditorChange( false );
				location.href = embroidery.config.exit_to_dashboard_url;
			}
		} );
	},

	update: function( options ) {
		options = _.extend( {
			status: embroidery.settings.page.model.get( 'post_status' )
		}, options );

		this.saveEditor( options );
	},

	publish: function( options ) {
		options = _.extend( {
			status: 'publish'
		}, options );

		this.saveEditor( options );
	},

	setFlagEditorChange: function( status ) {
		if ( status && this.isSaving ) {
			this.isChangedDuringSave = true;
		}

		this.startTimer( status );

		embroidery.channels.editor
			.reply( 'status', status )
			.trigger( 'status:change', status );
	},

	isEditorChanged: function() {
		return ( true === embroidery.channels.editor.request( 'status' ) );
	},

	setWorkSaver: function() {
		var self = this;
		embroidery.$window.on( 'beforeunload', function() {
			if ( self.isEditorChanged() ) {
				return embroidery.translate( 'before_unload_alert' );
			}
		} );
	},

	saveEditor: function( options ) {
		if ( this.isSaving ) {
			return;
		}

		options = _.extend( {
			status: 'draft',
			onSuccess: null
		}, options );

		var self = this,
			newData = embroidery.elements.toJSON( { removeDefault: true } ),
			oldStatus = embroidery.settings.page.model.get( 'post_status' ),
			statusChanged = oldStatus !== options.status;

		self.trigger( 'before:save', options )
			.trigger( 'before:save:' + options.status, options );

		self.isSaving = true;

		self.isChangedDuringSave = false;

		self.xhr = embroidery.ajax.send( 'save_builder', {
			data: {
				post_id: embroidery.config.post_id,
				status: options.status,
				data: JSON.stringify( newData )
			},

			success: function( data ) {
				self.afterAjax();

				if ( ! self.isChangedDuringSave ) {
					self.setFlagEditorChange( false );
				}

				if ( 'autosave' !== options.status && statusChanged ) {
					embroidery.settings.page.model.set( 'post_status', options.status );
				}

				if ( data.config ) {
					jQuery.extend( true, embroidery.config, data.config );
				}

				embroidery.config.data = newData;

				embroidery.channels.editor.trigger( 'saved', data );

				self.trigger( 'after:save', data )
					.trigger( 'after:save:' + options.status, data );

				if ( statusChanged ) {
					self.trigger( 'page:status:change', options.status, oldStatus );
				}

				if ( _.isFunction( options.onSuccess ) ) {
					options.onSuccess.call( this, data );
				}
			},
			error: function( data ) {
				self.afterAjax();

				self.trigger( 'after:saveError', data )
					.trigger( 'after:saveError:' + options.status, data );

				var message;

				if ( data.statusText ) {
					message = embroidery.ajax.createErrorMessage( data );

					if ( 0 === data.readyState ) {
						message += ' ' + embroidery.translate( 'saving_disabled' );
					}
				} else if ( data[0] && data[0].code ) {
					message = embroidery.translate( 'server_error' ) + ' ' + data[0].code;
				}

				embroidery.notifications.showToast( {
					message: message
				} );
			}
		} );

		return self.xhr;
	},

	afterAjax: function() {
		this.isSaving = false;
		this.xhr = null;
	}
} );

},{"embroidery-utils/module":123}],3:[function(require,module,exports){
var ViewModule = require( 'embroidery-utils/view-module' ),
	SettingsModel = require( 'embroidery-elements/models/base-settings' ),
	ControlsCSSParser = require( 'embroidery-editor-utils/controls-css-parser' );

module.exports = ViewModule.extend( {
	controlsCSS: null,

	model: null,

	hasChange: false,

	changeCallbacks: {},

	addChangeCallback: function( attribute, callback ) {
		this.changeCallbacks[ attribute ] = callback;
	},

	bindEvents: function() {
		embroidery.on( 'preview:loaded', this.onEmbroideryPreviewLoaded );

		this.model.on( 'change', this.onModelChange );
	},

	addPanelPage: function() {
		var name = this.getSettings( 'name' );

		embroidery.getPanelView().addPage( name + '_settings', {
			view: embroidery.settings.panelPages[ name ] || embroidery.settings.panelPages.base,
			title: this.getSettings( 'panelPage.title' ),
			options: {
				model: this.model,
				name: name
			}
		} );
	},

	updateStylesheet: function( keepOldEntries ) {
		if ( ! keepOldEntries ) {
			this.controlsCSS.stylesheet.empty();
		}

		this.controlsCSS.addStyleRules( this.model.getStyleControls(), this.model.attributes, this.model.controls, [ /{{WRAPPER}}/g ], [ this.getSettings( 'cssWrapperSelector' ) ] );

		this.controlsCSS.addStyleToDocument();
	},

	initModel: function() {
		this.model = new SettingsModel( this.getSettings( 'settings' ), {
			controls: this.getSettings( 'controls' )
		} );
	},

	initControlsCSSParser: function() {
		this.controlsCSS = new ControlsCSSParser( { id: this.getSettings( 'name' ) } );
	},

	getDataToSave: function( data ) {
		return data;
	},

	save: function( callback ) {
		var self = this;

		if ( ! self.hasChange ) {
			return;
		}

		var settings = this.model.toJSON( { removeDefault: true } ),
			data = this.getDataToSave( {
				data: JSON.stringify( settings )
			} );

		NProgress.start();

		embroidery.ajax.send( 'save_' + this.getSettings( 'name' ) + '_settings', {
			data: data,
			success: function() {
				NProgress.done();

				self.setSettings( 'settings', settings );

				self.hasChange = false;

				if ( callback ) {
					callback.apply( self, arguments );
				}
			},
			error: function() {
				alert( 'An error occurred' );
			}
		} );
	},

	addPanelMenuItem: function() {
		var menuSettings = this.getSettings( 'panelPage.menu' );

		if ( ! menuSettings ) {
			return;
		}

		var menuItemOptions = {
				icon: menuSettings.icon,
				title: this.getSettings( 'panelPage.title' ),
				type: 'page',
				pageName: this.getSettings( 'name' ) + '_settings'
			};

		embroidery.modules.panel.Menu.addItem( menuItemOptions, 'settings', menuSettings.beforeItem );
	},

	onInit: function() {
		this.initModel();

		this.initControlsCSSParser();

		this.addPanelMenuItem();

		this.debounceSave = _.debounce( this.save, 3000 );

		ViewModule.prototype.onInit.apply( this, arguments );
	},

	onModelChange: function( model ) {
		var self = this;

		self.hasChange = true;

		this.controlsCSS.stylesheet.empty();

		_.each( model.changed, function( value, key ) {
			if ( self.changeCallbacks[ key ] ) {
				self.changeCallbacks[ key ].call( self, value );
			}
		} );

		self.updateStylesheet( true );

		self.debounceSave();
	},

	onEmbroideryPreviewLoaded: function() {
		this.updateStylesheet();

		this.addPanelPage();
	}
} );

},{"embroidery-editor-utils/controls-css-parser":103,"embroidery-elements/models/base-settings":61,"embroidery-utils/view-module":124}],4:[function(require,module,exports){
var ControlsStack = require( 'embroidery-views/controls-stack' );

module.exports = ControlsStack.extend( {
	id: function() {
		return 'embroidery-panel-' + this.getOption( 'name' ) + '-settings';
	},

	getTemplate: function() {
		return '#tmpl-embroidery-panel-' + this.getOption( 'name' ) + '-settings';
	},

	childViewContainer: function() {
		return '#embroidery-panel-' + this.getOption( 'name' ) + '-settings-controls';
	},

	childViewOptions: function() {
		return {
			elementSettingsModel: this.model
		};
	},

	initialize: function() {
		this.collection = new Backbone.Collection( _.values( this.model.controls ) );
	}
} );

},{"embroidery-views/controls-stack":119}],5:[function(require,module,exports){
var BaseSettings = require( 'embroidery-editor/components/settings/base/manager' );

module.exports = BaseSettings.extend( {
	changeCallbacks: {
		embroidery_page_title_selector: function( newValue ) {
			var newSelector = newValue || 'h1.entry-title',
				titleSelectors = embroidery.settings.page.model.controls.hide_title.selectors = {};

			titleSelectors[ newSelector ] = 'display: none';

			embroidery.settings.page.updateStylesheet();
		}
	}
} );

},{"embroidery-editor/components/settings/base/manager":3}],6:[function(require,module,exports){
var BaseSettings = require( 'embroidery-editor/components/settings/base/manager' );

module.exports = BaseSettings.extend( {
	changeCallbacks: {
		post_title: function( newValue ) {
			var $title = embroideryFrontend.getElements( '$document' ).find( embroidery.config.page_title_selector );

			$title.text( newValue );
		},

		template: function() {
			this.save( function() {
				embroidery.reloadPreview();

				embroidery.once( 'preview:loaded', function() {
					embroidery.getPanelView().setPage( 'page_settings' );
				} );
			} );
		}
	},

	bindEvents: function() {
		embroidery.channels.editor.on( 'embroidery:clearPage', function() {
			embroidery.clearPage();
		} );

		BaseSettings.prototype.bindEvents.apply( this, arguments );
	},

	getDataToSave: function( data ) {
		data.id = embroidery.config.post_id;

		return data;
	}
} );

},{"embroidery-editor/components/settings/base/manager":3}],7:[function(require,module,exports){
var Module = require( 'embroidery-utils/module' );

module.exports = Module.extend( {
	modules: {
		base: require( 'embroidery-editor/components/settings/base/manager' ),
		general: require( 'embroidery-editor/components/settings/general/manager' ),
		page: require( 'embroidery-editor/components/settings/page/manager' )
	},

	panelPages: {
		base: require( 'embroidery-editor/components/settings/base/panel' )
	},

	onInit: function() {
		this.initSettings();
	},

	initSettings: function() {
		var self = this;

		_.each( embroidery.config.settings, function( config, name ) {
			var Manager = self.modules[ name ] || self.modules.base;

			self[ name ] = new Manager( config );
		} );
	}
} );

},{"embroidery-editor/components/settings/base/manager":3,"embroidery-editor/components/settings/base/panel":4,"embroidery-editor/components/settings/general/manager":5,"embroidery-editor/components/settings/page/manager":6,"embroidery-utils/module":123}],8:[function(require,module,exports){
var InsertTemplateHandler;

InsertTemplateHandler = Marionette.Behavior.extend( {
	ui: {
		insertButton: '.embroidery-template-library-template-insert'
	},

	events: {
		'click @ui.insertButton': 'onInsertButtonClick'
	},

	onInsertButtonClick: function() {
		if ( this.view.model.get( 'hasPageSettings' ) ) {
			InsertTemplateHandler.showImportDialog( this.view.model );
			return;
		}

		embroidery.templates.importTemplate( this.view.model );
	}
}, {
	dialog: null,

	showImportDialog: function( model ) {
		var dialog = InsertTemplateHandler.getDialog();

		dialog.onConfirm = function() {
			embroidery.templates.importTemplate( model, { withPageSettings: true } );
		};

		dialog.onCancel = function() {
			embroidery.templates.importTemplate( model );
		};

		dialog.show();
	},

	initDialog: function() {
		InsertTemplateHandler.dialog = embroidery.dialogsManager.createWidget( 'confirm', {
			id: 'embroidery-insert-template-settings-dialog',
			headerMessage: embroidery.translate( 'import_template_dialog_header' ),
			message: embroidery.translate( 'import_template_dialog_message' ) + '<br>' + embroidery.translate( 'import_template_dialog_message_attention' ),
			strings: {
				confirm: embroidery.translate( 'yes' ),
				cancel: embroidery.translate( 'no' )
			}
		} );
	},

	getDialog: function() {
		if ( ! InsertTemplateHandler.dialog ) {
			InsertTemplateHandler.initDialog();
		}

		return InsertTemplateHandler.dialog;
	}
} );

module.exports = InsertTemplateHandler;

},{}],9:[function(require,module,exports){
var TemplateLibraryTemplateModel = require( 'embroidery-templates/models/template' ),
	TemplateLibraryCollection;

TemplateLibraryCollection = Backbone.Collection.extend( {
	model: TemplateLibraryTemplateModel
} );

module.exports = TemplateLibraryCollection;

},{"embroidery-templates/models/template":11}],10:[function(require,module,exports){
var TemplateLibraryLayoutView = require( 'embroidery-templates/views/layout' ),
	TemplateLibraryCollection = require( 'embroidery-templates/collections/templates' ),
	TemplateLibraryManager;

TemplateLibraryManager = function() {
	var self = this,
		modal,
		deleteDialog,
		errorDialog,
		layout,
		config = {},
		startIntent = {},
		templateTypes = {},
		filterTerms = {},
		templatesCollection;

	var initLayout = function() {
		layout = new TemplateLibraryLayoutView();
	};

	var registerDefaultTemplateTypes = function() {
		var data = {
			saveDialog: {
				description: embroidery.translate( 'save_your_template_description' )
			},
			ajaxParams: {
				success: function( data ) {
					self.getTemplatesCollection().add( data );

					self.setTemplatesSource( 'local' );
				},
				error: function( data ) {
					self.showErrorDialog( data );
				}
			}
		};

		_.each( [ 'page', 'section' ], function( type ) {
			var safeData = jQuery.extend( true, {}, data, {
				saveDialog: {
					title: embroidery.translate( 'save_your_template', [ embroidery.translate( type ) ] )
				}
			} );

			self.registerTemplateType( type, safeData );
		} );
	};

	var registerDefaultFilterTerms = function() {
		filterTerms = {
			text: {
				callback: function( value ) {
					value = value.toLowerCase();

					if ( this.get( 'title' ).toLowerCase().indexOf( value ) >= 0 ) {
						return true;
					}

					return _.any( this.get( 'tags' ), function( tag ) {
						return tag.toLowerCase().indexOf( value ) >= 0;
					} );
				}
			},
			favorite: {}
		};

		jQuery.each( startIntent.filters, function( filterName ) {
			if ( filterTerms[ filterName ] ) {
				jQuery.extend( filterTerms[ filterName ], this );
			} else {
				filterTerms[ filterName ] = this;
			}
		} );
	};

	this.init = function() {
		registerDefaultTemplateTypes();

		embroidery.addBackgroundClickListener( 'libraryToggleMore', {
			element: '.embroidery-template-library-template-more'
		} );
	};

	this.getTemplateTypes = function( type ) {
		if ( type ) {
			return templateTypes[ type ];
		}

		return templateTypes;
	};

	this.registerTemplateType = function( type, data ) {
		templateTypes[ type ] = data;
	};

	this.deleteTemplate = function( templateModel, options ) {
		var dialog = self.getDeleteDialog();

		dialog.onConfirm = function() {
			if ( options.onConfirm ) {
				options.onConfirm();
			}

			embroidery.ajax.send( 'delete_template', {
				data: {
					source: templateModel.get( 'source' ),
					template_id: templateModel.get( 'template_id' )
				},
				success: function( response ) {
					templatesCollection.remove( templateModel, { silent: true } );

					if ( options.onSuccess ) {
						options.onSuccess( response );
					}
				}
			} );
		};

		dialog.show();
	};

	this.importTemplate = function( templateModel, options ) {
		options = options || {};

		layout.showLoadingView();

		self.requestTemplateContent( templateModel.get( 'source' ), templateModel.get( 'template_id' ), {
			data: {
				page_settings: options.withPageSettings
			},
			success: function( data ) {
				self.closeModal();

				embroidery.channels.data.trigger( 'template:before:insert', templateModel );

				embroidery.sections.currentView.addChildModel( data.content, startIntent.importOptions || {} );

				embroidery.channels.data.trigger( 'template:after:insert', templateModel );

				if ( options.withPageSettings ) {
					embroidery.settings.page.model.set( data.page_settings );
				}
			},
			error: function( data ) {
				self.showErrorDialog( data );
			}
		} );
	};

	this.saveTemplate = function( type, data ) {
		var templateType = templateTypes[ type ];

		_.extend( data, {
			source: 'local',
			type: type
		} );

		if ( templateType.prepareSavedData ) {
			data = templateType.prepareSavedData( data );
		}

		data.content = JSON.stringify( data.content );

		var ajaxParams = { data: data };

		if ( templateType.ajaxParams ) {
			_.extend( ajaxParams, templateType.ajaxParams );
		}

		embroidery.ajax.send( 'save_template', ajaxParams );
	};

	this.requestTemplateContent = function( source, id, ajaxOptions ) {
		var options = {
			data: {
				source: source,
				edit_mode: true,
				display: true,
				template_id: id
			}
		};

		if ( ajaxOptions ) {
			jQuery.extend( true, options, ajaxOptions );
		}

		return embroidery.ajax.send( 'get_template_data', options );
	};

	this.markAsFavorite = function( templateModel, favorite ) {
		var options = {
			data: {
				source: templateModel.get( 'source' ),
				template_id: templateModel.get( 'template_id' ),
				favorite: favorite
			}
		};

		return embroidery.ajax.send( 'mark_template_as_favorite', options );
	};

	this.getDeleteDialog = function() {
		if ( ! deleteDialog ) {
			deleteDialog = embroidery.dialogsManager.createWidget( 'confirm', {
				id: 'embroidery-template-library-delete-dialog',
				headerMessage: embroidery.translate( 'delete_template' ),
				message: embroidery.translate( 'delete_template_confirm' ),
				strings: {
					confirm: embroidery.translate( 'delete' )
				}
			} );
		}

		return deleteDialog;
	};

	this.getErrorDialog = function() {
		if ( ! errorDialog ) {
			errorDialog = embroidery.dialogsManager.createWidget( 'alert', {
				id: 'embroidery-template-library-error-dialog',
				headerMessage: embroidery.translate( 'an_error_occurred' )
			} );
		}

		return errorDialog;
	};

	this.getModal = function() {
		if ( ! modal ) {
			modal = embroidery.dialogsManager.createWidget( 'lightbox', {
				id: 'embroidery-template-library-modal',
				closeButton: false,
				hide: {
					onOutsideClick: false
				}
			} );
		}

		return modal;
	};

	this.getLayout = function() {
		return layout;
	};

	this.getTemplatesCollection = function() {
		return templatesCollection;
	};

	this.getConfig = function( item ) {
		if ( item ) {
			return config[ item ];
		}

		return config;
	};

	this.requestLibraryData = function( callback, forceUpdate, forceSync ) {
		if ( templatesCollection && ! forceUpdate ) {
			if ( callback ) {
				callback();
			}

			return;
		}

		var options = {
			data: {},
			success: function( data ) {
				templatesCollection = new TemplateLibraryCollection( data.templates );

				config = data.config;

				if ( callback ) {
					callback();
				}
			}
		};

		if ( forceSync ) {
			options.data.sync = true;
		}

		embroidery.ajax.send( 'get_library_data', options );
	};

	this.startModal = function( customStartIntent ) {
		startIntent = customStartIntent || {};

		registerDefaultFilterTerms();

		self.getModal().show();

		self.setTemplatesSource( 'remote', true );

		if ( ! layout ) {
			initLayout();
		}

		layout.showLoadingView();

		self.requestLibraryData( function() {
			if ( startIntent.onReady ) {
				startIntent.onReady();
			}
		} );
	};

	this.closeModal = function() {
		self.getModal().hide();
	};

	this.getFilter = function( name ) {
		return embroidery.channels.templates.request( 'filter:' + name );
	};

	this.setFilter = function( name, value, silent ) {
		embroidery.channels.templates.reply( 'filter:' + name, value );

		if ( ! silent ) {
			embroidery.channels.templates.trigger( 'filter:change' );
		}
	};

	this.getFilterTerms = function( termName ) {
		if ( termName ) {
			return filterTerms[ termName ];
		}

		return filterTerms;
	};

	this.setTemplatesSource = function( source, silent ) {
		embroidery.channels.templates.stopReplying();

		self.setFilter( 'source', source );

		if ( ! silent ) {
			self.showTemplates();
		}
	};

	this.showTemplates = function() {
		var activeSource = self.getFilter( 'source' );

		var templatesToShow = templatesCollection.filter( function( model ) {
			if ( activeSource !== model.get( 'source' ) ) {
				return false;
			}

			var typeInfo = templateTypes[ model.get( 'type' ) ];

			return ! typeInfo || false !== typeInfo.showInLibrary;
		} );

		layout.showTemplatesView( new TemplateLibraryCollection( templatesToShow ) );
	};

	this.showTemplatesModal = function() {
		self.startModal( {
			onReady: self.showTemplates
		} );
	};

	this.showErrorDialog = function( errorMessage ) {
		if ( 'object' === typeof errorMessage ) {
			var message = '';

			_.each( errorMessage, function( error ) {
				message += '<div>' + error.message + '.</div>';
			} );

			errorMessage = message;
		} else if ( errorMessage ) {
			errorMessage += '.';
		} else {
			errorMessage = '<i>&#60;The error message is empty&#62;</i>';
		}

		self.getErrorDialog()
		    .setMessage( embroidery.translate( 'templates_request_error' ) + '<div id="embroidery-template-library-error-info">' + errorMessage + '</div>' )
		    .show();
	};
};

module.exports = new TemplateLibraryManager();

},{"embroidery-templates/collections/templates":9,"embroidery-templates/views/layout":12}],11:[function(require,module,exports){
var TemplateLibraryTemplateModel;

TemplateLibraryTemplateModel = Backbone.Model.extend( {
	defaults: {
		template_id: 0,
		title: '',
		source: '',
		type: '',
		author: '',
		thumbnail: '',
		url: '',
		export_link: '',
		tags: []
	}
} );

module.exports = TemplateLibraryTemplateModel;

},{}],12:[function(require,module,exports){
var TemplateLibraryHeaderView = require( 'embroidery-templates/views/parts/header' ),
	TemplateLibraryHeaderLogoView = require( 'embroidery-templates/views/parts/header-parts/logo' ),
	TemplateLibraryHeaderActionsView = require( 'embroidery-templates/views/parts/header-parts/actions' ),
	TemplateLibraryHeaderMenuView = require( 'embroidery-templates/views/parts/header-parts/menu' ),
	TemplateLibraryHeaderPreviewView = require( 'embroidery-templates/views/parts/header-parts/preview' ),
	TemplateLibraryHeaderBackView = require( 'embroidery-templates/views/parts/header-parts/back' ),
	TemplateLibraryLoadingView = require( 'embroidery-templates/views/parts/loading' ),
	TemplateLibraryCollectionView = require( 'embroidery-templates/views/parts/templates' ),
	TemplateLibrarySaveTemplateView = require( 'embroidery-templates/views/parts/save-template' ),
	TemplateLibraryImportView = require( 'embroidery-templates/views/parts/import' ),
	TemplateLibraryPreviewView = require( 'embroidery-templates/views/parts/preview' ),
	TemplateLibraryLayoutView;

TemplateLibraryLayoutView = Marionette.LayoutView.extend( {
	el: '#embroidery-template-library-modal',

	regions: {
		modalContent: '.dialog-message',
		modalHeader: '.dialog-widget-header'
	},

	initialize: function() {
		this.getRegion( 'modalHeader' ).show( new TemplateLibraryHeaderView() );
	},

	getHeaderView: function() {
		return this.getRegion( 'modalHeader' ).currentView;
	},

	getTemplateActionButton: function( templateData ) {
		var viewId = '#tmpl-embroidery-template-library-' + ( templateData.isPro ? 'get-pro-button' : 'insert-button' );

		viewId = embroidery.hooks.applyFilters( 'embroidery/editor/template-library/template/action-button', viewId, templateData );

		var template = Marionette.TemplateCache.get( viewId );

		return Marionette.Renderer.render( template );
	},

	showLoadingView: function() {
		this.modalContent.show( new TemplateLibraryLoadingView() );
	},

	showTemplatesView: function( templatesCollection ) {
		this.modalContent.show( new TemplateLibraryCollectionView( {
			collection: templatesCollection
		} ) );

		var headerView = this.getHeaderView();

		headerView.tools.show( new TemplateLibraryHeaderActionsView() );
		headerView.menuArea.show( new TemplateLibraryHeaderMenuView() );
		headerView.logoArea.show( new TemplateLibraryHeaderLogoView() );
	},

	showImportView: function() {
		this.getHeaderView().menuArea.reset();

		this.modalContent.show( new TemplateLibraryImportView() );
	},

	showSaveTemplateView: function( elementModel ) {
		this.getHeaderView().menuArea.reset();

		this.modalContent.show( new TemplateLibrarySaveTemplateView( { model: elementModel } ) );
	},

	showPreviewView: function( templateModel ) {
		this.modalContent.show( new TemplateLibraryPreviewView( {
			url: templateModel.get( 'url' )
		} ) );

		var headerView = this.getHeaderView();

		headerView.menuArea.reset();

		headerView.tools.show( new TemplateLibraryHeaderPreviewView( {
			model: templateModel
		} ) );

		headerView.logoArea.show( new TemplateLibraryHeaderBackView() );
	}
} );

module.exports = TemplateLibraryLayoutView;

},{"embroidery-templates/views/parts/header":18,"embroidery-templates/views/parts/header-parts/actions":13,"embroidery-templates/views/parts/header-parts/back":14,"embroidery-templates/views/parts/header-parts/logo":15,"embroidery-templates/views/parts/header-parts/menu":16,"embroidery-templates/views/parts/header-parts/preview":17,"embroidery-templates/views/parts/import":19,"embroidery-templates/views/parts/loading":20,"embroidery-templates/views/parts/preview":21,"embroidery-templates/views/parts/save-template":22,"embroidery-templates/views/parts/templates":24}],13:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-actions',

	id: 'embroidery-template-library-header-actions',

	ui: {
		'import': '#embroidery-template-library-header-import i',
		sync: '#embroidery-template-library-header-sync i',
		save: '#embroidery-template-library-header-save i'
	},

	events: {
		'click @ui.import': 'onImportClick',
		'click @ui.sync': 'onSyncClick',
		'click @ui.save': 'onSaveClick'
	},

	onImportClick: function() {
		embroidery.templates.getLayout().showImportView();
	},

	onSyncClick: function() {
		var self = this;

		self.ui.sync.addClass( 'eicon-animation-spin' );

		embroidery.templates.requestLibraryData( function() {
			self.ui.sync.removeClass( 'eicon-animation-spin' );

			embroidery.templates.showTemplates();
		}, true, true );
	},

	onSaveClick: function() {
		embroidery.templates.getLayout().showSaveTemplateView();
	}
} );

},{}],14:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-back',

	id: 'embroidery-template-library-header-preview-back',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		embroidery.templates.showTemplates();
	}
} );

},{}],15:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-logo',

	id: 'embroidery-template-library-header-logo',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		embroidery.templates.setTemplatesSource( 'remote' );
	}
} );

},{}],16:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	options: {
		activeClass: 'embroidery-active'
	},

	template: '#tmpl-embroidery-template-library-header-menu',

	id: 'embroidery-template-library-header-menu',

	ui: {
		menuItems: '.embroidery-template-library-menu-item'
	},

	events: {
		'click @ui.menuItems': 'onMenuItemClick'
	},

	$activeItem: null,

	activateMenuItem: function( $item ) {
		var activeClass = this.getOption( 'activeClass' );

		if ( this.$activeItem === $item ) {
			return;
		}

		if ( this.$activeItem ) {
			this.$activeItem.removeClass( activeClass );
		}

		$item.addClass( activeClass );

		this.$activeItem = $item;
	},

	onRender: function() {
		var currentSource = embroidery.templates.getFilter( 'source' ),
			$sourceItem = this.ui.menuItems.filter( '[data-template-source="' + currentSource + '"]' );

		this.activateMenuItem( $sourceItem );
	},

	onMenuItemClick: function( event ) {
		var item = event.currentTarget;

		this.activateMenuItem( jQuery( item ) );

		embroidery.templates.setTemplatesSource( item.dataset.templateSource );
	}
} );

},{}],17:[function(require,module,exports){
var TemplateLibraryInsertTemplateBehavior = require( 'embroidery-templates/behaviors/insert-template' );

module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-preview',

	id: 'embroidery-template-library-header-preview',

	behaviors: {
		insertTemplate: {
			behaviorClass: TemplateLibraryInsertTemplateBehavior
		}
	}
} );

},{"embroidery-templates/behaviors/insert-template":8}],18:[function(require,module,exports){
var TemplateLibraryHeaderView;

TemplateLibraryHeaderView = Marionette.LayoutView.extend( {

	id: 'embroidery-template-library-header',

	template: '#tmpl-embroidery-template-library-header',

	regions: {
		logoArea: '#embroidery-template-library-header-logo-area',
		tools: '#embroidery-template-library-header-tools',
		menuArea: '#embroidery-template-library-header-menu-area'
	},

	ui: {
		closeModal: '#embroidery-template-library-header-close-modal'
	},

	events: {
		'click @ui.closeModal': 'onCloseModalClick'
	},

	onCloseModalClick: function() {
		embroidery.templates.closeModal();
	}
} );

module.exports = TemplateLibraryHeaderView;

},{}],19:[function(require,module,exports){
var TemplateLibraryImportView;

TemplateLibraryImportView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-import',

	id: 'embroidery-template-library-import',

	ui: {
		uploadForm: '#embroidery-template-library-import-form',
		fileInput: '#embroidery-template-library-import-form-input'
	},

	events: {
		'change @ui.fileInput': 'onFileInputChange'
	},

	droppedFiles: null,

	submitForm: function() {
		var layout = embroidery.templates.getLayout(),
			data = new FormData();

		if ( this.droppedFiles ) {
			data.append( 'file', this.droppedFiles[0] );

			this.droppedFiles = null;
		} else {
			data.append( 'file', this.ui.fileInput[0].files[0] );

			this.ui.uploadForm[0].reset();
		}

		var options = {
			data: data,
			processData: false,
			contentType: false,
			success: function( data ) {
				embroidery.templates.getTemplatesCollection().add( data );

				embroidery.templates.setTemplatesSource( 'local' );
			},
			error: function( data ) {
				embroidery.templates.showErrorDialog( data );

				layout.showImportView();
			}
		};

		embroidery.ajax.send( 'import_template', options );

		layout.showLoadingView();
	},

	onRender: function() {
		this.ui.uploadForm.on( {
			'drag dragstart dragend dragover dragenter dragleave drop': this.onFormActions.bind( this ),
			dragenter: this.onFormDragEnter.bind( this ),
			'dragleave drop': this.onFormDragLeave.bind( this ),
			drop: this.onFormDrop.bind( this )
		} );
	},

	onFormActions: function( event ) {
		event.preventDefault();
		event.stopPropagation();
	},

	onFormDragEnter: function() {
		this.ui.uploadForm.addClass( 'embroidery-drag-over' );
	},

	onFormDragLeave: function( event ) {
		if ( jQuery( event.relatedTarget ).closest( this.ui.uploadForm ).length ) {
			return;
		}

		this.ui.uploadForm.removeClass( 'embroidery-drag-over' );
	},

	onFormDrop: function( event ) {
		this.droppedFiles = event.originalEvent.dataTransfer.files;

		this.submitForm();
	},

	onFileInputChange: function() {
		this.submitForm();
	}
} );

module.exports = TemplateLibraryImportView;

},{}],20:[function(require,module,exports){
var TemplateLibraryLoadingView;

TemplateLibraryLoadingView = Marionette.ItemView.extend( {
	id: 'embroidery-template-library-loading',

	template: '#tmpl-embroidery-template-library-loading'
} );

module.exports = TemplateLibraryLoadingView;

},{}],21:[function(require,module,exports){
var TemplateLibraryPreviewView;

TemplateLibraryPreviewView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-preview',

	id: 'embroidery-template-library-preview',

	ui: {
		iframe: '> iframe'
	},

	onRender: function() {
		this.ui.iframe.attr( 'src', this.getOption( 'url' ) );
	}
} );

module.exports = TemplateLibraryPreviewView;

},{}],22:[function(require,module,exports){
var TemplateLibrarySaveTemplateView;

TemplateLibrarySaveTemplateView = Marionette.ItemView.extend( {
	id: 'embroidery-template-library-save-template',

	template: '#tmpl-embroidery-template-library-save-template',

	ui: {
		form: '#embroidery-template-library-save-template-form',
		submitButton: '#embroidery-template-library-save-template-submit'
	},

	events: {
		'submit @ui.form': 'onFormSubmit'
	},

	getSaveType: function() {
		return this.model ? this.model.get( 'elType' ) : 'page';
	},

	templateHelpers: function() {
		var saveType = this.getSaveType(),
			templateType = embroidery.templates.getTemplateTypes( saveType );

		return templateType.saveDialog;
	},

	onFormSubmit: function( event ) {
		event.preventDefault();

		var formData = this.ui.form.embroiderySerializeObject(),
			saveType = this.model ? this.model.get( 'elType' ) : 'page',
			JSONParams = { removeDefault: true };

		formData.content = this.model ? [ this.model.toJSON( JSONParams ) ] : embroidery.elements.toJSON( JSONParams );

		this.ui.submitButton.addClass( 'embroidery-button-state' );

		embroidery.templates.saveTemplate( saveType, formData );
	}
} );

module.exports = TemplateLibrarySaveTemplateView;

},{}],23:[function(require,module,exports){
var TemplateLibraryTemplatesEmptyView;

TemplateLibraryTemplatesEmptyView = Marionette.ItemView.extend( {
	id: 'embroidery-template-library-templates-empty',

	template: '#tmpl-embroidery-template-library-templates-empty',

	ui: {
		title: '.embroidery-template-library-blank-title',
		message: '.embroidery-template-library-blank-message'
	},

	modesStrings: {
		empty: {
			title: embroidery.translate( 'templates_empty_title' ),
			message: embroidery.translate( 'templates_empty_message' )
		},
		noResults: {
			title: embroidery.translate( 'templates_no_results_title' ),
			message: embroidery.translate( 'templates_no_results_message' )
		},
		noFavorites: {
			title: embroidery.translate( 'templates_no_favorites_title' ),
			message: embroidery.translate( 'templates_no_favorites_message' )
		}
	},

	getCurrentMode: function() {
		if ( embroidery.templates.getFilter( 'text' ) ) {
			return 'noResults';
		}

		if ( embroidery.templates.getFilter( 'favorite' ) ) {
			return 'noFavorites';
		}

		return 'empty';
	},

	onRender: function() {
		var modeStrings = this.modesStrings[ this.getCurrentMode() ];

		this.ui.title.html( modeStrings.title );

		this.ui.message.html( modeStrings.message );
	}
} );

module.exports = TemplateLibraryTemplatesEmptyView;

},{}],24:[function(require,module,exports){
var TemplateLibraryTemplateLocalView = require( 'embroidery-templates/views/template/local' ),
	TemplateLibraryTemplateRemoteView = require( 'embroidery-templates/views/template/remote' ),
	TemplateLibraryCollectionView;

TemplateLibraryCollectionView = Marionette.CompositeView.extend( {
	template: '#tmpl-embroidery-template-library-templates',

	id: 'embroidery-template-library-templates',

	childViewContainer: '#embroidery-template-library-templates-container',

	reorderOnSort: true,

	emptyView: function() {
		var EmptyView = require( 'embroidery-templates/views/parts/templates-empty' );

		return new EmptyView();
	},

	ui: {
		filterText: '#embroidery-template-library-filter-text',
		myFavoritesFilter: '#embroidery-template-library-filter-my-favorites',
		orderInputs: '.embroidery-template-library-order-input',
		orderLabels: '.embroidery-template-library-order-label'
	},

	events: {
		'input @ui.filterText': 'onFilterTextInput',
		'change @ui.myFavoritesFilter': 'onMyFavoritesFilterChange',
		'mousedown @ui.orderLabels': 'onOrderLabelsClick'
	},

	comparators: {
		title: function( model ) {
			return model.get( 'title' ).toLowerCase();
		},
		popularityIndex: function( model ) {
			var popularityIndex = model.get( 'popularityIndex' );

			if ( ! popularityIndex ) {
				popularityIndex = model.get( 'date' );
			}

			return -popularityIndex;
		},
		trendIndex: function( model ) {
			var trendIndex = model.get( 'trendIndex' );

			if ( ! trendIndex ) {
				trendIndex = model.get( 'date' );
			}

			return -trendIndex;
		}
	},

	getChildView: function( childModel ) {
		if ( 'remote' === childModel.get( 'source' ) ) {
			return TemplateLibraryTemplateRemoteView;
		}

		return TemplateLibraryTemplateLocalView;
	},

	initialize: function() {
		this.listenTo( embroidery.channels.templates, 'filter:change', this._renderChildren );
	},

	filter: function( childModel ) {
		var filterTerms = embroidery.templates.getFilterTerms(),
			passingFilter = true;

		jQuery.each( filterTerms, function( filterTermName ) {
			var filterValue = this.value || embroidery.templates.getFilter( filterTermName );

			if ( ! filterValue ) {
				return;
			}

			if ( this.callback ) {
				var callbackResult = this.callback.call( childModel, filterValue );

				if ( ! callbackResult ) {
					passingFilter = false;
				}

				return callbackResult;
			}

			var filterResult = filterValue === childModel.get( filterTermName );

			if ( ! filterResult ) {
				passingFilter = false;
			}

			return filterResult;
		} );

		return passingFilter;
	},

	order: function( by, reverseOrder ) {
		var comparator = this.comparators[ by ] || by;

		if ( reverseOrder ) {
			comparator = this.reverseOrder( comparator );
		}

		this.collection.comparator = comparator;

		this.collection.sort();
	},

	reverseOrder: function( comparator ) {
		if ( 'function' !== typeof comparator ) {
			var comparatorValue = comparator;

			comparator = function( model ) {
				return model.get( comparatorValue );
			};
		}

		return function( left, right ) {
			var l = comparator( left ),
				r = comparator( right );

			if ( undefined === l ) {
				return -1;
			}

			if ( undefined === r ) {
				return 1;
			}

			return l < r ? 1 : l > r ? -1 : 0;
		};
	},

	addSourceData: function() {
		var isEmpty = this.children.isEmpty();

		this.$el.attr( 'data-template-source', isEmpty ? 'empty' : embroidery.templates.getFilter( 'source' ) );
	},

	toggleFilterClass: function() {
		this.$el.toggleClass( 'embroidery-templates-filter-active', !! ( embroidery.templates.getFilter( 'text' ) || embroidery.templates.getFilter( 'favorite' ) ) );
	},

	onRenderCollection: function() {
		this.addSourceData();

		this.toggleFilterClass();
	},

	onBeforeRenderEmpty: function() {
		this.addSourceData();
	},

	onFilterTextInput: function() {
		embroidery.templates.setFilter( 'text', this.ui.filterText.val() );
	},

	onMyFavoritesFilterChange: function(  ) {
		embroidery.templates.setFilter( 'favorite', this.ui.myFavoritesFilter[0].checked );
	},

	onOrderLabelsClick: function( event ) {
		var $clickedInput = jQuery( event.currentTarget.control ),
			toggle;

		if ( ! $clickedInput[0].checked ) {
			toggle = 'asc' !== $clickedInput.data( 'default-ordering-direction' );
		}

		$clickedInput.toggleClass( 'embroidery-template-library-order-reverse', toggle );

		this.order( $clickedInput.val(), $clickedInput.hasClass( 'embroidery-template-library-order-reverse' ) );
	}
} );

module.exports = TemplateLibraryCollectionView;

},{"embroidery-templates/views/parts/templates-empty":23,"embroidery-templates/views/template/local":26,"embroidery-templates/views/template/remote":27}],25:[function(require,module,exports){
var TemplateLibraryInsertTemplateBehavior = require( 'embroidery-templates/behaviors/insert-template' ),
	TemplateLibraryTemplateView;

TemplateLibraryTemplateView = Marionette.ItemView.extend( {
	className: function() {
		var classes = 'embroidery-template-library-template embroidery-template-library-template-' + this.model.get( 'source' );

		if ( this.model.get( 'isPro' ) ) {
			classes += ' embroidery-template-library-pro-template';
		}

		return classes;
	},

	ui: function() {
		return {
			previewButton: '.embroidery-template-library-template-preview'
		};
	},

	events: function() {
		return {
			'click @ui.previewButton': 'onPreviewButtonClick'
		};
	},

	behaviors: {
		insertTemplate: {
			behaviorClass: TemplateLibraryInsertTemplateBehavior
		}
	}
} );

module.exports = TemplateLibraryTemplateView;

},{"embroidery-templates/behaviors/insert-template":8}],26:[function(require,module,exports){
var TemplateLibraryTemplateView = require( 'embroidery-templates/views/template/base' ),
	TemplateLibraryTemplateLocalView;

TemplateLibraryTemplateLocalView = TemplateLibraryTemplateView.extend( {
	template: '#tmpl-embroidery-template-library-template-local',

	ui: function() {
		return _.extend( TemplateLibraryTemplateView.prototype.ui.apply( this, arguments ), {
			deleteButton: '.embroidery-template-library-template-delete',
			morePopup: '.embroidery-template-library-template-more',
			toggleMore: '.embroidery-template-library-template-more-toggle',
			toggleMoreIcon: '.embroidery-template-library-template-more-toggle i'
		} );
	},

	events: function() {
		return _.extend( TemplateLibraryTemplateView.prototype.events.apply( this, arguments ), {
			'click @ui.deleteButton': 'onDeleteButtonClick',
			'click @ui.toggleMore': 'onToggleMoreClick'
		} );
	},

	onDeleteButtonClick: function() {
		var toggleMoreIcon = this.ui.toggleMoreIcon;

		embroidery.templates.deleteTemplate( this.model, {
			onConfirm: function() {
				toggleMoreIcon.removeClass( 'eicon-ellipsis-h' ).addClass( 'fa fa-circle-o-notch fa-spin' );
			},
			onSuccess: function() {
				embroidery.templates.showTemplates();
			}
		} );
	},

	onToggleMoreClick: function() {
		this.ui.morePopup.show();
	},

	onPreviewButtonClick: function() {
		open( this.model.get( 'url' ), '_blank' );
	}
} );

module.exports = TemplateLibraryTemplateLocalView;

},{"embroidery-templates/views/template/base":25}],27:[function(require,module,exports){
var TemplateLibraryTemplateView = require( 'embroidery-templates/views/template/base' ),
	TemplateLibraryTemplateRemoteView;

TemplateLibraryTemplateRemoteView = TemplateLibraryTemplateView.extend( {
	template: '#tmpl-embroidery-template-library-template-remote',

	ui: function() {
		return jQuery.extend( TemplateLibraryTemplateView.prototype.ui.apply( this, arguments ), {
			favoriteCheckbox: '.embroidery-template-library-template-favorite-input'
		} );
	},

	events: function() {
		return jQuery.extend( TemplateLibraryTemplateView.prototype.events.apply( this, arguments ), {
			'change @ui.favoriteCheckbox': 'onFavoriteCheckboxChange'
		} );
	},

	onPreviewButtonClick: function() {
		embroidery.templates.getLayout().showPreviewView( this.model );
	},

	onFavoriteCheckboxChange: function() {
		var isFavorite = this.ui.favoriteCheckbox[0].checked;

		this.model.set( 'favorite', isFavorite );

		embroidery.templates.markAsFavorite( this.model, isFavorite );

		if ( ! isFavorite && embroidery.templates.getFilter( 'favorite' ) ) {
			embroidery.channels.templates.trigger( 'filter:change' );
		}
	}
} );

module.exports = TemplateLibraryTemplateRemoteView;

},{"embroidery-templates/views/template/base":25}],28:[function(require,module,exports){
var Module = require( 'embroidery-utils/module' ),
	Validator;

Validator = Module.extend( {
	errors: [],

	__construct: function( settings ) {
		var customValidationMethod = settings.customValidationMethod;

		if ( customValidationMethod ) {
			this.validationMethod = customValidationMethod;
		}
	},

	getDefaultSettings: function() {
		return {
			validationTerms: {}
		};
	},

	isValid: function() {
		var validationErrors = this.validationMethod.apply( this, arguments );

		if ( validationErrors.length ) {
			this.errors = validationErrors;

			return false;
		}

		return true;
	},

	validationMethod: function( newValue ) {
		var validationTerms = this.getSettings( 'validationTerms' ),
			errors = [];

		if ( validationTerms.required ) {
			if ( ! ( '' + newValue ).length ) {
				errors.push( 'Required value is empty' );
			}
		}

		return errors;
	}
} );

module.exports = Validator;

},{"embroidery-utils/module":123}],29:[function(require,module,exports){
var Validator = require( 'embroidery-validator/base' );

module.exports = Validator.extend( {
	validationMethod: function( newValue ) {
		var validationTerms = this.getSettings( 'validationTerms' ),
			errors = [];

		if ( _.isFinite( newValue ) ) {
			if ( undefined !== validationTerms.min && newValue < validationTerms.min ) {
				errors.push( 'Value is less than minimum' );
			}

			if ( undefined !== validationTerms.max && newValue > validationTerms.max ) {
				errors.push( 'Value is greater than maximum' );
			}
		}

		return errors;
	}
} );

},{"embroidery-validator/base":28}],30:[function(require,module,exports){
var ControlBaseView = require( 'embroidery-controls/base' ),
	Validator = require( 'embroidery-validator/base' ),
	ControlBaseDataView;

ControlBaseDataView = ControlBaseView.extend( {

	ui: function() {
		var ui = ControlBaseView.prototype.ui.apply( this, arguments );

		_.extend( ui, {
			input: 'input[data-setting][type!="checkbox"][type!="radio"]',
			checkbox: 'input[data-setting][type="checkbox"]',
			radio: 'input[data-setting][type="radio"]',
			select: 'select[data-setting]',
			textarea: 'textarea[data-setting]',
			responsiveSwitchers: '.embroidery-responsive-switcher'
		} );

		return ui;
	},

	templateHelpers: function() {
		var controlData = ControlBaseView.prototype.templateHelpers.apply( this, arguments );

		controlData.data.controlValue = this.getControlValue();

		return controlData;
	},

	events: function() {
		return {
			'input @ui.input': 'onBaseInputChange',
			'change @ui.checkbox': 'onBaseInputChange',
			'change @ui.radio': 'onBaseInputChange',
			'input @ui.textarea': 'onBaseInputChange',
			'change @ui.select': 'onBaseInputChange',
			'click @ui.responsiveSwitchers': 'onSwitcherClick'
		};
	},

	initialize: function( options ) {
		ControlBaseView.prototype.initialize.apply( this, arguments );

		this.registerValidators();

		this.listenTo( this.elementSettingsModel, 'change:external:' + this.model.get( 'name' ), this.onSettingsExternalChange );
	},

	getControlValue: function() {
		return this.elementSettingsModel.get( this.model.get( 'name' ) );
	},

	setValue: function( value ) {
		this.setSettingsModel( value );
	},

	setSettingsModel: function( value ) {
		this.elementSettingsModel.set( this.model.get( 'name' ), value );

		this.triggerMethod( 'settings:change' );
	},

	applySavedValue: function() {
		this.setInputValue( '[data-setting="' + this.model.get( 'name' ) + '"]', this.getControlValue() );
	},

	getEditSettings: function( setting ) {
		var settings = this.getOption( 'elementEditSettings' ).toJSON();

		if ( setting ) {
			return settings[ setting ];
		}

		return settings;
	},

	setEditSetting: function( settingKey, settingValue ) {
		var settings = this.getOption( 'elementEditSettings' );

		settings.set( settingKey, settingValue );
	},

	getInputValue: function( input ) {
		var $input = this.$( input ),
			inputValue = $input.val(),
			inputType = $input.attr( 'type' );

		if ( -1 !== [ 'radio', 'checkbox' ].indexOf( inputType ) ) {
			return $input.prop( 'checked' ) ? inputValue : '';
		}

		if ( 'number' === inputType && _.isFinite( inputValue ) ) {
			return +inputValue;
		}

		// Temp fix for jQuery (< 3.0) that return null instead of empty array
		if ( 'SELECT' === input.tagName && $input.prop( 'multiple' ) && null === inputValue ) {
			inputValue = [];
		}

		return inputValue;
	},

	setInputValue: function( input, value ) {
		var $input = this.$( input ),
			inputType = $input.attr( 'type' );

		if ( 'checkbox' === inputType ) {
			$input.prop( 'checked', !! value );
		} else if ( 'radio' === inputType ) {
			$input.filter( '[value="' + value + '"]' ).prop( 'checked', true );
		} else {
			$input.val( value );
		}
	},

	addValidator: function( validator ) {
		this.validators.push( validator );
	},

	registerValidators: function() {
		this.validators = [];

		var validationTerms = {};

		if ( this.model.get( 'required' ) ) {
			validationTerms.required = true;
		}

		if ( ! jQuery.isEmptyObject( validationTerms ) ) {
			this.addValidator( new Validator( {
				validationTerms: validationTerms
			} ) );
		}
	},

	onSettingsError: function() {
		this.$el.addClass( 'embroidery-error' );
	},

	onSettingsChange: function() {
		this.$el.removeClass( 'embroidery-error' );
	},

	onRender: function() {
		ControlBaseView.prototype.onRender.apply( this, arguments );

		this.applySavedValue();

		this.renderResponsiveSwitchers();

		this.triggerMethod( 'ready' );

		this.toggleControlVisibility();

		this.addTooltip();
	},

	onBaseInputChange: function( event ) {
		clearTimeout( this.correctionTimeout );

		var input = event.currentTarget,
			value = this.getInputValue( input ),
			validators = this.validators.slice( 0 ),
			settingsValidators = this.elementSettingsModel.validators[ this.model.get( 'name' ) ];

		if ( settingsValidators ) {
			validators = validators.concat( settingsValidators );
		}

		if ( validators ) {
			var oldValue = this.getControlValue( input.dataset.setting );

			var isValidValue = validators.every( function( validator ) {
				return validator.isValid( value, oldValue );
			} );

			if ( ! isValidValue ) {
				this.correctionTimeout = setTimeout( this.setInputValue.bind( this, input, oldValue ), 1200 );

				return;
			}
		}

		this.updateElementModel( value, input );

		this.triggerMethod( 'input:change', event );
	},

	onSwitcherClick: function( event ) {
		var device = jQuery( event.currentTarget ).data( 'device' );

		embroidery.changeDeviceMode( device );

		this.triggerMethod( 'responsive:switcher:click', device );
	},

	onSettingsExternalChange: function() {
		this.applySavedValue();
		this.triggerMethod( 'after:external:change' );
	},

	renderResponsiveSwitchers: function() {
		if ( _.isEmpty( this.model.get( 'responsive' ) ) ) {
			return;
		}

		var templateHtml = Marionette.Renderer.render( '#tmpl-embroidery-control-responsive-switchers', this.model.attributes );

		this.ui.controlTitle.after( templateHtml );
	},

	onAfterExternalChange: function() {
		this.hideTooltip();
		this.render();
	},

	addTooltip: function() {
		// Create tooltip on controls
		this.$( '.tooltip-target' ).tipsy( {
			gravity: function() {
				// `n` for down, `s` for up
				var gravity = jQuery( this ).data( 'tooltip-pos' );

				if ( undefined !== gravity ) {
					return gravity;
				} else {
					return 'n';
				}
			},
			title: function() {
				return this.getAttribute( 'data-tooltip' );
			}
		} );
	},

	hideTooltip: function() {
		jQuery( '.tipsy' ).hide();
	},

	updateElementModel: function( value ) {
		this.setValue( value );
	}
}, {
	// Static methods
	getStyleValue: function( placeholder, controlValue ) {
		return controlValue;
	}
} );

module.exports = ControlBaseDataView;

},{"embroidery-controls/base":33,"embroidery-validator/base":28}],31:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlBaseMultipleItemView;

ControlBaseMultipleItemView = ControlBaseDataView.extend( {

	applySavedValue: function() {
		var values = this.getControlValue(),
			$inputs = this.$( '[data-setting]' ),
			self = this;

		_.each( values, function( value, key ) {
			var $input = $inputs.filter( function() {
				return key === this.dataset.setting;
			} );

			self.setInputValue( $input, value );
		} );
	},

	getControlValue: function( key ) {
		var values = this.elementSettingsModel.get( this.model.get( 'name' ) );

		if ( ! jQuery.isPlainObject( values ) ) {
			return {};
		}

		if ( key ) {
			var value = values[ key ];

			if ( undefined === value ) {
				value = '';
			}

			return value;
		}

		return embroidery.helpers.cloneObject( values );
	},

	setValue: function( key, value ) {
		var values = this.getControlValue();

		if ( 'object' === typeof key ) {
			_.each( key, function( internalValue, internalKey ) {
				values[ internalKey ] = internalValue;
			} );
		} else {
			values[ key ] = value;
		}

		this.setSettingsModel( values );
	},

	updateElementModel: function( value, input ) {
		var key = input.dataset.setting;

		this.setValue( key, value );
	}
}, {
	// Static methods
	getStyleValue: function( placeholder, controlValue ) {
		if ( ! _.isObject( controlValue ) ) {
			return ''; // invalid
		}

		return controlValue[ placeholder ];
	}
} );

module.exports = ControlBaseMultipleItemView;

},{"embroidery-controls/base-data":30}],32:[function(require,module,exports){
var ControlBaseMultipleItemView = require( 'embroidery-controls/base-multiple' ),
	ControlBaseUnitsItemView;

ControlBaseUnitsItemView = ControlBaseMultipleItemView.extend( {

	getCurrentRange: function() {
		return this.getUnitRange( this.getControlValue( 'unit' ) );
	},

	getUnitRange: function( unit ) {
		var ranges = this.model.get( 'range' );

		if ( ! ranges || ! ranges[ unit ] ) {
			return false;
		}

		return ranges[ unit ];
	}
} );

module.exports = ControlBaseUnitsItemView;

},{"embroidery-controls/base-multiple":31}],33:[function(require,module,exports){
var ControlBaseView;

ControlBaseView = Marionette.CompositeView.extend( {
	ui: function() {
		return {
			controlTitle: '.embroidery-control-title'
		};
	},

	behaviors: function() {
		var behaviors = {};

		return embroidery.hooks.applyFilters( 'controls/base/behaviors', behaviors, this );
	},

	getBehavior: function( name ) {
		return this._behaviors[ Object.keys( this.behaviors() ).indexOf( name ) ];
	},

	className: function() {
		// TODO: Any better classes for that?
		var classes = 'embroidery-control embroidery-control-' + this.model.get( 'name' ) + ' embroidery-control-type-' + this.model.get( 'type' ),
			modelClasses = this.model.get( 'classes' ),
			responsive = this.model.get( 'responsive' );

		if ( ! _.isEmpty( modelClasses ) ) {
			classes += ' ' + modelClasses;
		}

		if ( ! _.isEmpty( responsive ) ) {
			classes += ' embroidery-control-responsive-' + responsive.max;
		}

		return classes;
	},

	templateHelpers: function() {
		var controlData = {
			_cid: this.model.cid
		};

		return {
			data: _.extend( {}, this.model.toJSON(), controlData )
		};
	},

	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-embroidery-control-' + this.model.get( 'type' ) + '-content' );
	},

	initialize: function( options ) {
		this.elementSettingsModel = options.elementSettingsModel;

		var controlType = this.model.get( 'type' ),
			controlSettings = jQuery.extend( true, {}, embroidery.config.controls[ controlType ], this.model.attributes );

		this.model.set( controlSettings );

		this.listenTo( this.elementSettingsModel, 'change', this.toggleControlVisibility );
	},

	toggleControlVisibility: function() {
		var isVisible = embroidery.helpers.isActiveControl( this.model, this.elementSettingsModel.attributes );

		this.$el.toggleClass( 'embroidery-hidden-control', ! isVisible );

		embroidery.channels.data.trigger( 'scrollbar:update' );
	},

	onRender: function() {
		var layoutType = this.model.get( 'label_block' ) ? 'block' : 'inline',
			showLabel = this.model.get( 'show_label' ),
			elClasses = 'embroidery-label-' + layoutType;

		elClasses += ' embroidery-control-separator-' + this.model.get( 'separator' );

		if ( ! showLabel ) {
			elClasses += ' embroidery-control-hidden-label';
		}

		this.$el.addClass( elClasses );

		this.toggleControlVisibility();
	}
} );

module.exports = ControlBaseView;

},{}],34:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'embroidery-controls/base-multiple' ),
	ControlBoxShadowItemView;

ControlBoxShadowItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.sliders = '.embroidery-slider';
		ui.colors = '.embroidery-shadow-color-picker';

		return ui;
	},

	events: function() {
		return _.extend( ControlMultipleBaseItemView.prototype.events.apply( this, arguments ), {
			'slide @ui.sliders': 'onSlideChange'
		} );
	},

	initSliders: function() {
		var value = this.getControlValue();

		this.ui.sliders.each( function() {
			var $slider = jQuery( this ),
				$input = $slider.next( '.embroidery-slider-input' ).find( 'input' );

			$slider.slider( {
				value: value[ this.dataset.input ],
				min: +$input.attr( 'min' ),
				max: +$input.attr( 'max' )
			} );
		} );
	},

	initColors: function() {
		var self = this;

		embroidery.helpers.wpColorPicker( this.ui.colors, {
			change: function() {
				var $this = jQuery( this ),
					type = $this.data( 'setting' );

				self.setValue( type, $this.wpColorPicker( 'color' ) );
			},

			clear: function() {
				self.setValue( this.dataset.setting, '' );
			}
		} );
	},

	onInputChange: function( event ) {
		var type = event.currentTarget.dataset.setting,
			$slider = this.ui.sliders.filter( '[data-input="' + type + '"]' );

		$slider.slider( 'value', this.getControlValue( type ) );
	},

	onReady: function() {
		this.initSliders();
		this.initColors();
	},

	onSlideChange: function( event, ui ) {
		var type = event.currentTarget.dataset.input,
			$input = this.ui.input.filter( '[data-setting="' + type + '"]' );

		$input.val( ui.value );
		this.setValue( type, ui.value );
	},

	onBeforeDestroy: function() {
		this.ui.colors.each( function() {
			var $color = jQuery( this );

			if ( $color.wpColorPicker( 'instance' ) ) {
				$color.wpColorPicker( 'close' );
			}
		} );

		this.$el.remove();
	}
} );

module.exports = ControlBoxShadowItemView;

},{"embroidery-controls/base-multiple":31}],35:[function(require,module,exports){
var ControlBaseView = require( 'embroidery-controls/base' );

module.exports = ControlBaseView.extend( {

	ui: function() {
		var ui = ControlBaseView.prototype.ui.apply( this, arguments );

		ui.button = 'button';

		return ui;
	},

	events: {
		'click @ui.button': 'onButtonClick'
	},

	onButtonClick: function() {
		var eventName = this.model.get( 'event' );

		embroidery.channels.editor.trigger( eventName, this );
	}
} );

},{"embroidery-controls/base":33}],36:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlChooseItemView;

ControlChooseItemView = ControlBaseDataView.extend( {
	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.inputs = '[type="radio"]';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseDataView.prototype.events.apply( this, arguments ), {
			'mousedown label': 'onMouseDownLabel',
			'click @ui.inputs': 'onClickInput',
			'change @ui.inputs': 'onBaseInputChange'
		} );
	},

	onMouseDownLabel: function( event ) {
		var $clickedLabel = this.$( event.currentTarget ),
			$selectedInput = this.$( '#' + $clickedLabel.attr( 'for' ) );

		$selectedInput.data( 'checked', $selectedInput.prop( 'checked' ) );
	},

	onClickInput: function( event ) {
		if ( ! this.model.get( 'toggle' ) ) {
			return;
		}

		var $selectedInput = this.$( event.currentTarget );

		if ( $selectedInput.data( 'checked' ) ) {
			$selectedInput.prop( 'checked', false ).trigger( 'change' );
		}
	},

	onRender: function() {
		ControlBaseDataView.prototype.onRender.apply( this, arguments );

		var currentValue = this.getControlValue();

		if ( currentValue ) {
			this.ui.inputs.filter( '[value="' + currentValue + '"]' ).prop( 'checked', true );
		}
	}
} );

module.exports = ControlChooseItemView;

},{"embroidery-controls/base-data":30}],37:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlCodeEditorItemView;

ControlCodeEditorItemView = ControlBaseDataView.extend( {

	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.editor = '.embroidery-code-editor';

		return ui;
	},

	onReady: function() {
		var self = this;

		if ( 'undefined' === typeof ace ) {
			return;
		}

		var langTools = ace.require( 'ace/ext/language_tools' );

		self.editor = ace.edit( this.ui.editor[0] );

		jQuery( self.editor.container ).addClass( 'embroidery-input-style embroidery-code-editor' );

		self.editor.setOptions( {
			mode: 'ace/mode/' + self.model.attributes.language,
			minLines: 10,
			maxLines: Infinity,
			showGutter: true,
			useWorker: true,
			enableBasicAutocompletion: true,
			enableLiveAutocompletion: true
		} );

		self.editor.getSession().setUseWrapMode( true );

		embroidery.panel.$el.on( 'resize.aceEditor', self.onResize.bind( this ) );

		if ( 'css' === self.model.attributes.language ) {
			var selectorCompleter = {
				getCompletions: function( editor, session, pos, prefix, callback ) {
					var list = [],
						token = session.getTokenAt( pos.row, pos.column );

					if ( 0 < prefix.length && 'selector'.match( prefix ) && 'constant' === token.type ) {
						list = [ {
							name: 'selector',
							value: 'selector',
							score: 1,
							meta: 'Embroidery'
						} ];
					}

					callback( null, list );
				}
			};

			langTools.addCompleter( selectorCompleter );
		}

		self.editor.setValue( self.getControlValue(), -1 ); // -1 =  move cursor to the start

		self.editor.on( 'change', function() {
			self.setValue( self.editor.getValue() );
		} );

		if ( 'html' === self.model.attributes.language ) {
			// Remove the `doctype` annotation
			var session = self.editor.getSession();

			session.on( 'changeAnnotation', function() {
				var annotations = session.getAnnotations() || [],
					annotationsLength = annotations.length,
					index = annotations.length;

				while ( index-- ) {
					if ( /doctype first\. Expected/.test( annotations[ index ].text ) ) {
						annotations.splice( index, 1 );
					}
				}

				if ( annotationsLength > annotations.length ) {
					session.setAnnotations( annotations );
				}
			} );
		}
	},

	onResize: function() {
		this.editor.resize();
	},

	onDestroy: function() {
		embroidery.panel.$el.off( 'resize.aceEditor' );
	}
} );

module.exports = ControlCodeEditorItemView;

},{"embroidery-controls/base-data":30}],38:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlColorItemView;

ControlColorItemView = ControlBaseDataView.extend( {
	onReady: function() {
		var self = this;

		embroidery.helpers.wpColorPicker( self.ui.input, {
			change: function() {
				self.ui.input.val( self.ui.input.wpColorPicker( 'color' ) ).trigger( 'input' );
			},
			clear: function() {
				self.setValue( '' );
			}
		} );
	},

	onBeforeDestroy: function() {
		if ( this.ui.input.wpColorPicker( 'instance' ) ) {
			this.ui.input.wpColorPicker( 'close' );
		}

		this.$el.remove();
	}
} );

module.exports = ControlColorItemView;

},{"embroidery-controls/base-data":30}],39:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlDateTimePickerItemView;

ControlDateTimePickerItemView = ControlBaseDataView.extend( {

	onReady: function() {
		var self = this;

		var options = _.extend( {
			onClose: function() {
				self.saveValue();
			},
			enableTime: true,
			minuteIncrement: 1
		}, this.model.get( 'picker_options' ) );

		this.ui.input.flatpickr( options );
	},

	saveValue: function() {
		this.setValue( this.ui.input.val() );
	},

	onBeforeDestroy: function() {
		this.saveValue();
		this.ui.input.flatpickr().destroy();
	}
} );

module.exports = ControlDateTimePickerItemView;

},{"embroidery-controls/base-data":30}],40:[function(require,module,exports){
var ControlBaseUnitsItemView = require( 'embroidery-controls/base-units' ),
	ControlDimensionsItemView;

ControlDimensionsItemView = ControlBaseUnitsItemView.extend( {
	ui: function() {
		var ui = ControlBaseUnitsItemView.prototype.ui.apply( this, arguments );

		ui.controls = '.embroidery-control-dimension > input:enabled';
		ui.link = 'button.embroidery-link-dimensions';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseUnitsItemView.prototype.events.apply( this, arguments ), {
			'click @ui.link': 'onLinkDimensionsClicked'
		} );
	},

	defaultDimensionValue: 0,

	initialize: function() {
		ControlBaseUnitsItemView.prototype.initialize.apply( this, arguments );

		// TODO: Need to be in helpers, and not in variable
		this.model.set( 'allowed_dimensions', this.filterDimensions( this.model.get( 'allowed_dimensions' ) ) );
	},

	getPossibleDimensions: function() {
		return [
			'top',
			'right',
			'bottom',
			'left'
		];
	},

	filterDimensions: function( filter ) {
		filter = filter || 'all';

		var dimensions = this.getPossibleDimensions();

		if ( 'all' === filter ) {
			return dimensions;
		}

		if ( ! _.isArray( filter ) ) {
			if ( 'horizontal' === filter ) {
				filter = [ 'right', 'left' ];
			} else if ( 'vertical' === filter ) {
				filter = [ 'top', 'bottom' ];
			}
		}

		return filter;
	},

	onReady: function() {
		var self = this,
			currentValue = self.getControlValue();

		if ( ! self.isLinkedDimensions() ) {
			self.ui.link.addClass( 'unlinked' );

			self.ui.controls.each( function( index, element ) {
				var value = currentValue[ element.dataset.setting ];

				if ( _.isEmpty( value ) ) {
					value = self.defaultDimensionValue;
				}

				self.$( element ).val( value );
			} );
		}

		self.fillEmptyDimensions();
	},

	updateDimensionsValue: function() {
		var currentValue = {},
			dimensions = this.getPossibleDimensions(),
			$controls = this.ui.controls,
			defaultDimensionValue = this.defaultDimensionValue;

		dimensions.forEach( function( dimension ) {
			var $element = $controls.filter( '[data-setting="' + dimension + '"]' );

			currentValue[ dimension ] = $element.length ? $element.val() : defaultDimensionValue;
		} );

		this.setValue( currentValue );
	},

	fillEmptyDimensions: function() {
		var dimensions = this.getPossibleDimensions(),
			allowedDimensions = this.model.get( 'allowed_dimensions' ),
			$controls = this.ui.controls,
			defaultDimensionValue = this.defaultDimensionValue;

		if ( this.isLinkedDimensions() ) {
			return;
		}

		dimensions.forEach( function( dimension ) {
			var $element = $controls.filter( '[data-setting="' + dimension + '"]' ),
				isAllowedDimension = -1 !== _.indexOf( allowedDimensions, dimension );

			if ( isAllowedDimension && $element.length && _.isEmpty( $element.val() ) ) {
				$element.val( defaultDimensionValue );
			}

		} );
	},

	updateDimensions: function() {
		this.fillEmptyDimensions();
		this.updateDimensionsValue();
	},

	resetDimensions: function() {
		this.ui.controls.val( '' );

		this.updateDimensionsValue();
	},

	onInputChange: function( event ) {
		var inputSetting = event.target.dataset.setting;

		if ( 'unit' === inputSetting ) {
			this.resetDimensions();
		}

		if ( ! _.contains( this.getPossibleDimensions(), inputSetting ) ) {
			return;
		}

		if ( this.isLinkedDimensions() ) {
			var $thisControl = this.$( event.target );

			this.ui.controls.val( $thisControl.val() );
		}

		this.updateDimensions();
	},

	onLinkDimensionsClicked: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		this.ui.link.toggleClass( 'unlinked' );

		this.setValue( 'isLinked', ! this.ui.link.hasClass( 'unlinked' ) );

		if ( this.isLinkedDimensions() ) {
			// Set all controls value from the first control.
			this.ui.controls.val( this.ui.controls.eq( 0 ).val() );
		}

		this.updateDimensions();
	},

	isLinkedDimensions: function() {
		return this.getControlValue( 'isLinked' );
	}
} );

module.exports = ControlDimensionsItemView;

},{"embroidery-controls/base-units":32}],41:[function(require,module,exports){
var ControlSelect2View = require( 'embroidery-controls/select2' );

module.exports = ControlSelect2View.extend( {
	getSelect2Options: function() {
		return {
			dir: embroidery.config.is_rtl ? 'rtl' : 'ltr'
		};
	},

	templateHelpers: function() {
		var helpers = ControlSelect2View.prototype.templateHelpers.apply( this, arguments ),
			fonts = this.model.get( 'options' );

		helpers.getFontsByGroups = function( groups ) {
			var filteredFonts = {};

			_.each( fonts, function( fontType, fontName ) {
				if ( _.isArray( groups ) && _.contains( groups, fontType ) || fontType === groups ) {
					filteredFonts[ fontName ] = fontType;
				}
			} );

			return filteredFonts;
		};

		return helpers;
	}
} );

},{"embroidery-controls/select2":52}],42:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlMediaItemView;

ControlMediaItemView = ControlBaseDataView.extend( {
	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.addImages = '.embroidery-control-gallery-add';
		ui.clearGallery = '.embroidery-control-gallery-clear';
		ui.galleryThumbnails = '.embroidery-control-gallery-thumbnails';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseDataView.prototype.events.apply( this, arguments ), {
			'click @ui.addImages': 'onAddImagesClick',
			'click @ui.clearGallery': 'onClearGalleryClick',
			'click @ui.galleryThumbnails': 'onGalleryThumbnailsClick'
		} );
	},

	onReady: function() {
		var hasImages = this.hasImages();

		this.$el
		    .toggleClass( 'embroidery-gallery-has-images', hasImages )
		    .toggleClass( 'embroidery-gallery-empty', ! hasImages );

		this.initRemoveDialog();
	},

	hasImages: function() {
		return !! this.getControlValue().length;
	},

	openFrame: function( action ) {
		this.initFrame( action );

		this.frame.open();
	},

	initFrame: function( action ) {
		var frameStates = {
			create: 'gallery',
			add: 'gallery-library',
			edit: 'gallery-edit'
		};

		var options = {
			frame:  'post',
			multiple: true,
			state: frameStates[ action ],
			button: {
				text: embroidery.translate( 'insert_media' )
			}
		};

		if ( this.hasImages() ) {
			options.selection = this.fetchSelection();
		}

		this.frame = wp.media( options );

		// When a file is selected, run a callback.
		this.frame.on( {
			'update': this.select,
			'menu:render:default': this.menuRender,
			'content:render:browse': this.gallerySettings
		}, this );
	},

	menuRender: function( view ) {
		view.unset( 'insert' );
		view.unset( 'featured-image' );
	},

	gallerySettings: function( browser ) {
		browser.sidebar.on( 'ready', function() {
			browser.sidebar.unset( 'gallery' );
		} );
	},

	fetchSelection: function() {
		var attachments = wp.media.query( {
			orderby: 'post__in',
			order: 'ASC',
			type: 'image',
			perPage: -1,
			post__in: _.pluck( this.getControlValue(), 'id' )
		} );

		return new wp.media.model.Selection( attachments.models, {
			props: attachments.props.toJSON(),
			multiple: true
		} );
	},

	/**
	 * Callback handler for when an attachment is selected in the media modal.
	 * Gets the selected image information, and sets it within the control.
	 */
	select: function( selection ) {
		var images = [];

		selection.each( function( image ) {
			images.push( {
				id: image.get( 'id' ),
				url: image.get( 'url' )
			} );
		} );

		this.setValue( images );

		this.render();
	},

	onBeforeDestroy: function() {
		if ( this.frame ) {
			this.frame.off();
		}

		this.$el.remove();
	},

	resetGallery: function() {
		this.setValue( '' );

		this.render();
	},

	initRemoveDialog: function() {
		var removeDialog;

		this.getRemoveDialog = function() {
			if ( ! removeDialog ) {
				removeDialog = embroidery.dialogsManager.createWidget( 'confirm', {
					message: embroidery.translate( 'dialog_confirm_gallery_delete' ),
					headerMessage: embroidery.translate( 'delete_gallery' ),
					strings: {
						confirm: embroidery.translate( 'delete' ),
						cancel: embroidery.translate( 'cancel' )
					},
					defaultOption: 'confirm',
					onConfirm: this.resetGallery.bind( this )
				} );
			}

			return removeDialog;
		};
	},

	onAddImagesClick: function() {
		this.openFrame( this.hasImages() ? 'add' : 'create' );
	},

	onClearGalleryClick: function() {
		this.getRemoveDialog().show();
	},

	onGalleryThumbnailsClick: function() {
		this.openFrame( 'edit' );
	}
} );

module.exports = ControlMediaItemView;

},{"embroidery-controls/base-data":30}],43:[function(require,module,exports){
var ControlSelect2View = require( 'embroidery-controls/select2' ),
	ControlIconView;

ControlIconView = ControlSelect2View.extend( {

	initialize: function() {
		ControlSelect2View.prototype.initialize.apply( this, arguments );

		this.filterIcons();
	},

	filterIcons: function() {
		var icons = this.model.get( 'options' ),
			include = this.model.get( 'include' ),
			exclude = this.model.get( 'exclude' );

		if ( include ) {
			var filteredIcons = {};

			_.each( include, function( iconKey ) {
				filteredIcons[ iconKey ] = icons[ iconKey ];
			} );

			this.model.set( 'options', filteredIcons );
			return;
		}

		if ( exclude ) {
			_.each( exclude, function( iconKey ) {
				delete icons[ iconKey ];
			} );
		}
	},

	iconsList: function( icon ) {
		if ( ! icon.id ) {
			return icon.text;
		}

		return jQuery(
			'<span><i class="' + icon.id + '"></i> ' + icon.text + '</span>'
		);
	},

	getSelect2Options: function() {
		return {
			allowClear: true,
			templateResult: this.iconsList.bind( this ),
			templateSelection: this.iconsList.bind( this )
		};
	}
} );

module.exports = ControlIconView;

},{"embroidery-controls/select2":52}],44:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'embroidery-controls/base-multiple' ),
	ControlImageDimensionsItemView;

ControlImageDimensionsItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		return {
			inputWidth: 'input[data-setting="width"]',
			inputHeight: 'input[data-setting="height"]',

			btnApply: 'button.embroidery-image-dimensions-apply-button'
		};
	},

	// Override the base events
	events: function() {
		return {
			'click @ui.btnApply': 'onApplyClicked'
		};
	},

	onApplyClicked: function( event ) {
		event.preventDefault();

		this.setValue( {
			width: this.ui.inputWidth.val(),
			height: this.ui.inputHeight.val()
		} );
	}
} );

module.exports = ControlImageDimensionsItemView;

},{"embroidery-controls/base-multiple":31}],45:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'embroidery-controls/base-multiple' ),
	ControlMediaItemView;

ControlMediaItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.controlMedia = '.embroidery-control-media';
		ui.frameOpeners = '.embroidery-control-media-upload-button, .embroidery-control-media-image';
		ui.deleteButton = '.embroidery-control-media-delete';

		return ui;
	},

	events: function() {
		return _.extend( ControlMultipleBaseItemView.prototype.events.apply( this, arguments ), {
			'click @ui.frameOpeners': 'openFrame',
			'click @ui.deleteButton': 'deleteImage'
		} );
	},

	onReady: function() {
		if ( _.isEmpty( this.getControlValue( 'url' ) ) ) {
			this.ui.controlMedia.addClass( 'media-empty' );
		}
	},

	openFrame: function() {
		if ( ! this.frame ) {
			this.initFrame();
		}

		this.frame.open();
	},

	deleteImage: function() {
		this.setValue( {
			url: '',
			id: ''
		} );

		this.render();
	},

	/**
	 * Create a media modal select frame, and store it so the instance can be reused when needed.
	 */
	initFrame: function() {
		this.frame = wp.media( {
			button: {
				text: embroidery.translate( 'insert_media' )
			},
			states: [
				new wp.media.controller.Library( {
					title: embroidery.translate( 'insert_media' ),
					library: wp.media.query( { type: 'image' } ),
					multiple: false,
					date: false
				} )
			]
		} );

		// When a file is selected, run a callback.
		this.frame.on( 'insert select', this.select.bind( this ) );
	},

	/**
	 * Callback handler for when an attachment is selected in the media modal.
	 * Gets the selected image information, and sets it within the control.
	 */
	select: function() {
		this.trigger( 'before:select' );

		// Get the attachment from the modal frame.
		var attachment = this.frame.state().get( 'selection' ).first().toJSON();

		if ( attachment.url ) {
			this.setValue( {
				url: attachment.url,
				id: attachment.id
			} );

			this.render();
		}

		this.trigger( 'after:select' );
	},

	onBeforeDestroy: function() {
		this.$el.remove();
	}
} );

module.exports = ControlMediaItemView;

},{"embroidery-controls/base-multiple":31}],46:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	NumberValidator = require( 'embroidery-validator/number' ),
	ControlNumberItemView;

ControlNumberItemView = ControlBaseDataView.extend( {

	registerValidators: function() {
		ControlBaseDataView.prototype.registerValidators.apply( this, arguments );

		var validationTerms = {},
			model = this.model;

		[ 'min', 'max' ].forEach( function( term ) {
			var termValue = model.get( term );

			if ( _.isFinite( termValue ) ) {
				validationTerms[ term ] = termValue;
			}
		} );

		if ( ! jQuery.isEmptyObject( validationTerms ) ) {
			this.addValidator( new NumberValidator( {
				validationTerms: validationTerms
			} ) );
		}
	}
} );

module.exports = ControlNumberItemView;

},{"embroidery-controls/base-data":30,"embroidery-validator/number":29}],47:[function(require,module,exports){
var ControlMultipleBaseItemView = require( 'embroidery-controls/base-multiple' ),
	ControlOrderItemView;

ControlOrderItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.reverseOrderLabel = '.embroidery-control-order-label';

		return ui;
	},

	changeLabelTitle: function() {
		var reverseOrder = this.getControlValue( 'reverse_order' );

		this.ui.reverseOrderLabel.attr( 'title', embroidery.translate( reverseOrder ? 'asc' : 'desc' ) );
	},

	onRender: function() {
		ControlMultipleBaseItemView.prototype.onRender.apply( this, arguments );

		this.changeLabelTitle();
	},

	onInputChange: function() {
		this.changeLabelTitle();
	}
} );

module.exports = ControlOrderItemView;

},{"embroidery-controls/base-multiple":31}],48:[function(require,module,exports){
var ControlChooseView = require( 'embroidery-controls/choose' ),
	ControlPopoverStarterView;

ControlPopoverStarterView = ControlChooseView.extend( {
	ui: function() {
		var ui = ControlChooseView.prototype.ui.apply( this, arguments );

		ui.popoverToggle = '.embroidery-control-popover-toggle-toggle';

		return ui;
	},

	events: function() {
		return _.extend( ControlChooseView.prototype.events.apply( this, arguments ), {
			'click @ui.popoverToggle': 'onPopoverToggleClick'
		} );
	},

	onPopoverToggleClick: function() {
		this.$el.next( '.embroidery-controls-popover' ).toggle();
	}
} );

module.exports = ControlPopoverStarterView;

},{"embroidery-controls/choose":36}],49:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	RepeaterRowView;

RepeaterRowView = Marionette.CompositeView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-repeater-row' ),

	className: 'repeater-fields',

	ui: {
		duplicateButton: '.embroidery-repeater-tool-duplicate',
		editButton: '.embroidery-repeater-tool-edit',
		removeButton: '.embroidery-repeater-tool-remove',
		itemTitle: '.embroidery-repeater-row-item-title'
	},

	behaviors: {
		HandleInnerTabs: {
			behaviorClass: require( 'embroidery-behaviors/inner-tabs' )
		}
	},

	triggers: {
		'click @ui.removeButton': 'click:remove',
		'click @ui.duplicateButton': 'click:duplicate',
		'click @ui.itemTitle': 'click:edit'
	},

	templateHelpers: function() {
		return {
			itemIndex: this.getOption( 'itemIndex' )
		};
	},

	childViewContainer: '.embroidery-repeater-row-controls',

	getChildView: function( item ) {
		var controlType = item.get( 'type' );

		return embroidery.getControlView( controlType );
	},

	childViewOptions: function() {
		return {
			elementSettingsModel: this.model
		};
	},

	checkConditions: function() {
		var self = this;

		self.collection.each( function( model ) {
			var conditions = model.get( 'conditions' ),
				parentConditions = model.get( 'parent_conditions' ),
				isVisible = true;

			if ( conditions ) {
				isVisible = embroidery.conditions.check( conditions, self.model.attributes );
			}

			if ( parentConditions ) {
				isVisible = embroidery.conditions.check( parentConditions, self.getOption( 'parentModel' ).attributes );
			}

			var child = self.children.findByModelCid( model.cid );

			child.$el.toggleClass( 'embroidery-panel-hide', ! isVisible );
		} );
	},

	updateIndex: function( newIndex ) {
		this.itemIndex = newIndex;
		this.setTitle();
	},

	setTitle: function() {
		var self = this,
			titleField = self.getOption( 'titleField' ),
			title = '';

		if ( titleField ) {
			var values = {};

			self.children.each( function( child ) {
				if ( ! ( child instanceof ControlBaseDataView ) ) {
					return;
				}

				values[ child.model.get( 'name' ) ] = child.getControlValue();
			} );

			title = Marionette.TemplateCache.prototype.compileTemplate( titleField )( values );
		}

		if ( ! title ) {
			title = embroidery.translate( 'Item #{0}', [ self.getOption( 'itemIndex' ) ] );
		}

		self.ui.itemTitle.html( title );
	},

	initialize: function( options ) {
		var self = this;

		self.elementSettingsModel = options.elementSettingsModel;

		self.itemIndex = 0;

		// Collection for Controls list
		self.collection = new Backbone.Collection( options.controlFields );

		self.listenTo( self.model, 'change', self.checkConditions );
		self.listenTo( self.getOption( 'parentModel' ), 'change', self.checkConditions );

		if ( options.titleField ) {
			self.listenTo( self.model, 'change', self.setTitle );
		}
	},

	onRender: function() {
		this.setTitle();
		this.checkConditions();
	},

	onChildviewResponsiveSwitcherClick: function( childView, device ) {
		if ( 'desktop' === device ) {
			embroidery.getPanelView().getCurrentPageView().$el.toggleClass( 'embroidery-responsive-switchers-open' );
		}
	}
} );

module.exports = RepeaterRowView;

},{"embroidery-behaviors/inner-tabs":68,"embroidery-controls/base-data":30}],50:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	RepeaterRowView = require( 'embroidery-controls/repeater-row' ),
	BaseSettingsModel = require( 'embroidery-elements/models/base-settings' ),
	ControlRepeaterItemView;

ControlRepeaterItemView = ControlBaseDataView.extend( {
	ui: {
		btnAddRow: '.embroidery-repeater-add',
		fieldContainer: '.embroidery-repeater-fields'
	},

	events: function() {
		return {
			'click @ui.btnAddRow': 'onButtonAddRowClick',
			'sortstart @ui.fieldContainer': 'onSortStart',
			'sortupdate @ui.fieldContainer': 'onSortUpdate',
			'sortstop @ui.fieldContainer': 'onSortStop'
		};
	},

	childView: RepeaterRowView,

	childViewContainer: '.embroidery-repeater-fields',

	templateHelpers: function() {
		return {
			data: _.extend( {}, this.model.toJSON(), { controlValue: [] } )
		};
	},

	childViewOptions: function() {
		return {
			controlFields: this.model.get( 'fields' ),
			titleField: this.model.get( 'title_field' ),
			parentModel: this.elementSettingsModel // For parentConditions in repeaterRow
		};
	},

	createItemModel: function( attrs, options, controlView ) {
		options = options || {};

		options.controls = controlView.model.get( 'fields' );

		if ( ! attrs._id ) {
			attrs._id = embroidery.helpers.getUniqueID();
		}

		return new BaseSettingsModel( attrs, options );
	},

	fillCollection: function() {
		var controlName = this.model.get( 'name' );
		this.collection = this.elementSettingsModel.get( controlName );

		if ( ! ( this.collection instanceof Backbone.Collection ) ) {
			this.collection = new Backbone.Collection( this.collection, {
				// Use `partial` to supply the `this` as an argument, but not as context
				// the `_` i sa place holder for original arguments: `attrs` & `options`
				model: _.partial( this.createItemModel, _, _, this )
			} );

			// Set the value silent
			this.elementSettingsModel.set( controlName, this.collection, { silent: true } );
			this.listenTo( this.collection, 'change', this.onRowControlChange );
			this.listenTo( this.collection, 'update', this.onRowUpdate, this );
		}
	},

	initialize: function( options ) {
		ControlBaseDataView.prototype.initialize.apply( this, arguments );

		this.fillCollection();

		this.listenTo( this.collection, 'change', this.onRowControlChange );
		this.listenTo( this.collection, 'update', this.onRowUpdate, this );
	},

	addRow: function( data, options ) {
		var id = embroidery.helpers.getUniqueID();

		if ( data instanceof Backbone.Model ) {
			data.set( '_id', id );
		} else {
			data._id = id;
		}

		return this.collection.add( data, options );
	},

	editRow: function( rowView ) {
		if ( this.currentEditableChild ) {
			var currentEditable = this.currentEditableChild.getChildViewContainer( this.currentEditableChild );
			currentEditable.removeClass( 'editable' );

			// If the repeater contains TinyMCE editors, fire the `hide` trigger to hide floated toolbars
			currentEditable.find( '.embroidery-wp-editor' ).each( function() {
				tinymce.get( this.id ).fire( 'hide' );
			} );
		}

		if ( this.currentEditableChild === rowView ) {
			delete this.currentEditableChild;
			return;
		}

		rowView.getChildViewContainer( rowView ).addClass( 'editable' );

		this.currentEditableChild = rowView;

		this.updateActiveRow();
	},

	toggleMinRowsClass: function() {
		if ( ! this.model.get( 'prevent_empty' ) ) {
			return;
		}

		this.$el.toggleClass( 'embroidery-repeater-has-minimum-rows', 1 >= this.collection.length );
	},

	updateActiveRow: function() {
		var activeItemIndex = 0;

		if ( this.currentEditableChild ) {
			activeItemIndex = this.currentEditableChild.itemIndex;
		}

		this.setEditSetting( 'activeItemIndex', activeItemIndex );
	},

	updateChildIndexes: function() {
		var collection = this.collection;

		this.children.each( function( view ) {
			view.updateIndex( collection.indexOf( view.model ) + 1 );
		} );
	},

	onRender: function() {
		ControlBaseDataView.prototype.onRender.apply( this, arguments );

		this.ui.fieldContainer.sortable( { axis: 'y', handle: '.embroidery-repeater-row-tools' } );

		this.toggleMinRowsClass();
	},

	onSortStart: function( event, ui ) {
		ui.item.data( 'oldIndex', ui.item.index() );
	},

	onSortStop: function( event, ui ) {
		// Reload TinyMCE editors (if exist), it's a bug that TinyMCE content is missing after stop dragging
		var self = this,
			sortedIndex = ui.item.index();

		if ( -1 === sortedIndex ) {
			return;
		}

		var sortedRowView = self.children.findByIndex( ui.item.index() ),
			rowControls = sortedRowView.children._views;

		jQuery.each( rowControls, function() {
			if ( 'wysiwyg' === this.model.get( 'type' ) ) {
				sortedRowView.render();

				delete self.currentEditableChild;

				return false;
			}
		} );
	},

	onSortUpdate: function( event, ui ) {
		var oldIndex = ui.item.data( 'oldIndex' ),
			model = this.collection.at( oldIndex ),
			newIndex = ui.item.index();

		this.collection.remove( model );

		this.addRow( model, { at: newIndex } );
	},

	onAddChild: function() {
		this.updateChildIndexes();
		this.updateActiveRow();
	},

	onRemoveChild: function( childView ) {
		if ( childView === this.currentEditableChild ) {
			delete this.currentEditableChild;
		}

		this.updateChildIndexes();
		this.updateActiveRow();
	},

	onRowUpdate: function( collection, event ) {
		// Simulate `changed` and `_previousAttributes` values
		var settings = this.elementSettingsModel,
			collectionCloned = collection.clone(),
			controlName = this.model.get( 'name' );

		if ( event.add ) {
			collectionCloned.remove( event.changes.added[0] );
		} else {
			collectionCloned.add( event.changes.removed[0], { at: event.index } );
		}

		settings.changed = {};
		settings.changed[ controlName ] = collection;

		settings._previousAttributes = {};
		settings._previousAttributes[ controlName ] = collectionCloned.toJSON();

		settings.trigger( 'change', settings,  settings._pending );

		delete settings.changed;
		delete settings._previousAttributes;

		this.toggleMinRowsClass();
	},

	onRowControlChange: function( model ) {
		// Simulate `changed` and `_previousAttributes` values
		var changed = Object.keys( model.changed );

		if ( ! changed.length ) {
			return;
		}

		var collectionCloned = model.collection.toJSON(),
			modelIndex = model.collection.findIndex( model ),
			element = this._parent.model,
			settings = element.get( 'settings' ),
			controlName = this.model.get( 'name' );

		// Save it with old values
		collectionCloned[ modelIndex ] = model._previousAttributes;

		settings.changed = {};
		settings.changed[ controlName ] =  model.collection;

		settings._previousAttributes = {};
		settings._previousAttributes[ controlName ] = collectionCloned;

		settings.trigger( 'change', settings );

		delete settings.changed;
		delete settings._previousAttributes;
	},

	onButtonAddRowClick: function() {
		var defaults = {};
		_.each( this.model.get( 'fields' ), function( field ) {
			defaults[ field.name ] = field['default'];
		} );

		var newModel = this.addRow( defaults ),
			newChildView = this.children.findByModel( newModel );

		this.editRow( newChildView );
		this.render();
	},

	onChildviewClickRemove: function( childView ) {
		childView.model.destroy();
		this.render();
	},

	onChildviewClickDuplicate: function( childView ) {
		var newModel = this.createItemModel( childView.model.toJSON(), {}, this );
		this.addRow( newModel, { at: childView.itemIndex } );
		this.render();
	},

	onChildviewClickEdit: function( childView ) {
		this.editRow( childView );
	},

	onAfterExternalChange: function() {
		// Update the collection with current value
		this.fillCollection();

		ControlBaseDataView.prototype.onAfterExternalChange.apply( this, arguments );
	}
} );

module.exports = ControlRepeaterItemView;

},{"embroidery-controls/base-data":30,"embroidery-controls/repeater-row":49,"embroidery-elements/models/base-settings":61}],51:[function(require,module,exports){
var ControlBaseView = require( 'embroidery-controls/base' ),
	ControlSectionItemView;

ControlSectionItemView = ControlBaseView.extend( {
	ui: function() {
		var ui = ControlBaseView.prototype.ui.apply( this, arguments );

		ui.heading = '.embroidery-panel-heading';

		return ui;
	},

	triggers: {
		'click': 'control:section:clicked'
	}
} );

module.exports = ControlSectionItemView;

},{"embroidery-controls/base":33}],52:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlSelect2ItemView;

ControlSelect2ItemView = ControlBaseDataView.extend( {
	getSelect2Options: function() {
		var placeholder = this.ui.select.children( 'option:first[value=""]' ).text();

		return {
			allowClear: true,
			placeholder: placeholder
		};
	},

	onReady: function() {
		this.ui.select.select2( this.getSelect2Options() );
	},

	onBeforeDestroy: function() {
		if ( this.ui.select.data( 'select2' ) ) {
			this.ui.select.select2( 'destroy' );
		}

		this.$el.remove();
	}
} );

module.exports = ControlSelect2ItemView;

},{"embroidery-controls/base-data":30}],53:[function(require,module,exports){
var ControlBaseUnitsItemView = require( 'embroidery-controls/base-units' ),
	ControlSliderItemView;

ControlSliderItemView = ControlBaseUnitsItemView.extend( {
	ui: function() {
		var ui = ControlBaseUnitsItemView.prototype.ui.apply( this, arguments );

		ui.slider = '.embroidery-slider';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseUnitsItemView.prototype.events.apply( this, arguments ), {
			'slide @ui.slider': 'onSlideChange'
		} );
	},

	initSlider: function() {
		var size = this.getControlValue( 'size' ),
			unitRange = this.getCurrentRange();

		this.ui.input.attr( unitRange ).val( size );

		this.ui.slider.slider( _.extend( {}, unitRange, { value: size } ) );
	},

	resetSize: function() {
		this.setValue( 'size', '' );

		this.initSlider();
	},

	onReady: function() {
		this.initSlider();
	},

	onSlideChange: function( event, ui ) {
		this.setValue( 'size', ui.value );

		this.ui.input.val( ui.value );
	},

	onInputChange: function( event ) {
		var dataChanged = event.currentTarget.dataset.setting;

		if ( 'size' === dataChanged ) {
			this.ui.slider.slider( 'value', this.getControlValue( 'size' ) );
		} else if ( 'unit' === dataChanged ) {
			this.resetSize();
		}
	},

	onBeforeDestroy: function() {
		if ( this.ui.slider.data( 'uiSlider' ) ) {
			this.ui.slider.slider( 'destroy' );
		}

		this.$el.remove();
	}
} );

module.exports = ControlSliderItemView;

},{"embroidery-controls/base-units":32}],54:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlStructureItemView;

ControlStructureItemView = ControlBaseDataView.extend( {
	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.resetStructure = '.embroidery-control-structure-reset';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseDataView.prototype.events.apply( this, arguments ), {
			'click @ui.resetStructure': 'onResetStructureClick'
		} );
	},

	templateHelpers: function() {
		var helpers = ControlBaseDataView.prototype.templateHelpers.apply( this, arguments );

		helpers.getMorePresets = this.getMorePresets.bind( this );

		return helpers;
	},

	getCurrentEditedSection: function() {
		var editor = embroidery.getPanelView().getCurrentPageView();

		return editor.getOption( 'editedElementView' );
	},

	getMorePresets: function() {
		var parsedStructure = embroidery.presetsFactory.getParsedStructure( this.getControlValue() );

		return embroidery.presetsFactory.getPresets( parsedStructure.columnsCount );
	},

	onInputChange: function() {
		this.getCurrentEditedSection().redefineLayout();

		this.render();
	},

	onResetStructureClick: function() {
		this.getCurrentEditedSection().resetColumnsCustomSize();
	}
} );

module.exports = ControlStructureItemView;

},{"embroidery-controls/base-data":30}],55:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' );

module.exports = ControlBaseDataView.extend( {
	setInputValue: function( input, value ) {
		// Make sure is string value
		// TODO: Remove in v1.6
		value = '' + value;

		this.$( input ).prop( 'checked', this.model.get( 'return_value' ) === value );
	}
} );

},{"embroidery-controls/base-data":30}],56:[function(require,module,exports){
var ControlBaseView = require( 'embroidery-controls/base' ),
	ControlTabItemView;

ControlTabItemView = ControlBaseView.extend( {
	triggers: {
		'click': {
			event: 'control:tab:clicked',
			stopPropagation: false
		}
	}
} );

module.exports = ControlTabItemView;

},{"embroidery-controls/base":33}],57:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlWPWidgetItemView;

ControlWPWidgetItemView = ControlBaseDataView.extend( {
	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.form = 'form';
		ui.loading = '.wp-widget-form-loading';

		return ui;
	},

	events: function() {
		return {
			'keyup @ui.form :input': 'onFormChanged',
			'change @ui.form :input': 'onFormChanged'
		};
	},

	onFormChanged: function() {
		var idBase = 'widget-' + this.model.get( 'id_base' ),
			settings = this.ui.form.embroiderySerializeObject()[ idBase ].REPLACE_TO_ID;

		this.setValue( settings );
	},

	onReady: function() {
		var self = this;

		embroidery.ajax.send( 'editor_get_wp_widget_form', {
			data: {
				// Fake Widget ID
				id: self.model.cid,
				widget_type: self.model.get( 'widget' ),
				data: JSON.stringify( self.elementSettingsModel.toJSON() )
			},
			success: function( data ) {
				self.ui.form.html( data );
				// WP >= 4.8
				if ( wp.textWidgets ) {
					self.ui.form.addClass( 'open' );
					var event = new jQuery.Event( 'widget-added' );
					wp.textWidgets.handleWidgetAdded( event, self.ui.form );
					wp.mediaWidgets.handleWidgetAdded( event, self.ui.form );

					// WP >= 4.9
					if ( wp.customHtmlWidgets ) {
						wp.customHtmlWidgets.handleWidgetAdded( event, self.ui.form );
					}
				}

				embroidery.hooks.doAction( 'panel/widgets/' + self.model.get( 'widget' ) + '/controls/wp_widget/loaded', self );
			}
		} );
	}
} );

module.exports = ControlWPWidgetItemView;

},{"embroidery-controls/base-data":30}],58:[function(require,module,exports){
var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlWysiwygItemView;

ControlWysiwygItemView = ControlBaseDataView.extend( {

	events: function() {
		return _.extend( ControlBaseDataView.prototype.events.apply( this, arguments ), {
			'keyup textarea.embroidery-wp-editor': 'onBaseInputChange'
		} );
	},

	// List of buttons to move {buttonToMove: afterButton}
	buttons: {
		addToBasic: {
			underline: 'italic'
		},
		addToAdvanced: {},
		moveToAdvanced: {
			blockquote: 'removeformat',
			alignleft: 'blockquote',
			aligncenter: 'alignleft',
			alignright: 'aligncenter'
		},
		moveToBasic: {},
		removeFromBasic: [ 'unlink', 'wp_more' ],
		removeFromAdvanced: []
	},

	initialize: function() {
		ControlBaseDataView.prototype.initialize.apply( this, arguments );

		var self = this;

		self.editorID = 'embroiderywpeditor' + self.cid;

		// Wait a cycle before initializing the editors.
		_.defer( function() {
			// Initialize QuickTags, and set as the default mode.
			quicktags( {
				buttons: 'strong,em,del,link,img,close',
				id: self.editorID
			} );

			if ( embroidery.config.rich_editing_enabled ) {
				switchEditors.go( self.editorID, 'tmce' );
			}

			delete QTags.instances[ 0 ];
		} );

		if ( ! embroidery.config.rich_editing_enabled ) {
			self.$el.addClass( 'embroidery-rich-editing-disabled' );

			return;
		}

		var editorConfig = {
			id: self.editorID,
			selector: '#' + self.editorID,
			setup: function( editor ) {
				// Save the bind callback to allow overwrite it externally
				self.saveEditor = self.saveEditor.bind( self, editor );

				editor.on( 'keyup change undo redo SetContent', self.saveEditor );
			}
		};

		tinyMCEPreInit.mceInit[ self.editorID ] = _.extend( _.clone( tinyMCEPreInit.mceInit.embroiderywpeditor ), editorConfig );

		if ( ! embroidery.config.tinymceHasCustomConfig ) {
			self.rearrangeButtons();
		}
	},

	saveEditor: function( editor ) {
		editor.save();

		this.setValue( editor.getContent() );
	},

	attachElContent: function() {
		var editorTemplate = embroidery.config.wp_editor.replace( /embroiderywpeditor/g, this.editorID ).replace( '%%EDITORCONTENT%%', this.getControlValue() );

		this.$el.html( editorTemplate );

		return this;
	},

	moveButtons: function( buttonsToMove, from, to ) {
		if ( ! to ) {
			to = from;

			from = null;
		}

		_.each( buttonsToMove, function( afterButton, button ) {
			var afterButtonIndex = to.indexOf( afterButton );

			if ( from ) {
				var buttonIndex = from.indexOf( button );

				if ( -1 === buttonIndex ) {
					throw new ReferenceError( 'Trying to move non-existing button `' + button + '`' );
				}

				from.splice( buttonIndex, 1 );
			}

			if ( -1 === afterButtonIndex ) {
				throw new ReferenceError( 'Trying to move button after non-existing button `' + afterButton + '`' );
			}

			to.splice( afterButtonIndex + 1, 0, button );
		} );
	},

	rearrangeButtons: function() {
		var editorProps = tinyMCEPreInit.mceInit[ this.editorID ],
			editorBasicToolbarButtons = editorProps.toolbar1.split( ',' ),
			editorAdvancedToolbarButtons = editorProps.toolbar2.split( ',' );

		editorBasicToolbarButtons = _.difference( editorBasicToolbarButtons, this.buttons.removeFromBasic );

		editorAdvancedToolbarButtons = _.difference( editorAdvancedToolbarButtons, this.buttons.removeFromAdvanced );

		this.moveButtons( this.buttons.moveToBasic, editorAdvancedToolbarButtons, editorBasicToolbarButtons );

		this.moveButtons( this.buttons.moveToAdvanced, editorBasicToolbarButtons, editorAdvancedToolbarButtons );

		this.moveButtons( this.buttons.addToBasic, editorBasicToolbarButtons );

		this.moveButtons( this.buttons.addToAdvanced, editorAdvancedToolbarButtons );

		editorProps.toolbar1 = editorBasicToolbarButtons.join( ',' );
		editorProps.toolbar2 = editorAdvancedToolbarButtons.join( ',' );
	},

	onAfterExternalChange: function() {
		var controlValue = this.getControlValue();

		tinymce.get( this.editorID ).setContent( controlValue );

		// Update also the plain textarea
		jQuery( '#' + this.editorID ).val( controlValue );
	},

	onBeforeDestroy: function() {
		// Remove TinyMCE and QuickTags instances
		delete QTags.instances[ this.editorID ];

		if ( ! embroidery.config.rich_editing_enabled ) {
			return;
		}

		tinymce.EditorManager.execCommand( 'mceRemoveEditor', true, this.editorID );

		// Cleanup PreInit data
		delete tinyMCEPreInit.mceInit[ this.editorID ];
		delete tinyMCEPreInit.qtInit[ this.editorID ];
	}
} );

module.exports = ControlWysiwygItemView;

},{"embroidery-controls/base-data":30}],59:[function(require,module,exports){
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

},{"./components/saver/behaviors/footer-saver":1,"embroidery-controls/base":33,"embroidery-controls/base-data":30,"embroidery-controls/base-multiple":31,"embroidery-controls/box-shadow":34,"embroidery-controls/button":35,"embroidery-controls/choose":36,"embroidery-controls/code":37,"embroidery-controls/color":38,"embroidery-controls/date-time":39,"embroidery-controls/dimensions":40,"embroidery-controls/font":41,"embroidery-controls/gallery":42,"embroidery-controls/icon":43,"embroidery-controls/image-dimensions":44,"embroidery-controls/media":45,"embroidery-controls/number":46,"embroidery-controls/order":47,"embroidery-controls/popover-toggle":48,"embroidery-controls/repeater":50,"embroidery-controls/repeater-row":49,"embroidery-controls/section":51,"embroidery-controls/select2":52,"embroidery-controls/slider":53,"embroidery-controls/structure":54,"embroidery-controls/switcher":55,"embroidery-controls/tab":56,"embroidery-controls/wp_widget":57,"embroidery-controls/wysiwyg":58,"embroidery-editor-utils/ajax":101,"embroidery-editor-utils/conditions":102,"embroidery-editor-utils/debug":104,"embroidery-editor-utils/heartbeat":105,"embroidery-editor-utils/helpers":106,"embroidery-editor-utils/images-manager":107,"embroidery-editor-utils/notifications":110,"embroidery-editor-utils/presets-factory":111,"embroidery-editor-utils/schemes":112,"embroidery-editor/components/saver/manager":2,"embroidery-editor/components/settings/settings":7,"embroidery-elements/collections/elements":60,"embroidery-elements/models/base-settings":61,"embroidery-elements/models/element":63,"embroidery-elements/views/widget":74,"embroidery-layouts/panel/panel":100,"embroidery-panel/pages/elements/views/elements":86,"embroidery-panel/pages/menu/menu":89,"embroidery-templates/manager":10,"embroidery-utils/hooks":121,"embroidery-utils/hot-keys":122,"embroidery-utils/module":123,"embroidery-views/controls-stack":119,"embroidery-views/preview":120,"modules/history/assets/js/module":132}],60:[function(require,module,exports){
var ElementModel = require( 'embroidery-elements/models/element' );

var ElementsCollection = Backbone.Collection.extend( {
	add: function( models, options, isCorrectSet ) {
		if ( ( ! options || ! options.silent ) && ! isCorrectSet ) {
			throw 'Call Error: Adding model to element collection is allowed only by the dedicated addChildModel() method.';
		}

		return Backbone.Collection.prototype.add.call( this, models, options );
	},

	model: function( attrs, options ) {
		var ModelClass = Backbone.Model;

		if ( attrs.elType ) {
			ModelClass = embroidery.hooks.applyFilters( 'element/model', ElementModel, attrs );
		}

		return new ModelClass( attrs, options );
	},

	clone: function() {
		var tempCollection = Backbone.Collection.prototype.clone.apply( this, arguments ),
			newCollection = new ElementsCollection();

		tempCollection.forEach( function( model ) {
			newCollection.add( model.clone(), null, true );
		} );

		return newCollection;
	}
} );

ElementsCollection.prototype.sync = ElementsCollection.prototype.fetch = ElementsCollection.prototype.save = _.noop;

module.exports = ElementsCollection;

},{"embroidery-elements/models/element":63}],61:[function(require,module,exports){
var BaseSettingsModel;

BaseSettingsModel = Backbone.Model.extend( {
	options: {},

	initialize: function( data, options ) {
		var self = this;

		if ( options ) {
			// Keep the options for cloning
			self.options = options;
		}

		self.controls = ( options && options.controls ) ? options.controls : embroidery.getElementControls( self );

		self.validators = {};

		if ( ! self.controls ) {
			return;
		}

		var attrs = data || {},
			defaults = {};

		_.each( self.controls, function( field ) {
			var control = embroidery.config.controls[ field.type ],
				isUIControl = -1 !== control.features.indexOf( 'ui' );

			if ( isUIControl ) {
				return;
			}

			// Check if the value is a plain object ( and not an array )
			var isMultipleControl = jQuery.isPlainObject( control.default_value );

			if ( isMultipleControl  ) {
				defaults[ field.name ] = _.extend( {}, control.default_value, field['default'] || {} );
			} else {
				defaults[ field.name ] = field['default'] || control.default_value;
			}

			if ( undefined !== attrs[ field.name ] ) {
				if ( isMultipleControl && ! _.isObject( attrs[ field.name ] ) ) {
					embroidery.debug.addCustomError(
						new TypeError( 'An invalid argument supplied as multiple control value' ),
						'InvalidElementData',
						'Element `' + ( self.get( 'widgetType' ) || self.get( 'elType' ) ) + '` got <' + attrs[ field.name ] + '> as `' + field.name + '` value. Expected array or object.'
					);

					delete attrs[ field.name ];
				}
			}

			if ( undefined === attrs[ field.name ] ) {
				attrs[ field.name ] = defaults[ field.name ];
			}
		} );

		self.defaults = defaults;

		self.handleRepeaterData( attrs );

		self.set( attrs );
	},

	handleRepeaterData: function( attrs ) {
		_.each( this.controls, function( field ) {
			if ( field.is_repeater ) {
				// TODO: Apply defaults on each field in repeater fields
				if ( ! ( attrs[ field.name ] instanceof Backbone.Collection ) ) {
					attrs[ field.name ] = new Backbone.Collection( attrs[ field.name ], {
						model: function( attrs, options ) {
							options = options || {};

							options.controls = field.fields;

							if ( ! attrs._id ) {
								attrs._id = embroidery.helpers.getUniqueID();
							}

							return new BaseSettingsModel( attrs, options );
						}
					} );
				}
			}
		} );
	},

	getFontControls: function() {
		return _.filter( this.getActiveControls(), function( control ) {
			return 'font' === control.type;
		} );
	},

	getStyleControls: function( controls ) {
		var self = this;

		controls = controls || self.getActiveControls();

		return _.filter( controls, function( control ) {
			if ( control.fields ) {
				control.styleFields = self.getStyleControls( control.fields );

				return true;
			}

			return self.isStyleControl( control.name, controls );
		} );
	},

	isStyleControl: function( attribute, controls ) {
		controls = controls || this.controls;

		var currentControl = _.find( controls, function( control ) {
			return attribute === control.name;
		} );

		return currentControl && ! _.isEmpty( currentControl.selectors );
	},

	getClassControls: function( controls ) {
		controls = controls || this.controls;

		return _.filter( controls, function( control ) {
			return ! _.isUndefined( control.prefix_class );
		} );
	},

	isClassControl: function( attribute ) {
		var currentControl = _.find( this.controls, function( control ) {
			return attribute === control.name;
		} );

		return currentControl && ! _.isUndefined( currentControl.prefix_class );
	},

	getControl: function( id ) {
		return _.find( this.controls, function( control ) {
			return id === control.name;
		} );
	},

	getActiveControls: function() {
		var self = this,
			controls = {};

		_.each( self.controls, function( control, controlKey ) {
			if ( embroidery.helpers.isActiveControl( control, self.attributes ) ) {
				controls[ controlKey ] = control;
			}
		} );

		return controls;
	},

	clone: function() {
		return new BaseSettingsModel( embroidery.helpers.cloneObject( this.attributes ), embroidery.helpers.cloneObject( this.options ) );
	},

	setExternalChange: function( key, value ) {
		this.set( key, value );

		this.trigger( 'change:external', key, value )
			.trigger( 'change:external:' + key, value );
	},

	toJSON: function( options ) {
		var data = Backbone.Model.prototype.toJSON.call( this );

		options = options || {};

		delete data.widgetType;
		delete data.elType;
		delete data.isInner;

		_.each( data, function( attribute, key ) {
			if ( attribute && attribute.toJSON ) {
				data[ key ] = attribute.toJSON();
			}
		} );

		if ( options.removeDefault ) {
			var controls = this.controls;

			_.each( data, function( value, key ) {
				var control = controls[ key ];

				if ( control ) {
					if ( ( 'text' === control.type || 'textarea' === control.type ) && data[ key ] ) {
						return;
					}

					if ( data[ key ] && 'object' === typeof data[ key ] ) {
						// First check length difference
						if ( Object.keys( data[ key ] ).length !== Object.keys( control[ 'default' ] ).length ) {
							return;
						}

						// If it's equal length, loop over value
						var isEqual = true;

						_.each( data[ key ], function( propertyValue, propertyKey ) {
							if ( data[ key ][ propertyKey ] !== control[ 'default' ][ propertyKey ] ) {
								return isEqual = false;
							}
						} );

						if ( isEqual ) {
							delete data[ key ];
						}
					} else {
						if ( data[ key ] === control[ 'default' ] ) {
							delete data[ key ];
						}
					}
				}
			} );
		}

		return data;
	}
} );

module.exports = BaseSettingsModel;

},{}],62:[function(require,module,exports){
var BaseSettingsModel = require( 'embroidery-elements/models/base-settings' ),
	ColumnSettingsModel;

ColumnSettingsModel = BaseSettingsModel.extend( {
	defaults: {
		_column_size: 100
	}
} );

module.exports = ColumnSettingsModel;

},{"embroidery-elements/models/base-settings":61}],63:[function(require,module,exports){
var BaseSettingsModel = require( 'embroidery-elements/models/base-settings' ),
	ColumnSettingsModel = require( 'embroidery-elements/models/column-settings' ),
	ElementModel;

ElementModel = Backbone.Model.extend( {
	defaults: {
		id: '',
		elType: '',
		isInner: false,
		settings: {},
		defaultEditSettings: {}
	},

	remoteRender: false,
	_htmlCache: null,
	_jqueryXhr: null,
	renderOnLeave: false,

	initialize: function( options ) {
		var elType = this.get( 'elType' ),
			elements = this.get( 'elements' );

		if ( undefined !== elements ) {
			var ElementsCollection = require( 'embroidery-elements/collections/elements' );

			this.set( 'elements', new ElementsCollection( elements ) );
		}

		if ( 'widget' === elType ) {
			this.remoteRender = true;
			this.setHtmlCache( options.htmlCache || '' );
		}

		// No need this variable anymore
		delete options.htmlCache;

		// Make call to remote server as throttle function
		this.renderRemoteServer = _.throttle( this.renderRemoteServer, 1000 );

		this.initSettings();

		this.initEditSettings();

		this.on( {
			destroy: this.onDestroy,
			'editor:close': this.onCloseEditor
		} );
	},

	initSettings: function() {
		var elType = this.get( 'elType' ),
			settings = this.get( 'settings' ),
			settingModels = {
				column: ColumnSettingsModel
			},
			SettingsModel = settingModels[ elType ] || BaseSettingsModel;

		if ( jQuery.isEmptyObject( settings ) ) {
			settings = embroidery.helpers.cloneObject( settings );
		}

		if ( 'widget' === elType ) {
			settings.widgetType = this.get( 'widgetType' );
		}

		settings.elType = elType;
		settings.isInner = this.get( 'isInner' );

		settings = new SettingsModel( settings );

		this.set( 'settings', settings );

		embroideryFrontend.config.elements.data[ this.cid ] = settings;
	},

	initEditSettings: function() {
		var editSettings = new Backbone.Model( this.get( 'defaultEditSettings' ) );

		this.set( 'editSettings', editSettings );

		embroideryFrontend.config.elements.editSettings[ this.cid ] = editSettings;
	},

	onDestroy: function() {
		// Clean the memory for all use instances
		var settings = this.get( 'settings' ),
			elements = this.get( 'elements' );

		if ( undefined !== elements ) {
			_.each( _.clone( elements.models ), function( model ) {
				model.destroy();
			} );
		}

		if ( settings instanceof BaseSettingsModel ) {
			settings.destroy();
		}
	},

	onCloseEditor: function() {
		this.initEditSettings();

		if ( this.renderOnLeave ) {
			this.renderRemoteServer();
		}
	},

	setSetting: function( key, value ) {
		var keyParts = key.split( '.' ),
			isRepeaterKey = 3 === keyParts.length,
			settings = this.get( 'settings' );

		key = keyParts[0];

		if ( isRepeaterKey ) {
			settings = settings.get( key ).models[ keyParts[1] ];

			key = keyParts[2];
		}

		settings.setExternalChange( key, value );
	},

	getSetting: function( key ) {
		var keyParts = key.split( '.' ),
			isRepeaterKey = 3 === keyParts.length,
			settings = this.get( 'settings' );

		key = keyParts[0];

		var value = settings.get( key );

		if ( undefined === value ) {
			return '';
		}

		if ( isRepeaterKey ) {
			value = value.models[ keyParts[1] ].get( keyParts[2] );
		}

		return value;
	},

	setHtmlCache: function( htmlCache ) {
		this._htmlCache = htmlCache;
	},

	getHtmlCache: function() {
		return this._htmlCache;
	},

	getTitle: function() {
		var elementData = embroidery.getElementData( this );

		return ( elementData ) ? elementData.title : 'Unknown';
	},

	getIcon: function() {
		var elementData = embroidery.getElementData( this );

		return ( elementData ) ? elementData.icon : 'unknown';
	},

	createRemoteRenderRequest: function() {
		var data = this.toJSON();

		return embroidery.ajax.send( 'render_widget', {
			data: {
				post_id: embroidery.config.post_id,
				data: JSON.stringify( data ),
				_nonce: embroidery.config.nonce
			},
			success: this.onRemoteGetHtml.bind( this )
		} );
	},

	renderRemoteServer: function() {
		if ( ! this.remoteRender ) {
			return;
		}

		this.renderOnLeave = false;

		this.trigger( 'before:remote:render' );

		if ( this.isRemoteRequestActive() ) {
			this._jqueryXhr.abort();
		}

		this._jqueryXhr = this.createRemoteRenderRequest();
	},

	isRemoteRequestActive: function() {
		return this._jqueryXhr && 4 !== this._jqueryXhr.readyState;
	},

	onRemoteGetHtml: function( data ) {
		this.setHtmlCache( data.render );
		this.trigger( 'remote:render' );
	},

	clone: function() {
		var newModel = new this.constructor( embroidery.helpers.cloneObject( this.attributes ) );

		newModel.set( 'id', embroidery.helpers.getUniqueID() );

		newModel.setHtmlCache( this.getHtmlCache() );

		var elements = this.get( 'elements' );

		if ( ! _.isEmpty( elements ) ) {
			newModel.set( 'elements', elements.clone() );
		}

		return newModel;
	},

	toJSON: function( options ) {
		options = _.extend( { copyHtmlCache: false }, options );

		// Call parent's toJSON method
		var data = Backbone.Model.prototype.toJSON.call( this );

		_.each( data, function( attribute, key ) {
			if ( attribute && attribute.toJSON ) {
				data[ key ] = attribute.toJSON( options );
			}
		} );

		if ( options.copyHtmlCache ) {
			data.htmlCache = this.getHtmlCache();
		} else {
			delete data.htmlCache;
		}

		return data;
	}

} );

ElementModel.prototype.sync = ElementModel.prototype.fetch = ElementModel.prototype.save = _.noop;

module.exports = ElementModel;

},{"embroidery-elements/collections/elements":60,"embroidery-elements/models/base-settings":61,"embroidery-elements/models/column-settings":62}],64:[function(require,module,exports){
var BaseSettingsModel = require( 'embroidery-elements/models/base-settings' ),
	ControlsCSSParser = require( 'embroidery-editor-utils/controls-css-parser' ),
	Validator = require( 'embroidery-validator/base' ),
	BaseContainer = require( 'embroidery-views/base-container' ),
	BaseElementView;

BaseElementView = BaseContainer.extend( {
	tagName: 'div',

	controlsCSSParser: null,

	toggleEditTools: true,

	allowRender: true,

	renderAttributes: {},

	className: function() {
		return 'embroidery-element embroidery-element-edit-mode ' + this.getElementUniqueID();
	},

	attributes: function() {
		var type = this.model.get( 'elType' );

		if ( 'widget'  === type ) {
			type = this.model.get( 'widgetType' );
		}

		return {
			'data-id': this.getID(),
			'data-element_type': type
		};
	},

	ui: function() {
		return {
			triggerButton: '> .embroidery-element-overlay .embroidery-editor-element-trigger',
			duplicateButton: '> .embroidery-element-overlay .embroidery-editor-element-duplicate',
			removeButton: '> .embroidery-element-overlay .embroidery-editor-element-remove',
			saveButton: '> .embroidery-element-overlay .embroidery-editor-element-save',
			settingsList: '> .embroidery-element-overlay .embroidery-editor-element-settings',
			addButton: '> .embroidery-element-overlay .embroidery-editor-element-add'
		};
	},

	behaviors: function() {
		var behaviors = {};

		return embroidery.hooks.applyFilters( 'elements/base/behaviors', behaviors, this );
	},

	getBehavior: function( name ) {
		return this._behaviors[ Object.keys( this.behaviors() ).indexOf( name ) ];
	},

	events: function() {
		return {
			'click @ui.removeButton': 'onClickRemove',
			'click @ui.saveButton': 'onClickSave',
			'click @ui.duplicateButton': 'onClickDuplicate',
			'click @ui.triggerButton': 'onClickEdit'
		};
	},

	getElementType: function() {
		return this.model.get( 'elType' );
	},

	getIDInt: function() {
		return parseInt( this.getID(), 16 );
	},

	getChildType: function() {
		return embroidery.helpers.getElementChildType( this.getElementType() );
	},

	getChildView: function( model ) {
		var ChildView,
			elType = model.get( 'elType' );

		if ( 'section' === elType ) {
			ChildView = require( 'embroidery-elements/views/section' );
		} else if ( 'column' === elType ) {
			ChildView = require( 'embroidery-elements/views/column' );
		} else {
			ChildView = embroidery.modules.WidgetView;
		}

		return embroidery.hooks.applyFilters( 'element/view', ChildView, model, this );
	},

	// TODO: backward compatibility method since 1.8.0
	templateHelpers: function() {
		var templateHelpers = BaseContainer.prototype.templateHelpers.apply( this, arguments );

		return jQuery.extend( templateHelpers, {
			editModel: this.getEditModel() // @deprecated. Use view.getEditModel() instead.
		} );
	},

	getTemplateType: function() {
		return 'js';
	},

	getEditModel: function() {
		return this.model;
	},

	initialize: function() {
		// grab the child collection from the parent model
		// so that we can render the collection as children
		// of this parent element
		this.collection = this.model.get( 'elements' );

		if ( this.collection ) {
			this.listenTo( this.collection, 'add remove reset', this.onCollectionChanged, this );
		}

		var editModel = this.getEditModel();

		this.listenTo( editModel.get( 'settings' ), 'change', this.onSettingsChanged, this );
		this.listenTo( editModel.get( 'editSettings' ), 'change', this.onEditSettingsChanged, this );

		this.initControlsCSSParser();
	},

	edit: function() {
		embroidery.getPanelView().openEditor( this.getEditModel(), this );
	},

	addElementFromPanel: function( options ) {
		var elementView = embroidery.channels.panelElements.request( 'element:selected' );

		var itemData = {
			id: embroidery.helpers.getUniqueID(),
			elType: elementView.model.get( 'elType' )
		};

		if ( 'widget' === itemData.elType ) {
			itemData.widgetType = elementView.model.get( 'widgetType' );
		} else if ( 'section' === itemData.elType ) {
			itemData.elements = [];
			itemData.isInner = true;
		} else {
			return;
		}

		var customData = elementView.model.get( 'custom' );

		if ( customData ) {
			_.extend( itemData, customData );
		}

		embroidery.channels.data.trigger( 'element:before:add', itemData );

		var newView = this.addChildElement( itemData, options );

		if ( 'section' === newView.getElementType() && newView.isInner() ) {
			newView.addEmptyColumn();
		}

		embroidery.channels.data.trigger( 'element:after:add', itemData );

	},

	addControlValidator: function( controlName, validationCallback ) {
		validationCallback = validationCallback.bind( this );

		var validator = new Validator( { customValidationMethod: validationCallback } ),
			validators = this.getEditModel().get( 'settings' ).validators;

		if ( ! validators[ controlName ] ) {
			validators[ controlName ] = [];
		}

		validators[ controlName ].push( validator );
	},

	addRenderAttribute: function( element, key, value, overwrite ) {
		var self = this;

		if ( 'object' === typeof element ) {
			jQuery.each( element, function( elementKey ) {
				self.addRenderAttribute( elementKey, this, null, overwrite );
			} );

			return self;
		}

		if ( 'object' === typeof key ) {
			jQuery.each( key, function( attributeKey ) {
				self.addRenderAttribute( element, attributeKey, this, overwrite );
			} );

			return self;
		}

		if ( ! self.renderAttributes[ element ] ) {
			self.renderAttributes[ element ] = {};
		}

		if ( ! self.renderAttributes[ element ][ key ] ) {
			self.renderAttributes[ element ][ key ] = [];
		}

		if ( ! Array.isArray( value ) ) {
			value = [ value ];
		}

		if ( overwrite ) {
			self.renderAttributes[ element ][ key ] = value;
		} else {
			self.renderAttributes[ element ][ key ] = self.renderAttributes[ element ][ key ].concat( value );
		}
	},

	getRenderAttributeString: function( element ) {
		if ( ! this.renderAttributes[ element ] ) {
			return '';
		}

		var renderAttributes = this.renderAttributes[ element ],
			attributes = [];

		jQuery.each( renderAttributes, function( attributeKey ) {
			attributes.push( attributeKey + '="' + _.escape( this.join( ' ' ) ) + '"' );
		} );

		return attributes.join( ' ' );
	},

	isCollectionFilled: function() {
		return false;
	},

	isInner: function() {
		return !! this.model.get( 'isInner' );
	},

	initControlsCSSParser: function() {
		this.controlsCSSParser = new ControlsCSSParser( { id: this.model.cid } );
	},

	enqueueFonts: function() {
		var editModel = this.getEditModel(),
			settings = editModel.get( 'settings' );

		_.each( settings.getFontControls(), function( control ) {
			var fontFamilyName = editModel.getSetting( control.name );

			if ( _.isEmpty( fontFamilyName ) ) {
				return;
			}

			embroidery.helpers.enqueueFont( fontFamilyName );
		} );
	},

	renderStyles: function( settings ) {
		if ( ! settings ) {
			settings = this.getEditModel().get( 'settings' );
		}

		this.controlsCSSParser.stylesheet.empty();

		this.controlsCSSParser.addStyleRules( settings.getStyleControls(), settings.attributes, this.getEditModel().get( 'settings' ).controls, [ /{{ID}}/g, /{{WRAPPER}}/g ], [ this.getID(), '#embroidery .' + this.getElementUniqueID() ] );

		this.controlsCSSParser.addStyleToDocument();

		var extraCSS = embroidery.hooks.applyFilters( 'editor/style/styleText', '', this );

		if ( extraCSS ) {
			this.controlsCSSParser.elements.$stylesheetElement.append( extraCSS );
		}
	},

	renderCustomClasses: function() {
		var self = this;

		var settings = self.getEditModel().get( 'settings' ),
			classControls = settings.getClassControls();

		// Remove all previous classes
		_.each( classControls, function( control ) {
			var previousClassValue = settings.previous( control.name );

			if ( control.classes_dictionary ) {
				if ( undefined !== control.classes_dictionary[ previousClassValue ] ) {
					previousClassValue = control.classes_dictionary[ previousClassValue ];
				}
			}

			self.$el.removeClass( control.prefix_class + previousClassValue );
		} );

		// Add new classes
		_.each( classControls, function( control ) {
			var value = settings.attributes[ control.name ],
				classValue = value;

			if ( control.classes_dictionary ) {
				if ( undefined !== control.classes_dictionary[ value ] ) {
					classValue = control.classes_dictionary[ value ];
				}
			}

			var isVisible = embroidery.helpers.isActiveControl( control, settings.attributes );

			if ( isVisible && ! _.isEmpty( classValue ) ) {
				self.$el
					.addClass( control.prefix_class + classValue )
					.addClass( _.result( self, 'className' ) );
			}
		} );
	},

	renderCustomElementID: function() {
		var customElementID = this.getEditModel().get( 'settings' ).get( '_element_id' );

		this.$el.attr( 'id', customElementID );
	},

	getModelForRender: function() {
		return embroidery.hooks.applyFilters( 'element/templateHelpers/editModel', this.getEditModel(), this );
	},

	renderUIOnly: function() {
		var editModel = this.getModelForRender();

		this.renderStyles( editModel.get( 'settings' ) );
		this.renderCustomClasses();
		this.renderCustomElementID();
		this.enqueueFonts();
	},

	renderUI: function() {
		this.renderStyles();
		this.renderCustomClasses();
		this.renderCustomElementID();
		this.enqueueFonts();
	},

	runReadyTrigger: function() {
		var self = this;

		_.defer( function() {
			embroideryFrontend.elementsHandler.runReadyTrigger( self.$el );
		} );
	},

	getID: function() {
		return this.model.get( 'id' );
	},

	getElementUniqueID: function() {
		return 'embroidery-element-' + this.getID();
	},

	duplicate: function() {
		this.trigger( 'request:duplicate' );
	},

	renderOnChange: function( settings ) {
		if ( ! this.allowRender ) {
			return;
		}

		// Make sure is correct model
		if ( settings instanceof BaseSettingsModel ) {
			var hasChanged = settings.hasChanged(),
				isContentChanged = ! hasChanged,
				isRenderRequired = ! hasChanged;

			_.each( settings.changedAttributes(), function( settingValue, settingKey ) {
				var control = settings.getControl( settingKey );

				if ( '_column_size' === settingKey ) {
					isRenderRequired = true;
					return;
				}

				if ( ! control ) {
					isRenderRequired = true;
					isContentChanged = true;
					return;
				}

				if ( 'none' !== control.render_type ) {
					isRenderRequired = true;
				}

				if ( -1 !== [ 'none', 'ui' ].indexOf( control.render_type ) ) {
					return;
				}

				if ( 'template' === control.render_type || ! settings.isStyleControl( settingKey ) && ! settings.isClassControl( settingKey ) && '_element_id' !== settingKey ) {
					isContentChanged = true;
				}
			} );

			if ( ! isRenderRequired ) {
				return;
			}

			if ( ! isContentChanged ) {
				this.renderUIOnly();
				return;
			}
		}

		// Re-render the template
		var templateType = this.getTemplateType(),
			editModel = this.getEditModel();

		if ( 'js' === templateType ) {
			this.getEditModel().setHtmlCache();
			this.render();
			editModel.renderOnLeave = true;
		} else {
			editModel.renderRemoteServer();
		}
	},

	onBeforeRender: function() {
		this.renderAttributes = {};
	},

	onRender: function() {
		var self = this;

		self.renderUI();

		self.runReadyTrigger();

		if ( self.toggleEditTools ) {
			var triggerButton = self.ui.triggerButton;

			self.ui.settingsList.hoverIntent( function() {
				triggerButton.addClass( 'embroidery-active' );
			}, function() {
				triggerButton.removeClass( 'embroidery-active' );
			}, { timeout: 500 } );
		}
	},

	onCollectionChanged: function() {
		embroidery.saver.setFlagEditorChange( true );
	},

	onEditSettingsChanged: function( changedModel ) {
		embroidery.channels.editor
			.trigger( 'change:editSettings', changedModel, this );
	},

	onSettingsChanged: function( changedModel ) {
		embroidery.saver.setFlagEditorChange( true );

		this.renderOnChange( changedModel );
	},

	onClickEdit: function( event ) {
		if ( ! jQuery( event.target ).closest( '.embroidery-clickable' ).length ) {
			event.preventDefault();

			event.stopPropagation();
		}

		var activeMode = embroidery.channels.dataEditMode.request( 'activeMode' );

		if ( 'edit' !== activeMode ) {
			return;
		}

		this.edit();
	},

	onClickDuplicate: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		this.duplicate();
	},

	removeElement: function() {
		embroidery.channels.data.trigger( 'element:before:remove', this.model );

		var parent = this._parent;

		parent.isManualRemoving = true;

		this.model.destroy();

		parent.isManualRemoving = false;

		embroidery.channels.data.trigger( 'element:after:remove', this.model );
	},

	onClickRemove: function( event ) {
		event.preventDefault();
		event.stopPropagation();
		this.removeElement();
	},

	onClickSave: function( event ) {
		event.preventDefault();

		var model = this.model;

		embroidery.templates.startModal( {
			onReady: function() {
				embroidery.templates.getLayout().showSaveTemplateView( model );
			}
		} );
	},

	onDestroy: function() {
		this.controlsCSSParser.removeStyleFromDocument();
	}
} );

module.exports = BaseElementView;

},{"embroidery-editor-utils/controls-css-parser":103,"embroidery-elements/models/base-settings":61,"embroidery-elements/views/column":72,"embroidery-elements/views/section":73,"embroidery-validator/base":28,"embroidery-views/base-container":117}],65:[function(require,module,exports){
var HandleAddDuplicateBehavior;

HandleAddDuplicateBehavior = Marionette.Behavior.extend( {

	onChildviewClickNew: function( childView ) {
		var currentIndex = childView.$el.index() + 1;

		this.addChild( { at: currentIndex } );
	},

	onRequestNew: function() {
		this.addChild();
	},

	addChild: function( options ) {
		if ( this.view.isCollectionFilled() ) {
			return;
		}

		options = options || {};

		var newItem = {
			id: embroidery.helpers.getUniqueID(),
			elType: this.view.getChildType()[0],
			settings: {},
			elements: []
		};

		embroidery.channels.data.trigger( 'element:before:add', newItem );

		this.view.addChildModel( newItem, options );

		embroidery.channels.data.trigger( 'element:after:add', newItem );
	}
} );

module.exports = HandleAddDuplicateBehavior;

},{}],66:[function(require,module,exports){
var HandleDuplicateBehavior;

HandleDuplicateBehavior = Marionette.Behavior.extend( {

	onChildviewRequestDuplicate: function( childView ) {
		if ( this.view.isCollectionFilled() ) {
			return;
		}

		var currentIndex = this.view.collection.indexOf( childView.model ),
			newModel = childView.model.clone();

		embroidery.channels.data.trigger( 'element:before:duplicate', newModel );

		this.view.addChildModel( newModel, { at: currentIndex + 1 } );

		embroidery.channels.data.trigger( 'element:after:duplicate', newModel );
	}
} );

module.exports = HandleDuplicateBehavior;

},{}],67:[function(require,module,exports){
var InlineEditingBehavior;

InlineEditingBehavior = Marionette.Behavior.extend( {
	editing: false,

	$currentEditingArea: null,

	ui: function() {
		return {
			inlineEditingArea: '.' + this.getOption( 'inlineEditingClass' )
		};
	},

	events: function() {
		return {
			'click @ui.inlineEditingArea': 'onInlineEditingClick',
			'input @ui.inlineEditingArea':'onInlineEditingUpdate'
		};
	},

	getEditingSettingKey: function() {
		return this.$currentEditingArea.data().embroiderySettingKey;
	},

	startEditing: function( $element ) {
		if (
			this.editing ||
			'edit' !== embroidery.channels.dataEditMode.request( 'activeMode' ) ||
			this.view.model.isRemoteRequestActive()
		) {
			return;
		}

		this.$currentEditingArea = $element;

		var elementData = this.$currentEditingArea.data(),
			elementDataToolbar = elementData.embroideryInlineEditingToolbar,
			mode = 'advanced' === elementDataToolbar ? 'advanced' : 'basic',
			editModel = this.view.getEditModel(),
			inlineEditingConfig = embroidery.config.inlineEditing,
			contentHTML = editModel.getSetting( this.getEditingSettingKey() );

		if ( 'advanced' === mode ) {
			contentHTML = wp.editor.autop( contentHTML );
		}

		/**
		 *  Replace rendered content with unrendered content.
		 *  This way the user can edit the original content, before shortcodes and oEmbeds are fired.
		 */
		this.$currentEditingArea.html( contentHTML );

		var EmbroideryInlineEditor = embroideryFrontend.getElements( 'window' ).EmbroideryInlineEditor;

		this.editing = true;

		this.view.allowRender = false;

		// Avoid retrieving of old content (e.g. in case of sorting)
		this.view.model.setHtmlCache( '' );

		this.editor = new EmbroideryInlineEditor( {
			linksInNewWindow: true,
			stay: false,
			editor: this.$currentEditingArea[0],
			mode: mode,
			list: 'none' === elementDataToolbar ? [] : inlineEditingConfig.toolbar[ elementDataToolbar || 'basic' ],
			cleanAttrs: ['id', 'class', 'name'],
			placeholder: embroidery.translate( 'type_here' ) + '...',
			toolbarIconsPrefix: 'eicon-editor-',
			toolbarIconsDictionary: {
				externalLink: {
					className: 'eicon-editor-external-link'
				},
				list: {
					className: 'eicon-editor-list-ul'
				},
				insertOrderedList: {
					className: 'eicon-editor-list-ol'
				},
				insertUnorderedList: {
					className: 'eicon-editor-list-ul'
				},
				createlink: {
					className: 'eicon-editor-link'
				},
				unlink: {
					className: 'eicon-editor-unlink'
				},
				blockquote: {
					className: 'eicon-editor-quote'
				},
				p: {
					className: 'eicon-editor-paragraph'
				},
				pre: {
					className: 'eicon-editor-code'
				}
			}
		} );

		var $menuItems = jQuery( this.editor._menu ).children();

		/**
		 * When the edit area is not focused (on blur) the inline editing is stopped.
		 * In order to prevent blur event when the user clicks on toolbar buttons while editing the
		 * content, we need the prevent their mousedown event. This also prevents the blur event.
		 */
		$menuItems.on( 'mousedown', function( event ) {
			event.preventDefault();
		} );

		this.$currentEditingArea.on( 'blur', this.onInlineEditingBlur.bind( this ) );
	},

	stopEditing: function() {
		this.editing = false;

		this.editor.destroy();

		this.view.allowRender = true;

		/**
		 * Inline editing has several toolbar types (advanced, basic and none). When editing is stopped,
		 * we need to rerender the area. To prevent multiple renderings, we will render only areas that
		 * use advanced toolbars.
		 */
		if ( 'advanced' === this.$currentEditingArea.data().embroideryInlineEditingToolbar ) {
			this.view.getEditModel().renderRemoteServer();
		}
	},

	onInlineEditingClick: function( event ) {
		var self = this,
			$targetElement = jQuery( event.currentTarget );

		/**
		 * When starting inline editing we need to set timeout, this allows other inline items to finish
		 * their operations before focusing new editing area.
		 */
		setTimeout( function() {
			self.startEditing( $targetElement );
		}, 30 );
	},

	onInlineEditingBlur: function() {
		var self = this;

		/**
		 * When exiting inline editing we need to set timeout, to make sure there is no focus on internal
		 * toolbar action. This prevent the blur and allows the user to continue the inline editing.
		 */
		setTimeout( function() {
			var selection = embroideryFrontend.getElements( 'window' ).getSelection(),
				$focusNode = jQuery( selection.focusNode );

			if ( $focusNode.closest( '.pen-input-wrapper' ).length ) {
				return;
			}

			self.stopEditing();
		}, 20 );
	},

	onInlineEditingUpdate: function() {
		this.view.getEditModel().setSetting( this.getEditingSettingKey(), this.editor.getContent() );
	}
} );

module.exports = InlineEditingBehavior;

},{}],68:[function(require,module,exports){
var InnerTabsBehavior;

InnerTabsBehavior = Marionette.Behavior.extend( {

	onRenderCollection: function() {
		this.handleInnerTabs( this.view );
	},

	handleInnerTabs: function( parent ) {
		var closedClass = 'embroidery-tab-close',
			activeClass = 'embroidery-tab-active',
			tabsWrappers = parent.children.filter( function( view ) {
				return 'tabs' === view.model.get( 'type' );
			} );

			_.each( tabsWrappers, function( view ) {
				view.$el.find( '.embroidery-control-content' ).remove();

				var tabsId = view.model.get( 'name' ),
				tabs = parent.children.filter( function( childView ) {
					return ( 'tab' === childView.model.get( 'type' ) && childView.model.get( 'tabs_wrapper' ) === tabsId );
				} );

				_.each( tabs, function( childView, index ) {
					view._addChildView( childView );

					var tabId = childView.model.get( 'name' ),
					controlsUnderTab = parent.children.filter( function( view ) {
						return ( tabId === view.model.get( 'inner_tab' ) );
					} );

					if ( 0 === index ) {
						childView.$el.addClass( activeClass );
					} else {
						_.each( controlsUnderTab, function( view ) {
							view.$el.addClass( closedClass );
						} );
					}
				} );
			} );
	},

	onChildviewControlTabClicked: function( childView ) {
		var closedClass = 'embroidery-tab-close',
			activeClass = 'embroidery-tab-active',
			tabClicked = childView.model.get( 'name' ),
			childrenUnderTab = this.view.children.filter( function( view ) {
				return ( 'tab' !== view.model.get( 'type' ) && childView.model.get( 'tabs_wrapper' ) === view.model.get( 'tabs_wrapper' ) );
			} ),
			siblingTabs = this.view.children.filter( function( view ) {
				return ( 'tab' === view.model.get( 'type' ) && childView.model.get( 'tabs_wrapper' ) === view.model.get( 'tabs_wrapper' ) );
			} );

			_.each( siblingTabs, function( view ) {
				view.$el.removeClass( activeClass );
			} );

			childView.$el.addClass( activeClass );

			_.each( childrenUnderTab, function( view ) {
				if ( view.model.get( 'inner_tab' ) === tabClicked ) {
					view.$el.removeClass( closedClass );
				} else {
					view.$el.addClass( closedClass );
				}
			} );

			embroidery.channels.data.trigger( 'scrollbar:update' );
	}
} );

module.exports = InnerTabsBehavior;

},{}],69:[function(require,module,exports){
var ResizableBehavior;

ResizableBehavior = Marionette.Behavior.extend( {
	defaults: {
		handles: embroidery.config.is_rtl ? 'w' : 'e'
	},

	events: {
		resizestart: 'onResizeStart',
		resizestop: 'onResizeStop',
		resize: 'onResize'
	},

	initialize: function() {
		Marionette.Behavior.prototype.initialize.apply( this, arguments );

		this.listenTo( embroidery.channels.dataEditMode, 'switch', this.onEditModeSwitched );
	},

	active: function() {
		this.deactivate();

		var options = _.clone( this.options );

		delete options.behaviorClass;

		var $childViewContainer = this.getChildViewContainer(),
			defaultResizableOptions = {},
			resizableOptions = _.extend( defaultResizableOptions, options );

		$childViewContainer.resizable( resizableOptions );
	},

	deactivate: function() {
		if ( this.getChildViewContainer().resizable( 'instance' ) ) {
			this.getChildViewContainer().resizable( 'destroy' );
		}
	},

	onEditModeSwitched: function( activeMode ) {
		if ( 'edit' === activeMode ) {
			this.active();
		} else {
			this.deactivate();
		}
	},

	onRender: function() {
		var self = this;

		_.defer( function() {
			self.onEditModeSwitched( embroidery.channels.dataEditMode.request( 'activeMode' ) );
		} );
	},

	onDestroy: function() {
		this.deactivate();
	},

	onResizeStart: function( event ) {
		event.stopPropagation();

		this.view.$el.data( 'originalWidth', this.view.el.getBoundingClientRect().width );

		this.view.triggerMethod( 'request:resize:start', event );
	},

	onResizeStop: function( event ) {
		event.stopPropagation();

		this.view.triggerMethod( 'request:resize:stop' );
	},

	onResize: function( event, ui ) {
		event.stopPropagation();

		this.view.triggerMethod( 'request:resize', ui, event );
	},

	getChildViewContainer: function() {
		return this.$el;
	}
} );

module.exports = ResizableBehavior;

},{}],70:[function(require,module,exports){
var SortableBehavior;

SortableBehavior = Marionette.Behavior.extend( {
	defaults: {
		elChildType: 'widget'
	},

	events: {
		'sortstart': 'onSortStart',
		'sortreceive': 'onSortReceive',
		'sortupdate': 'onSortUpdate',
		'sortover': 'onSortOver',
		'sortout': 'onSortOut'
	},

	initialize: function() {
		this.listenTo( embroidery.channels.dataEditMode, 'switch', this.onEditModeSwitched )
			.listenTo( embroidery.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	onEditModeSwitched: function( activeMode ) {
		if ( 'edit' === activeMode ) {
			this.activate();
		} else {
			this.deactivate();
		}
	},

	onDeviceModeChange: function() {
		var deviceMode = embroidery.channels.deviceMode.request( 'currentMode' );

		if ( 'desktop' === deviceMode ) {
			this.activate();
		} else {
			this.deactivate();
		}
	},

	onRender: function() {
		var self = this;

		_.defer( function() {
			self.onEditModeSwitched( embroidery.channels.dataEditMode.request( 'activeMode' ) );
		} );
	},

	onDestroy: function() {
		this.deactivate();
	},

	activate: function() {
		if ( this.getChildViewContainer().sortable( 'instance' ) ) {
			return;
		}

		var $childViewContainer = this.getChildViewContainer(),
			defaultSortableOptions = {
				connectWith: $childViewContainer.selector,
				placeholder: 'embroidery-sortable-placeholder embroidery-' + this.getOption( 'elChildType' ) + '-placeholder',
				cursorAt: {
					top: 20,
					left: 25
				},
				helper: this._getSortableHelper.bind( this ),
				cancel: 'input, textarea, button, select, option, .embroidery-inline-editing, .embroidery-tab-title'

			},
			sortableOptions = _.extend( defaultSortableOptions, this.view.getSortableOptions() );

		$childViewContainer.sortable( sortableOptions );
	},

	_getSortableHelper: function( event, $item ) {
		var model = this.view.collection.get( {
			cid: $item.data( 'model-cid' )
		} );

		return '<div style="height: 84px; width: 125px;" class="embroidery-sortable-helper embroidery-sortable-helper-' + model.get( 'elType' ) + '"><div class="icon"><i class="' + model.getIcon() + '"></i></div><div class="embroidery-element-title-wrapper"><div class="title">' + model.getTitle() + '</div></div></div>';
	},

	getChildViewContainer: function() {
		return this.view.getChildViewContainer( this.view );
	},

	deactivate: function() {
		if ( this.getChildViewContainer().sortable( 'instance' ) ) {
			this.getChildViewContainer().sortable( 'destroy' );
		}
	},

	onSortStart: function( event, ui ) {
		event.stopPropagation();

		var model = this.view.collection.get( {
			cid: ui.item.data( 'model-cid' )
		} );

		if ( 'column' === this.options.elChildType ) {
			var uiData = ui.item.data( 'sortableItem' ),
				uiItems = uiData.items,
				itemHeight = 0;

			uiItems.forEach( function( item ) {
				if ( item.item[0] === ui.item[0] ) {
					itemHeight = item.height;
					return false;
				}
			} );

			ui.placeholder.height( itemHeight );
		}

		embroidery.channels.data
			.reply( 'dragging:model', model )
			.reply( 'dragging:parent:view', this.view )
			.trigger( 'drag:start', model )
			.trigger( model.get( 'elType' ) + ':drag:start' );
	},

	onSortOver: function( event ) {
		event.stopPropagation();

		var model = embroidery.channels.data.request( 'dragging:model' );

		jQuery( event.target )
			.addClass( 'embroidery-draggable-over' )
			.attr( {
				'data-dragged-element': model.get( 'elType' ),
				'data-dragged-is-inner': model.get( 'isInner' )
			} );

		this.$el.addClass( 'embroidery-dragging-on-child' );
	},

	onSortOut: function( event ) {
		event.stopPropagation();

		jQuery( event.target )
			.removeClass( 'embroidery-draggable-over' )
			.removeAttr( 'data-dragged-element data-dragged-is-inner' );

		this.$el.removeClass( 'embroidery-dragging-on-child' );
	},

	onSortReceive: function( event, ui ) {
		event.stopPropagation();

		if ( this.view.isCollectionFilled() ) {
			jQuery( ui.sender ).sortable( 'cancel' );
			return;
		}

		var model = embroidery.channels.data.request( 'dragging:model' ),
			draggedElType = model.get( 'elType' ),
			draggedIsInnerSection = 'section' === draggedElType && model.get( 'isInner' ),
			targetIsInnerColumn = 'column' === this.view.getElementType() && this.view.isInner();

		if ( draggedIsInnerSection && targetIsInnerColumn ) {
			jQuery( ui.sender ).sortable( 'cancel' );

			return;
		}

		embroidery.channels.data.trigger( 'drag:before:update', model );

		var newIndex = ui.item.parent().children().index( ui.item ),
			modelJSON = model.toJSON( { copyHtmlCache: true } );

		var senderSection = embroidery.channels.data.request( 'dragging:parent:view' );

		senderSection.isManualRemoving = true;

		model.destroy();

		senderSection.isManualRemoving = false;

		this.view.addChildElement( modelJSON, { at: newIndex } );

		embroidery.channels.data.trigger( 'drag:after:update', model );
	},

	onSortUpdate: function( event, ui ) {
		event.stopPropagation();

		if ( this.getChildViewContainer()[0] === ui.item.parent()[0] ) {
			var model = embroidery.channels.data.request( 'dragging:model' ),
				$childElement = ui.item,
				collection = this.view.collection,
				newIndex = $childElement.parent().children().index( $childElement );

			embroidery.channels.data.trigger( 'drag:before:update', model );

			var child = this.view.children.findByModelCid( model.cid );

			child._isRendering = true;

			collection.remove( model );

			this.view.addChildElement( model, { at: newIndex } );

			embroidery.saver.setFlagEditorChange( true );

			embroidery.channels.data.trigger( 'drag:after:update', model );
		}
	},

	onAddChild: function( view ) {
		view.$el.attr( 'data-model-cid', view.model.cid );
	}
} );

module.exports = SortableBehavior;

},{}],71:[function(require,module,exports){
var ElementEmptyView;

ElementEmptyView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-empty-preview',

	className: 'embroidery-empty-view',

	events: {
		'click': 'onClickAdd'
	},

	onClickAdd: function() {
		embroidery.getPanelView().setPage( 'elements' );
	}
} );

module.exports = ElementEmptyView;

},{}],72:[function(require,module,exports){
var BaseElementView = require( 'embroidery-elements/views/base' ),
	ColumnEmptyView = require( 'embroidery-elements/views/column-empty' ),
	ColumnView;

ColumnView = BaseElementView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-element-column-content' ),

	emptyView: ColumnEmptyView,

	childViewContainer: '> .embroidery-column-wrap > .embroidery-widget-wrap',

	behaviors: function() {
		var behaviors = BaseElementView.prototype.behaviors.apply( this, arguments );

		_.extend( behaviors, {
			Sortable: {
				behaviorClass: require( 'embroidery-behaviors/sortable' ),
				elChildType: 'widget'
			},
			Resizable: {
				behaviorClass: require( 'embroidery-behaviors/resizable' )
			},
			HandleDuplicate: {
				behaviorClass: require( 'embroidery-behaviors/handle-duplicate' )
			},
			HandleAddMode: {
				behaviorClass: require( 'embroidery-behaviors/duplicate' )
			}
		} );

		return embroidery.hooks.applyFilters( 'elements/column/behaviors', behaviors, this );
	},

	className: function() {
		var classes = BaseElementView.prototype.className.apply( this, arguments ),
			type = this.isInner() ? 'inner' : 'top';

		return classes + ' embroidery-column embroidery-' + type + '-column';
	},

	tagName: function() {
		return this.model.getSetting( 'html_tag' ) || 'div';
	},

	ui: function() {
		var ui = BaseElementView.prototype.ui.apply( this, arguments );

		ui.columnInner = '> .embroidery-column-wrap';

		ui.percentsTooltip = '> .embroidery-element-overlay .embroidery-column-percents-tooltip';

		return ui;
	},

	triggers: {
		'click @ui.addButton': 'click:new'
	},

	initialize: function() {
		BaseElementView.prototype.initialize.apply( this, arguments );

		this.addControlValidator( '_inline_size', this.onEditorInlineSizeInputChange );
	},

	isDroppingAllowed: function() {
		var elementView = embroidery.channels.panelElements.request( 'element:selected' );

		if ( ! elementView ) {
			return false;
		}

		var elType = elementView.model.get( 'elType' );

		if ( 'section' === elType ) {
			return ! this.isInner();
		}

		return 'widget' === elType;
	},

	getPercentsForDisplay: function() {
		var inlineSize = +this.model.getSetting( '_inline_size' ) || this.getPercentSize();

		return inlineSize.toFixed( 1 ) + '%';
	},

	changeSizeUI: function() {
		var self = this,
			columnSize = self.model.getSetting( '_column_size' );

		self.$el.attr( 'data-col', columnSize );

		_.defer( function() { // Wait for the column size to be applied
			if ( self.ui.percentsTooltip ) {
				self.ui.percentsTooltip.text( self.getPercentsForDisplay() );
			}
		} );
	},

	getPercentSize: function( size ) {
		if ( ! size ) {
			size = this.el.getBoundingClientRect().width;
		}

		return +( size / this.$el.parent().width() * 100 ).toFixed( 3 );
	},

	getSortableOptions: function() {
		return {
			connectWith: '.embroidery-widget-wrap',
			items: '> .embroidery-element'
		};
	},

	changeChildContainerClasses: function() {
		var emptyClass = 'embroidery-element-empty',
			populatedClass = 'embroidery-element-populated';

		if ( this.collection.isEmpty() ) {
			this.ui.columnInner.removeClass( populatedClass ).addClass( emptyClass );
		} else {
			this.ui.columnInner.removeClass( emptyClass ).addClass( populatedClass );
		}
	},

	// Events
	onCollectionChanged: function() {
		BaseElementView.prototype.onCollectionChanged.apply( this, arguments );

		this.changeChildContainerClasses();
	},

	onRender: function() {
		var self = this;

		BaseElementView.prototype.onRender.apply( self, arguments );

		self.changeChildContainerClasses();

		self.changeSizeUI();

		self.$el.html5Droppable( {
			items: ' > .embroidery-column-wrap > .embroidery-widget-wrap > .embroidery-element, >.embroidery-column-wrap > .embroidery-widget-wrap > .embroidery-empty-view > .embroidery-first-add',
			axis: [ 'vertical' ],
			groups: [ 'embroidery-element' ],
			isDroppingAllowed: self.isDroppingAllowed.bind( self ),
			currentElementClass: 'embroidery-html5dnd-current-element',
			placeholderClass: 'embroidery-sortable-placeholder embroidery-widget-placeholder',
			hasDraggingOnChildClass: 'embroidery-dragging-on-child',
			onDropping: function( side, event ) {
				event.stopPropagation();

				var newIndex = jQuery( this ).index();

				if ( 'bottom' === side ) {
					newIndex++;
				}

				self.addElementFromPanel( { at: newIndex } );
			}
		} );
	},

	onSettingsChanged: function( settings ) {
		BaseElementView.prototype.onSettingsChanged.apply( this, arguments );

		var changedAttributes = settings.changedAttributes();

		if ( '_column_size' in changedAttributes || '_inline_size' in changedAttributes ) {
			this.changeSizeUI();
		}
	},

	onEditorInlineSizeInputChange: function( newValue, oldValue ) {
		var errors = [],
			columnSize = this.model.getSetting( '_column_size' );

		// If there's only one column
		if ( 100 === columnSize ) {
			errors.push( 'Could not resize one column' );

			return errors;
		}

		if ( ! oldValue ) {
			oldValue = columnSize;
		}

		try {
			this._parent.resizeChild( this, +oldValue, +newValue );
		} catch ( e ) {
			if ( e.message === this._parent.errors.columnWidthTooLarge ) {
				errors.push( e.message );
			}
		}

		return errors;
	}
} );

module.exports = ColumnView;

},{"embroidery-behaviors/duplicate":65,"embroidery-behaviors/handle-duplicate":66,"embroidery-behaviors/resizable":69,"embroidery-behaviors/sortable":70,"embroidery-elements/views/base":64,"embroidery-elements/views/column-empty":71}],73:[function(require,module,exports){
var BaseElementView = require( 'embroidery-elements/views/base' ),
	AddSectionView = require( 'embroidery-views/add-section/inline' ),
	SectionView;

SectionView = BaseElementView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-element-section-content' ),

	addSectionView: null,

	toggleEditTools: false,

	className: function() {
		var classes = BaseElementView.prototype.className.apply( this, arguments ),
			type = this.isInner() ? 'inner' : 'top';

		return classes + ' embroidery-section embroidery-' + type + '-section';
	},

	tagName: function() {
		return this.model.getSetting( 'html_tag' ) || 'section';
	},

	childViewContainer: '> .embroidery-container > .embroidery-row',

	behaviors: function() {
		var behaviors = BaseElementView.prototype.behaviors.apply( this, arguments );

		_.extend( behaviors, {
			Sortable: {
				behaviorClass: require( 'embroidery-behaviors/sortable' ),
				elChildType: 'column'
			},
			HandleDuplicate: {
				behaviorClass: require( 'embroidery-behaviors/handle-duplicate' )
			},
			HandleAddMode: {
				behaviorClass: require( 'embroidery-behaviors/duplicate' )
			}
		} );

		return embroidery.hooks.applyFilters( 'elements/section/behaviors', behaviors, this );
	},

	errors: {
		columnWidthTooLarge: 'New column width is too large',
		columnWidthTooSmall: 'New column width is too small'
	},

	events: function() {
		var events = BaseElementView.prototype.events.apply( this, arguments );

		events[ 'click @ui.addButton' ] = 'onClickAdd';

		return events;
	},

	initialize: function() {
		BaseElementView.prototype.initialize.apply( this, arguments );

		this.listenTo( this.collection, 'add remove reset', this._checkIsFull );

		this._checkIsEmpty();
	},

	addEmptyColumn: function() {
		this.addChildModel( {
			id: embroidery.helpers.getUniqueID(),
			elType: 'column',
			settings: {},
			elements: []
		} );
	},

	addChildModel: function( model, options ) {
		var isModelInstance = model instanceof Backbone.Model,
			isInner = this.isInner();

		if ( isModelInstance ) {
			model.set( 'isInner', isInner );
		} else {
			model.isInner = isInner;
		}

		return BaseElementView.prototype.addChildModel.apply( this, arguments );
	},

	getSortableOptions: function() {
		var sectionConnectClass = this.isInner() ? '.embroidery-inner-section' : '.embroidery-top-section';

		return {
			connectWith: sectionConnectClass + ' > .embroidery-container > .embroidery-row',
			handle: '> .embroidery-element-overlay .embroidery-editor-column-settings .embroidery-editor-element-trigger',
			items: '> .embroidery-column',
			forcePlaceholderSize: true,
			tolerance: 'pointer'
		};
	},

	onSettingsChanged: function( settingsModel ) {
		BaseElementView.prototype.onSettingsChanged.apply( this, arguments );

		if ( settingsModel.changed.structure ) {
			this.redefineLayout();
		}
	},

	getColumnPercentSize: function( element, size ) {
		return +( size / element.parent().width() * 100 ).toFixed( 3 );
	},

	getDefaultStructure: function() {
		return this.collection.length + '0';
	},

	getStructure: function() {
		return this.model.getSetting( 'structure' );
	},

	setStructure: function( structure ) {
		var parsedStructure = embroidery.presetsFactory.getParsedStructure( structure );

		if ( +parsedStructure.columnsCount !== this.collection.length ) {
			throw new TypeError( 'The provided structure doesn\'t match the columns count.' );
		}

		this.model.setSetting( 'structure', structure );
	},

	redefineLayout: function() {
		var preset = embroidery.presetsFactory.getPresetByStructure( this.getStructure() );

		this.collection.each( function( model, index ) {
			model.setSetting( '_column_size', preset.preset[ index ] );
			model.setSetting( '_inline_size', null );
		} );
	},

	resetLayout: function() {
		this.setStructure( this.getDefaultStructure() );
	},

	resetColumnsCustomSize: function() {
		this.collection.each( function( model ) {
			model.setSetting( '_inline_size', null );
		} );
	},

	isCollectionFilled: function() {
		var MAX_SIZE = 10,
			columnsCount = this.collection.length;

		return ( MAX_SIZE <= columnsCount );
	},

	_checkIsFull: function() {
		this.$el.toggleClass( 'embroidery-section-filled', this.isCollectionFilled() );
	},

	_checkIsEmpty: function() {
		if ( ! this.collection.length && ! this.model.get( 'dontFillEmpty' ) ) {
			this.addEmptyColumn();
		}
	},

	getColumnAt: function( index ) {
		var model = this.collection.at( index );

		return model ? this.children.findByModelCid( model.cid ) : null;
	},

	getNextColumn: function( columnView ) {
		return this.getColumnAt( this.collection.indexOf( columnView.model ) + 1 );
	},

	getPreviousColumn: function( columnView ) {
		return this.getColumnAt( this.collection.indexOf( columnView.model ) - 1 );
	},

	showChildrenPercentsTooltip: function( columnView, nextColumnView ) {
		columnView.ui.percentsTooltip.show();

		columnView.ui.percentsTooltip.attr( 'data-side', embroidery.config.is_rtl ? 'right' : 'left' );

		nextColumnView.ui.percentsTooltip.show();

		nextColumnView.ui.percentsTooltip.attr( 'data-side', embroidery.config.is_rtl ? 'left' : 'right' );
	},

	hideChildrenPercentsTooltip: function( columnView, nextColumnView ) {
		columnView.ui.percentsTooltip.hide();

		nextColumnView.ui.percentsTooltip.hide();
	},

	resizeChild: function( childView, currentSize, newSize ) {
		var nextChildView = this.getNextColumn( childView ) || this.getPreviousColumn( childView );

		if ( ! nextChildView ) {
			throw new ReferenceError( 'There is not any next column' );
		}

		var minColumnSize = 10,
			$nextElement = nextChildView.$el,
			nextElementCurrentSize = +nextChildView.model.getSetting( '_inline_size' ) || this.getColumnPercentSize( $nextElement, $nextElement[0].getBoundingClientRect().width ),
			nextElementNewSize = +( currentSize + nextElementCurrentSize - newSize ).toFixed( 3 );

		if ( nextElementNewSize < minColumnSize ) {
			throw new RangeError( this.errors.columnWidthTooLarge );
		}

		if ( newSize < minColumnSize ) {
			throw new RangeError( this.errors.columnWidthTooSmall );
		}

		nextChildView.model.setSetting( '_inline_size', nextElementNewSize );

		return true;
	},

	destroyAddSectionView: function() {
		if ( this.addSectionView && ! this.addSectionView.isDestroyed ) {
			this.addSectionView.destroy();
		}
	},

	onRender: function() {
		BaseElementView.prototype.onRender.apply( this, arguments );

		this._checkIsFull();
	},

	onClickAdd: function() {
		if ( this.addSectionView && ! this.addSectionView.isDestroyed ) {
			this.addSectionView.fadeToDeath();

			return;
		}

		var myIndex = this.model.collection.indexOf( this.model ),
			addSectionView = new AddSectionView( {
				atIndex: myIndex
			} );

		addSectionView.render();

		this.$el.before( addSectionView.$el );

		addSectionView.$el.hide();

		// Delaying the slide down for slow-render browsers (such as FF)
		setTimeout( function() {
			addSectionView.$el.slideDown();
		} );

		this.addSectionView = addSectionView;
	},

	onAddChild: function() {
		if ( ! this.isBuffering && ! this.model.get( 'dontFillEmpty' ) ) {
			// Reset the layout just when we have really add/remove element.
			this.resetLayout();
		}
	},

	onRemoveChild: function() {
		if ( ! this.isManualRemoving ) {
			return;
		}

		// If it's the last column, please create new one.
		this._checkIsEmpty();

		this.resetLayout();
	},

	onChildviewRequestResizeStart: function( columnView ) {
		var nextColumnView = this.getNextColumn( columnView );

		if ( ! nextColumnView ) {
			return;
		}

		this.showChildrenPercentsTooltip( columnView, nextColumnView );

		var $iframes = columnView.$el.find( 'iframe' ).add( nextColumnView.$el.find( 'iframe' ) );

		embroidery.helpers.disableElementEvents( $iframes );
	},

	onChildviewRequestResizeStop: function( columnView ) {
		var nextColumnView = this.getNextColumn( columnView );

		if ( ! nextColumnView ) {
			return;
		}

		this.hideChildrenPercentsTooltip( columnView, nextColumnView );

		var $iframes = columnView.$el.find( 'iframe' ).add( nextColumnView.$el.find( 'iframe' ) );

		embroidery.helpers.enableElementEvents( $iframes );
	},

	onChildviewRequestResize: function( columnView, ui, event ) {
		// Get current column details
		var currentSize = +columnView.model.getSetting( '_inline_size' ) || this.getColumnPercentSize( columnView.$el, columnView.$el.data( 'originalWidth' ) );

		ui.element.css( {
			width: '',
			left: 'initial' // Fix for RTL resizing
		} );

		var newSize = this.getColumnPercentSize( ui.element, ui.size.width );

		try {
			this.resizeChild( columnView, currentSize, newSize );
		} catch ( e ) {
			return;
		}

		columnView.model.setSetting( '_inline_size', newSize );
	},

	onDestroy: function() {
		BaseElementView.prototype.onDestroy.apply( this, arguments );

		this.destroyAddSectionView();
	}
} );

module.exports = SectionView;

},{"embroidery-behaviors/duplicate":65,"embroidery-behaviors/handle-duplicate":66,"embroidery-behaviors/sortable":70,"embroidery-elements/views/base":64,"embroidery-views/add-section/inline":116}],74:[function(require,module,exports){
var BaseElementView = require( 'embroidery-elements/views/base' ),
	WidgetView;

WidgetView = BaseElementView.extend( {
	_templateType: null,

	getTemplate: function() {
		var editModel = this.getEditModel();

		if ( 'remote' !== this.getTemplateType() ) {
			return Marionette.TemplateCache.get( '#tmpl-embroidery-' + editModel.get( 'elType' ) + '-' + editModel.get( 'widgetType' ) + '-content' );
		} else {
			return _.template( '' );
		}
	},

	className: function() {
		return BaseElementView.prototype.className.apply( this, arguments ) + ' embroidery-widget';
	},

	events: function() {
		var events = BaseElementView.prototype.events.apply( this, arguments );

		events.click = 'onClickEdit';

		return events;
	},

	behaviors: function() {
		var behaviors = BaseElementView.prototype.behaviors.apply( this, arguments );

		_.extend( behaviors, {
			InlineEditing: {
				behaviorClass: require( 'embroidery-behaviors/inline-editing' ),
				inlineEditingClass: 'embroidery-inline-editing'
			}
		} );

		return embroidery.hooks.applyFilters( 'elements/widget/behaviors', behaviors, this );
	},

	initialize: function() {
		BaseElementView.prototype.initialize.apply( this, arguments );

		var editModel = this.getEditModel();

		editModel.on( {
			'before:remote:render': this.onModelBeforeRemoteRender.bind( this ),
			'remote:render': this.onModelRemoteRender.bind( this )
		} );

		if ( 'remote' === this.getTemplateType() && ! this.getEditModel().getHtmlCache() ) {
			editModel.renderRemoteServer();
		}

		var onRenderMethod = this.onRender;

		this.render = _.throttle( this.render, 300 );

		this.onRender = function() {
			_.defer( onRenderMethod.bind( this ) );
		};
	},

	render: function() {
		if ( this.model.isRemoteRequestActive() ) {
			this.handleEmptyWidget();

			this.$el.addClass( 'embroidery-element' );

			return;
		}

		Marionette.CompositeView.prototype.render.apply( this, arguments );
	},

	handleEmptyWidget: function() {
		// TODO: REMOVE THIS !!
		// TEMP CODING !!
		this.$el
			.addClass( 'embroidery-widget-empty' )
			.append( '<i class="embroidery-widget-empty-icon ' + this.getEditModel().getIcon() + '"></i>' );
	},

	getTemplateType: function() {
		if ( null === this._templateType ) {
			var editModel = this.getEditModel(),
				$template = jQuery( '#tmpl-embroidery-' + editModel.get( 'elType' ) + '-' + editModel.get( 'widgetType' ) + '-content' );

			this._templateType = $template.length ? 'js' : 'remote';
		}

		return this._templateType;
	},

	getHTMLContent: function( html ) {
		var htmlCache = this.getEditModel().getHtmlCache();

		return htmlCache || html;
	},

	attachElContent: function( html ) {
		var self = this,
			htmlContent = self.getHTMLContent( html );

		_.defer( function() {
			embroideryFrontend.getElements( 'window' ).jQuery( self.el ).html( htmlContent );

			self.bindUIElements(); // Build again the UI elements since the content attached just now
		} );

		return this;
	},

	addInlineEditingAttributes: function( key, toolbar ) {
		this.addRenderAttribute( key, {
			'class': 'embroidery-inline-editing',
			'data-embroidery-setting-key': key
		} );

		if ( toolbar ) {
			this.addRenderAttribute( key, {
				'data-embroidery-inline-editing-toolbar': toolbar
			} );
		}
	},

	getRepeaterSettingKey: function( settingKey, repeaterKey, repeaterItemIndex ) {
		return [ repeaterKey, repeaterItemIndex, settingKey ].join( '.' );
	},

	onModelBeforeRemoteRender: function() {
		this.$el.addClass( 'embroidery-loading' );
	},

	onBeforeDestroy: function() {
		// Remove old style from the DOM.
		embroidery.$previewContents.find( '#embroidery-style-' + this.model.cid ).remove();
	},

	onModelRemoteRender: function() {
		if ( this.isDestroyed ) {
			return;
		}

		this.$el.removeClass( 'embroidery-loading' );
		this.render();
	},

	onRender: function() {
        var self = this;

		BaseElementView.prototype.onRender.apply( self, arguments );

	    var editModel = self.getEditModel(),
	        skinType = editModel.getSetting( '_skin' ) || 'default';

        self.$el
	        .attr( 'data-element_type', editModel.get( 'widgetType' ) + '.' + skinType )
            .removeClass( 'embroidery-widget-empty' )
	        .addClass( 'embroidery-widget-' + editModel.get( 'widgetType' ) + ' embroidery-widget-can-edit' )
            .children( '.embroidery-widget-empty-icon' )
            .remove();

		// TODO: Find better way to detect if all images are loaded
		self.$el.imagesLoaded().always( function() {
			setTimeout( function() {
				if ( 1 > self.$el.height() ) {
					self.handleEmptyWidget();
				}
			}, 200 );
			// Is element empty?
		} );
	}
} );

module.exports = WidgetView;

},{"embroidery-behaviors/inline-editing":67,"embroidery-elements/views/base":64}],75:[function(require,module,exports){
var EditModeItemView;

EditModeItemView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-mode-switcher-content',

	id: 'embroidery-mode-switcher-inner',

	ui: {
		previewButton: '#embroidery-mode-switcher-preview-input',
		previewLabel: '#embroidery-mode-switcher-preview',
		previewLabelA11y: '#embroidery-mode-switcher-preview .embroidery-screen-only'
	},

	events: {
		'change @ui.previewButton': 'onPreviewButtonChange'
	},

	initialize: function() {
		this.listenTo( embroidery.channels.dataEditMode, 'switch', this.onEditModeChanged );
	},

	getCurrentMode: function() {
		return this.ui.previewButton.is( ':checked' ) ? 'preview' : 'edit';
	},

	setMode: function( mode ) {
		this.ui.previewButton
			.prop( 'checked', 'preview' === mode )
			.trigger( 'change' );
	},

	toggleMode: function() {
		this.setMode( this.ui.previewButton.prop( 'checked' ) ? 'edit' : 'preview' );
	},

	onRender: function() {
		this.onEditModeChanged();
	},

	onPreviewButtonChange: function() {
		embroidery.changeEditMode( this.getCurrentMode() );
	},

	onEditModeChanged: function() {
		var activeMode = embroidery.channels.dataEditMode.request( 'activeMode' ),
			title = embroidery.translate( 'preview' === activeMode ? 'back_to_editor' : 'preview' );

		this.ui.previewLabel.attr( 'title', title );
		this.ui.previewLabelA11y.text( title );
	}
} );

module.exports = EditModeItemView;

},{}],76:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-footer-content',

	tagName: 'nav',

	id: 'embroidery-panel-footer-tools',

	possibleRotateModes: [ 'portrait', 'landscape' ],

	ui: {
		buttonSave: '#embroidery-panel-saver-button-publish, #embroidery-panel-saver-menu-save-draft', // Compatibility for Pro <= 1.9.5
		menuButtons: '.embroidery-panel-footer-tool',
		settings: '#embroidery-panel-footer-settings',
		deviceModeIcon: '#embroidery-panel-footer-responsive > i',
		deviceModeButtons: '#embroidery-panel-footer-responsive .embroidery-panel-footer-sub-menu-item',
		saveTemplate: '#embroidery-panel-saver-menu-save-template',
		history: '#embroidery-panel-footer-history'
	},

	events: {
		'click @ui.settings': 'onClickSettings',
		'click @ui.deviceModeButtons': 'onClickResponsiveButtons',
		'click @ui.saveTemplate': 'onClickSaveTemplate',
		'click @ui.history': 'onClickHistory'
	},

	behaviors: function() {
		var behaviors = {
			saver: {
				behaviorClass: embroidery.modules.saver.footerBehavior
			}
		};

		return embroidery.hooks.applyFilters( 'panel/footer/behaviors', behaviors, this );
	},

	initialize: function() {
		this.listenTo( embroidery.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	getDeviceModeButton: function( deviceMode ) {
		return this.ui.deviceModeButtons.filter( '[data-device-mode="' + deviceMode + '"]' );
	},

	onPanelClick: function( event ) {
		var $target = jQuery( event.target ),
			isClickInsideOfTool = $target.closest( '.embroidery-panel-footer-sub-menu-wrapper' ).length;

		if ( isClickInsideOfTool ) {
			return;
		}

		var $tool = $target.closest( '.embroidery-panel-footer-tool' ),
			isClosedTool = $tool.length && ! $tool.hasClass( 'embroidery-open' );

		this.ui.menuButtons.filter( ':not(.embroidery-leave-open)' ).removeClass( 'embroidery-open' );

		if ( isClosedTool ) {
			$tool.addClass( 'embroidery-open' );
		}
	},

	onClickSettings: function() {
		var self = this;

		if ( 'page_settings' !== embroidery.getPanelView().getCurrentPageName() ) {
			embroidery.getPanelView().setPage( 'page_settings' );

			embroidery.getPanelView().getCurrentPageView().once( 'destroy', function() {
				self.ui.settings.removeClass( 'embroidery-open' );
			} );
		}
	},

	onDeviceModeChange: function() {
		var previousDeviceMode = embroidery.channels.deviceMode.request( 'previousMode' ),
			currentDeviceMode = embroidery.channels.deviceMode.request( 'currentMode' );

		this.getDeviceModeButton( previousDeviceMode ).removeClass( 'active' );

		this.getDeviceModeButton( currentDeviceMode ).addClass( 'active' );

		// Change the footer icon
		this.ui.deviceModeIcon.removeClass( 'eicon-device-' + previousDeviceMode ).addClass( 'eicon-device-' + currentDeviceMode );
	},

	onClickResponsiveButtons: function( event ) {
		var $clickedButton = this.$( event.currentTarget ),
			newDeviceMode = $clickedButton.data( 'device-mode' );

		embroidery.changeDeviceMode( newDeviceMode );
	},

	onClickSaveTemplate: function() {
		embroidery.templates.startModal( {
			onReady: function() {
				embroidery.templates.getLayout().showSaveTemplateView();
			}
		} );
	},

	onClickHistory: function() {
		if ( 'historyPage' !== embroidery.getPanelView().getCurrentPageName() ) {
			embroidery.getPanelView().setPage( 'historyPage' );
		}
	},

	onRender: function() {
		var self = this;

		_.defer( function() {
			embroidery.getPanelView().$el.on( 'click', self.onPanelClick.bind( self ) );
		} );
	}
} );

},{}],77:[function(require,module,exports){
var PanelHeaderItemView;

PanelHeaderItemView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-header',

	id: 'embroidery-panel-header',

	ui: {
		menuButton: '#embroidery-panel-header-menu-button',
		menuIcon: '#embroidery-panel-header-menu-button i',
		title: '#embroidery-panel-header-title',
		addButton: '#embroidery-panel-header-add-button'
	},

	events: {
		'click @ui.addButton': 'onClickAdd',
		'click @ui.menuButton': 'onClickMenu'
	},

	setTitle: function( title ) {
		this.ui.title.html( title );
	},

	onClickAdd: function() {
		embroidery.getPanelView().setPage( 'elements' );
	},

	onClickMenu: function() {
		var panel = embroidery.getPanelView(),
			currentPanelPageName = panel.getCurrentPageName(),
			nextPage = 'menu' === currentPanelPageName ? 'elements' : 'menu';

		if ( 'menu' === nextPage ) {
			var arrowClass = 'eicon-arrow-' + ( embroidery.config.is_rtl ? 'right' : 'left' );

			this.ui.menuIcon.removeClass( 'eicon-menu-bar' ).addClass( arrowClass );
		}

		panel.setPage( nextPage );
	}
} );

module.exports = PanelHeaderItemView;

},{}],78:[function(require,module,exports){
var ControlsStack = require( 'embroidery-views/controls-stack' ),
	EditorView;

EditorView = ControlsStack.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-editor-content' ),

	id: 'embroidery-panel-page-editor',

	childViewContainer: '#embroidery-controls',

	childViewOptions: function() {
		return {
			elementSettingsModel: this.model.get( 'settings' ),
			elementEditSettings: this.model.get( 'editSettings' )
		};
	},

	openActiveSection: function() {
		ControlsStack.prototype.openActiveSection.apply( this, arguments );

		embroidery.channels.editor.trigger( 'section:activated', this.activeSection, this );
	},

	isVisibleSectionControl: function( sectionControlModel ) {
		return ControlsStack.prototype.isVisibleSectionControl.apply( this, arguments ) && embroidery.helpers.isActiveControl( sectionControlModel, this.model.get( 'settings' ).attributes );
	},

	scrollToEditedElement: function() {
		embroidery.helpers.scrollToView( this.getOption( 'editedElementView' ) );
	},

	onBeforeRender: function() {
		var controls = embroidery.getElementControls( this.model );

		if ( ! controls ) {
			throw new Error( 'Editor controls not found' );
		}

		// Create new instance of that collection
		this.collection = new Backbone.Collection( _.values( controls ) );
	},

	onDestroy: function() {
		var editedElementView = this.getOption( 'editedElementView' );

		if ( editedElementView ) {
			editedElementView.$el.removeClass( 'embroidery-element-editable' );
		}

		this.model.trigger( 'editor:close' );

		this.triggerMethod( 'editor:destroy' );
	},

	onRender: function() {
		var editedElementView = this.getOption( 'editedElementView' );

		if ( editedElementView ) {
			editedElementView.$el.addClass( 'embroidery-element-editable' );
		}
	},

	onDeviceModeChange: function() {
		ControlsStack.prototype.onDeviceModeChange.apply( this, arguments );

		this.scrollToEditedElement();
	},

	onChildviewSettingsChange: function( childView ) {
		var editedElementView = this.getOption( 'editedElementView' ),
			editedElementType = editedElementView.model.get( 'elType' );

		if ( 'widget' === editedElementType ) {
			editedElementType = editedElementView.model.get( 'widgetType' );
		}

		embroidery.channels.editor
			.trigger( 'change', childView, editedElementView )
			.trigger( 'change:' + editedElementType, childView, editedElementView )
			.trigger( 'change:' + editedElementType + ':' + childView.model.get( 'name' ), childView, editedElementView );
	}
} );

module.exports = EditorView;

},{"embroidery-views/controls-stack":119}],79:[function(require,module,exports){
var PanelElementsCategory = require( '../models/element' ),
	PanelElementsCategoriesCollection;

PanelElementsCategoriesCollection = Backbone.Collection.extend( {
	model: PanelElementsCategory
} );

module.exports = PanelElementsCategoriesCollection;

},{"../models/element":82}],80:[function(require,module,exports){
var PanelElementsElementModel = require( '../models/element' ),
	PanelElementsElementsCollection;

PanelElementsElementsCollection = Backbone.Collection.extend( {
	model: PanelElementsElementModel/*,
	comparator: 'title'*/
} );

module.exports = PanelElementsElementsCollection;

},{"../models/element":82}],81:[function(require,module,exports){
var PanelElementsCategoriesCollection = require( './collections/categories' ),
	PanelElementsElementsCollection = require( './collections/elements' ),
	PanelElementsCategoriesView = require( './views/categories' ),
	PanelElementsElementsView = embroidery.modules.templateLibrary.ElementsCollectionView,
	PanelElementsSearchView = require( './views/search' ),
	PanelElementsGlobalView = require( './views/global' ),
	PanelElementsLayoutView;

PanelElementsLayoutView = Marionette.LayoutView.extend( {
	template: '#tmpl-embroidery-panel-elements',

	regions: {
		elements: '#embroidery-panel-elements-wrapper',
		search: '#embroidery-panel-elements-search-area'
	},

	ui: {
		tabs: '.embroidery-panel-navigation-tab'
	},

	events: {
		'click @ui.tabs': 'onTabClick'
	},

	regionViews: {},

	elementsCollection: null,

	categoriesCollection: null,

	initialize: function() {
		this.listenTo( embroidery.channels.panelElements, 'element:selected', this.destroy );

		this.initElementsCollection();

		this.initCategoriesCollection();

		this.initRegionViews();
	},

	initRegionViews: function() {
		var regionViews = {
			elements: {
				region: this.elements,
				view: PanelElementsElementsView,
				options: { collection: this.elementsCollection }
			},
			categories: {
				region: this.elements,
				view: PanelElementsCategoriesView,
				options: { collection: this.categoriesCollection }
			},
			search: {
				region: this.search,
				view: PanelElementsSearchView
			},
			global: {
				region: this.elements,
				view: PanelElementsGlobalView
			}
		};

		this.regionViews = embroidery.hooks.applyFilters( 'panel/elements/regionViews', regionViews );
	},

	initElementsCollection: function() {
		var elementsCollection = new PanelElementsElementsCollection(),
			sectionConfig = embroidery.config.elements.section;

		elementsCollection.add( {
			title: embroidery.translate( 'inner_section' ),
			elType: 'section',
			categories: [ 'basic' ],
			icon: sectionConfig.icon
		} );

		// TODO: Change the array from server syntax, and no need each loop for initialize
		_.each( embroidery.config.widgets, function( element ) {
			elementsCollection.add( {
				title: element.title,
				elType: element.elType,
				categories: element.categories,
				keywords: element.keywords,
				icon: element.icon,
				widgetType: element.widget_type,
				custom: element.custom
			} );
		} );

		this.elementsCollection = elementsCollection;
	},

	initCategoriesCollection: function() {
		var categories = {};

		this.elementsCollection.each( function( element ) {
			_.each( element.get( 'categories' ), function( category ) {
				if ( ! categories[ category ] ) {
					categories[ category ] = [];
				}

				categories[ category ].push( element );
			} );
		} );

		var categoriesCollection = new PanelElementsCategoriesCollection();

		_.each( embroidery.config.elements_categories, function( categoryConfig, categoryName ) {
			if ( ! categories[ categoryName ] ) {
				return;
			}

			categoriesCollection.add( {
				name: categoryName,
				title: categoryConfig.title,
				icon: categoryConfig.icon,
				items: categories[ categoryName ]
			} );
		} );

		this.categoriesCollection = categoriesCollection;
	},

	activateTab: function( tabName ) {
		this.ui.tabs
			.removeClass( 'active' )
			.filter( '[data-view="' + tabName + '"]' )
			.addClass( 'active' );

		this.showView( tabName );
	},

	showView: function( viewName ) {
		var viewDetails = this.regionViews[ viewName ],
			options = viewDetails.options || {};

		viewDetails.region.show( new viewDetails.view( options ) );
	},

	clearSearchInput: function() {
		this.getChildView( 'search' ).clearInput();
	},

	changeFilter: function( filterValue ) {
		embroidery.channels.panelElements
			.reply( 'filter:value', filterValue )
			.trigger( 'filter:change' );
	},

	clearFilters: function() {
		this.changeFilter( null );
		this.clearSearchInput();
	},

	onChildviewChildrenRender: function() {
		this.updateElementsScrollbar();
	},

	onChildviewSearchChangeInput: function( child ) {
		this.changeFilter( child.ui.input.val(), 'search' );
	},

	onDestroy: function() {
		embroidery.channels.panelElements.reply( 'filter:value', null );
	},

	onShow: function() {
		this.showView( 'categories' );

		this.showView( 'search' );
	},

	onTabClick: function( event ) {
		this.activateTab( event.currentTarget.dataset.view );
	},

	updateElementsScrollbar: function() {
		embroidery.channels.data.trigger( 'scrollbar:update' );
	}
} );

module.exports = PanelElementsLayoutView;

},{"./collections/categories":79,"./collections/elements":80,"./views/categories":83,"./views/global":87,"./views/search":88}],82:[function(require,module,exports){
var PanelElementsElementModel;

PanelElementsElementModel = Backbone.Model.extend( {
	defaults: {
		title: '',
		categories: [],
		keywords: [],
		icon: '',
		elType: 'widget',
		widgetType: ''
	}
} );

module.exports = PanelElementsElementModel;

},{}],83:[function(require,module,exports){
var PanelElementsCategoryView = require( './category' ),
	PanelElementsCategoriesView;

PanelElementsCategoriesView = Marionette.CompositeView.extend( {
	template: '#tmpl-embroidery-panel-categories',

	childView: PanelElementsCategoryView,

	childViewContainer: '#embroidery-panel-categories',

	id: 'embroidery-panel-elements-categories',

	initialize: function() {
		this.listenTo( embroidery.channels.panelElements, 'filter:change', this.onPanelElementsFilterChange );
	},

	onPanelElementsFilterChange: function() {
		if ( embroidery.channels.panelElements.request( 'filter:value' ) ) {
			embroidery.getPanelView().getCurrentPageView().showView( 'elements' );
		}
	}
} );

module.exports = PanelElementsCategoriesView;

},{"./category":84}],84:[function(require,module,exports){
var PanelElementsElementsCollection = require( '../collections/elements' ),
	PanelElementsCategoryView;

PanelElementsCategoryView = Marionette.CompositeView.extend( {
	template: '#tmpl-embroidery-panel-elements-category',

	className: 'embroidery-panel-category',

	childView: require( 'embroidery-panel/pages/elements/views/element' ),

	childViewContainer: '.panel-elements-category-items',

	initialize: function() {
		this.collection = new PanelElementsElementsCollection( this.model.get( 'items' ) );
	}
} );

module.exports = PanelElementsCategoryView;

},{"../collections/elements":80,"embroidery-panel/pages/elements/views/element":85}],85:[function(require,module,exports){
var PanelElementsElementView;

PanelElementsElementView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-element-library-element',

	className: 'embroidery-element-wrapper',

	onRender: function() {
		var self = this;

		this.$el.html5Draggable( {

			onDragStart: function() {
				embroidery.channels.panelElements
					.reply( 'element:selected', self )
					.trigger( 'element:drag:start' );
			},

			onDragEnd: function() {
				embroidery.channels.panelElements.trigger( 'element:drag:end' );
			},

			groups: [ 'embroidery-element' ]
		} );
	}
} );

module.exports = PanelElementsElementView;

},{}],86:[function(require,module,exports){
var PanelElementsElementsView;

PanelElementsElementsView = Marionette.CollectionView.extend( {
	childView: require( 'embroidery-panel/pages/elements/views/element' ),

	id: 'embroidery-panel-elements',

	initialize: function() {
		this.listenTo( embroidery.channels.panelElements, 'filter:change', this.onFilterChanged );
	},

	filter: function( childModel ) {
		var filterValue = embroidery.channels.panelElements.request( 'filter:value' );

		if ( ! filterValue ) {
			return true;
		}

		if ( -1 !== childModel.get( 'title' ).toLowerCase().indexOf( filterValue.toLowerCase() ) ) {
			return true;
		}

		return _.any( childModel.get( 'keywords' ), function( keyword ) {
			return ( -1 !== keyword.toLowerCase().indexOf( filterValue.toLowerCase() ) );
		} );
	},

	onFilterChanged: function() {
		var filterValue = embroidery.channels.panelElements.request( 'filter:value' );

		if ( ! filterValue ) {
			this.onFilterEmpty();
		}

		this._renderChildren();

		this.triggerMethod( 'children:render' );
	},

	onFilterEmpty: function() {
		embroidery.getPanelView().getCurrentPageView().showView( 'categories' );
	}
} );

module.exports = PanelElementsElementsView;

},{"embroidery-panel/pages/elements/views/element":85}],87:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-global',

	id: 'embroidery-panel-global',

	initialize: function() {
		embroidery.getPanelView().getCurrentPageView().search.reset();
	},

	onDestroy: function() {
		embroidery.getPanelView().getCurrentPageView().showView( 'search' );
	}
} );

},{}],88:[function(require,module,exports){
var PanelElementsSearchView;

PanelElementsSearchView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-element-search',

	id: 'embroidery-panel-elements-search-wrapper',

	ui: {
		input: 'input'
	},

	events: {
		'keyup @ui.input': 'onInputChanged'
	},

	clearInput: function() {
		this.ui.input.val( '' );
	},

	onInputChanged: function( event ) {
		var ESC_KEY = 27;

		if ( ESC_KEY === event.keyCode ) {
			this.clearInput();
		}

		this.triggerMethod( 'search:change:input' );
	},

	onRender: function() {
		var input = this.ui.input;

		setTimeout( function() {
			input.focus();
		} );
	}
} );

module.exports = PanelElementsSearchView;

},{}],89:[function(require,module,exports){
var PanelMenuGroupView = require( 'embroidery-panel/pages/menu/views/group' ),
	PanelMenuPageView;

PanelMenuPageView = Marionette.CompositeView.extend( {
	id: 'embroidery-panel-page-menu',

	template: '#tmpl-embroidery-panel-menu',

	childView: PanelMenuGroupView,

	childViewContainer: '#embroidery-panel-page-menu-content',

	initialize: function() {
		this.collection = PanelMenuPageView.getGroups();
	},

	onDestroy: function() {
		var arrowClass = 'eicon-arrow-' + ( embroidery.config.is_rtl ? 'right' : 'left' );

		embroidery.panel.currentView.getHeaderView().ui.menuIcon.removeClass( arrowClass ).addClass( 'eicon-menu-bar' );
	}
}, {
	groups: null,

	initGroups: function() {
		this.groups = new Backbone.Collection( [
			{
				name: 'style',
				title: embroidery.translate( 'global_style' ),
				items: [
					{
						name: 'global-colors',
						icon: 'fa fa-paint-brush',
						title: embroidery.translate( 'global_colors' ),
						type: 'page',
						pageName: 'colorScheme'
					},
					{
						name: 'global-fonts',
						icon: 'fa fa-font',
						title: embroidery.translate( 'global_fonts' ),
						type: 'page',
						pageName: 'typographyScheme'
					},
					{
						name: 'color-picker',
						icon: 'fa fa-eyedropper',
						title: embroidery.translate( 'color_picker' ),
						type: 'page',
						pageName: 'colorPickerScheme'
					}
				]
			},
			{
				name: 'settings',
				title: embroidery.translate( 'settings' ),
				items: [
					{
						name: 'embroidery-settings',
						icon: 'fa fa-external-link',
						title: embroidery.translate( 'embroidery_settings' ),
						type: 'link',
						link: embroidery.config.settings_page_link,
						newTab: true
					},
					{
						name: 'about-embroidery',
						icon: 'fa fa-info-circle',
						title: embroidery.translate( 'about_embroidery' ),
						type: 'link',
						link: embroidery.config.embroidery_site,
						newTab: true
					}
				]
			}
		] );
	},

	getGroups: function() {
		if ( ! this.groups ) {
			this.initGroups();
		}

		return this.groups;
	},

	addItem: function( itemData, groupName, before ) {
		var group = this.getGroups().findWhere( { name: groupName } );

		if ( ! group ) {
			return;
		}

		var items = group.get( 'items' ),
			beforeItem;

		if ( before ) {
			beforeItem = _.findWhere( items, { name: before } );
		}

		if ( beforeItem ) {
			items.splice( items.indexOf( beforeItem ), 0, itemData );
		} else {
			items.push( itemData );
		}

	}
} );

module.exports = PanelMenuPageView;

},{"embroidery-panel/pages/menu/views/group":90}],90:[function(require,module,exports){
var PanelMenuItemView = require( 'embroidery-panel/pages/menu/views/item' );

module.exports = Marionette.CompositeView.extend( {
	template: '#tmpl-embroidery-panel-menu-group',

	className: 'embroidery-panel-menu-group',

	childView: PanelMenuItemView,

	childViewContainer: '.embroidery-panel-menu-items',

	initialize: function() {
		this.collection = new Backbone.Collection( this.model.get( 'items' ) );
	},

	onChildviewClick: function( childView ) {
		var menuItemType = childView.model.get( 'type' );

		switch ( menuItemType ) {
			case 'page':
				var pageName = childView.model.get( 'pageName' ),
					pageTitle = childView.model.get( 'title' );

				embroidery.getPanelView().setPage( pageName, pageTitle );

				break;

			case 'link':
				var link = childView.model.get( 'link' ),
					isNewTab = childView.model.get( 'newTab' );

				if ( isNewTab ) {
					open( link, '_blank' );
				} else {
					location.href = childView.model.get( 'link' );
				}

				break;

			default:
				var callback = childView.model.get( 'callback' );

				if ( _.isFunction( callback ) ) {
					callback.call( childView );
				}
		}
	}
} );

},{"embroidery-panel/pages/menu/views/item":91}],91:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-menu-item',

	className: 'embroidery-panel-menu-item',

	triggers: {
		click: 'click'
	}
} );

},{}],92:[function(require,module,exports){
var childViewTypes = {
		color: require( 'embroidery-panel/pages/schemes/items/color' ),
		typography: require( 'embroidery-panel/pages/schemes/items/typography' )
	},
	PanelSchemeBaseView;

PanelSchemeBaseView = Marionette.CompositeView.extend( {
	id: function() {
		return 'embroidery-panel-scheme-' + this.getType();
	},

	className: function() {
		return 'embroidery-panel-scheme embroidery-panel-scheme-' + this.getUIType();
	},

	childViewContainer: '.embroidery-panel-scheme-items',

	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-embroidery-panel-schemes-' + this.getType() );
	},

	getChildView: function() {
		return childViewTypes[ this.getUIType() ];
	},

	getUIType: function() {
		return this.getType();
	},

	ui: function() {
		return {
			saveButton: '.embroidery-panel-scheme-save .embroidery-button',
			discardButton: '.embroidery-panel-scheme-discard .embroidery-button',
			resetButton: '.embroidery-panel-scheme-reset .embroidery-button'
		};
	},

	events: function() {
		return {
			'click @ui.saveButton': 'saveScheme',
			'click @ui.discardButton': 'discardScheme',
			'click @ui.resetButton': 'setDefaultScheme'
		};
	},

	initialize: function() {
		this.model = new Backbone.Model();

		this.resetScheme();
	},

	getType: function() {},

	getScheme: function() {
		return embroidery.schemes.getScheme( this.getType() );
	},

	changeChildrenUIValues: function( schemeItems ) {
		var self = this;

		_.each( schemeItems, function( value, key ) {
			var model = self.collection.findWhere( { key: key } ),
				childView = self.children.findByModelCid( model.cid );

			childView.changeUIValue( value );
		} );
	},

	discardScheme: function() {
		embroidery.schemes.resetSchemes( this.getType() );

		this.onSchemeChange();

		this.ui.saveButton.prop( 'disabled', true );

		this._renderChildren();
	},

	setSchemeValue: function( key, value ) {
		embroidery.schemes.setSchemeValue( this.getType(), key, value );

		this.onSchemeChange();
	},

	saveScheme: function() {
		embroidery.schemes.saveScheme( this.getType() );

		this.ui.saveButton.prop( 'disabled', true );

		this.resetScheme();

		this._renderChildren();
	},

	setDefaultScheme: function() {
		var defaultScheme = embroidery.config.default_schemes[ this.getType() ].items;

		this.changeChildrenUIValues( defaultScheme );
	},

	resetItems: function() {
		this.model.set( 'items', this.getScheme().items );
	},

	resetCollection: function() {
		var self = this,
			items = self.model.get( 'items' );

		self.collection = new Backbone.Collection();

		_.each( items, function( item, key ) {
			item.type = self.getType();
			item.key = key;

			self.collection.add( item );
		} );
	},

	resetScheme: function() {
		this.resetItems();
		this.resetCollection();
	},

	onSchemeChange: function() {
		embroidery.schemes.printSchemesStyle();
	},

	onChildviewValueChange: function( childView, newValue ) {
		this.ui.saveButton.removeProp( 'disabled' );

		this.setSchemeValue( childView.model.get( 'key' ), newValue );
	}
} );

module.exports = PanelSchemeBaseView;

},{"embroidery-panel/pages/schemes/items/color":97,"embroidery-panel/pages/schemes/items/typography":98}],93:[function(require,module,exports){
var PanelSchemeColorsView = require( 'embroidery-panel/pages/schemes/colors' ),
	PanelSchemeColorPickerView;

PanelSchemeColorPickerView = PanelSchemeColorsView.extend( {
	getType: function() {
		return 'color-picker';
	},

	getUIType: function() {
		return 'color';
	},

	onSchemeChange: function() {},

	getViewComparator: function() {
		return this.orderView;
	},

	orderView: function( model ) {
		return embroidery.helpers.getColorPickerPaletteIndex( model.get( 'key' ) );
	}
} );

module.exports = PanelSchemeColorPickerView;

},{"embroidery-panel/pages/schemes/colors":94}],94:[function(require,module,exports){
var PanelSchemeBaseView = require( 'embroidery-panel/pages/schemes/base' ),
	PanelSchemeColorsView;

PanelSchemeColorsView = PanelSchemeBaseView.extend( {
	ui: function() {
		var ui = PanelSchemeBaseView.prototype.ui.apply( this, arguments );

		ui.systemSchemes = '.embroidery-panel-scheme-color-system-scheme';

		return ui;
	},

	events: function() {
		var events = PanelSchemeBaseView.prototype.events.apply( this, arguments );

		events[ 'click @ui.systemSchemes' ] = 'onSystemSchemeClick';

		return events;
	},

	getType: function() {
		return 'color';
	},

	onSystemSchemeClick: function( event ) {
		var $schemeClicked = jQuery( event.currentTarget ),
			schemeName = $schemeClicked.data( 'schemeName' ),
			scheme = embroidery.config.system_schemes[ this.getType() ][ schemeName ].items;

		this.changeChildrenUIValues( scheme );
	}
} );

module.exports = PanelSchemeColorsView;

},{"embroidery-panel/pages/schemes/base":92}],95:[function(require,module,exports){
var PanelSchemeDisabledView;

PanelSchemeDisabledView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-schemes-disabled',

	id: 'embroidery-panel-schemes-disabled',

	className: 'embroidery-panel-nerd-box',

	disabledTitle: '',

	templateHelpers: function() {
		return {
			disabledTitle: this.disabledTitle
		};
	}
} );

module.exports = PanelSchemeDisabledView;

},{}],96:[function(require,module,exports){
var PanelSchemeItemView;

PanelSchemeItemView = Marionette.ItemView.extend( {
	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-embroidery-panel-scheme-' + this.getUIType() + '-item' );
	},

	className: function() {
		return 'embroidery-panel-scheme-item';
	}
} );

module.exports = PanelSchemeItemView;

},{}],97:[function(require,module,exports){
var PanelSchemeItemView = require( 'embroidery-panel/pages/schemes/items/base' ),
	PanelSchemeColorView;

PanelSchemeColorView = PanelSchemeItemView.extend( {
	getUIType: function() {
		return 'color';
	},

	ui: {
		input: '.embroidery-panel-scheme-color-value'
	},

	changeUIValue: function( newValue ) {
		this.ui.input.wpColorPicker( 'color', newValue );
	},

	onBeforeDestroy: function() {
		if ( this.ui.input.wpColorPicker( 'instance' ) ) {
			this.ui.input.wpColorPicker( 'close' );
		}
	},

	onRender: function() {
		var self = this;

		embroidery.helpers.wpColorPicker( self.ui.input, {
			change: function( event, ui ) {
				self.triggerMethod( 'value:change', ui.color.toString() );
			}
		} );
	}
} );

module.exports = PanelSchemeColorView;

},{"embroidery-panel/pages/schemes/items/base":96}],98:[function(require,module,exports){
var PanelSchemeItemView = require( 'embroidery-panel/pages/schemes/items/base' ),
	PanelSchemeTypographyView;

PanelSchemeTypographyView = PanelSchemeItemView.extend( {
	getUIType: function() {
		return 'typography';
	},

	className: function() {
		var classes = PanelSchemeItemView.prototype.className.apply( this, arguments );

		return classes + ' embroidery-panel-box';
	},

	ui: {
		heading: '.embroidery-panel-heading',
		allFields: '.embroidery-panel-scheme-typography-item-field',
		inputFields: 'input.embroidery-panel-scheme-typography-item-field',
		selectFields: 'select.embroidery-panel-scheme-typography-item-field',
		selectFamilyFields: 'select.embroidery-panel-scheme-typography-item-field[name="font_family"]'
	},

	events: {
		'input @ui.inputFields': 'onFieldChange',
		'change @ui.selectFields': 'onFieldChange',
		'click @ui.heading': 'toggleVisibility'
	},

	onRender: function() {
		var self = this;

		this.ui.inputFields.add( this.ui.selectFields ).each( function() {
			var $this = jQuery( this ),
				name = $this.attr( 'name' ),
				value = self.model.get( 'value' )[ name ];

			$this.val( value );
		} );

		this.ui.selectFamilyFields.select2( {
			dir: embroidery.config.is_rtl ? 'rtl' : 'ltr'
		} );
	},

	toggleVisibility: function() {
		this.ui.heading.toggleClass( 'embroidery-open' );
	},

	changeUIValue: function( newValue ) {
		this.ui.allFields.each( function() {
			var $this = jQuery( this ),
				thisName = $this.attr( 'name' ),
				newFieldValue = newValue[ thisName ];

			$this.val( newFieldValue ).trigger( 'change' );
		} );
	},

	onFieldChange: function( event ) {
		var $select = this.$( event.currentTarget ),
			currentValue = embroidery.schemes.getSchemeValue( 'typography', this.model.get( 'key' ) ).value,
			fieldKey = $select.attr( 'name' );

		currentValue[ fieldKey ] = $select.val();

		if ( 'font_family' === fieldKey && ! _.isEmpty( currentValue[ fieldKey ] ) ) {
			embroidery.helpers.enqueueFont( currentValue[ fieldKey ] );
		}

		this.triggerMethod( 'value:change', currentValue );
	}
} );

module.exports = PanelSchemeTypographyView;

},{"embroidery-panel/pages/schemes/items/base":96}],99:[function(require,module,exports){
var PanelSchemeBaseView = require( 'embroidery-panel/pages/schemes/base' ),
	PanelSchemeTypographyView;

PanelSchemeTypographyView = PanelSchemeBaseView.extend( {
	getType: function() {
		return 'typography';
	}
} );

module.exports = PanelSchemeTypographyView;

},{"embroidery-panel/pages/schemes/base":92}],100:[function(require,module,exports){
var EditModeItemView = require( 'embroidery-layouts/edit-mode' ),
	PanelLayoutView;

PanelLayoutView = Marionette.LayoutView.extend( {
	template: '#tmpl-embroidery-panel',

	id: 'embroidery-panel-inner',

	regions: {
		content: '#embroidery-panel-content-wrapper',
		header: '#embroidery-panel-header-wrapper',
		footer: '#embroidery-panel-footer',
		modeSwitcher: '#embroidery-mode-switcher'
	},

	pages: {},

	childEvents: {
		'click:add': function() {
			this.setPage( 'elements' );
		},
		'editor:destroy': function() {
			this.setPage( 'elements' );
		}
	},

	currentPageName: null,

	currentPageView: null,

	_isScrollbarInitialized: false,

	initialize: function() {
		this.initPages();
	},

	buildPages: function() {
		var pages = {
			elements: {
				view: require( 'embroidery-panel/pages/elements/elements' ),
				title: '<img src="' + embroidery.config.assets_url + 'images/logo-panel.svg">'
			},
			editor: {
				view: require( 'embroidery-panel/pages/editor' )
			},
			menu: {
				view: embroidery.modules.panel.Menu,
				title: '<img src="' + embroidery.config.assets_url + 'images/logo-panel.svg">'
			},
			colorScheme: {
				view: require( 'embroidery-panel/pages/schemes/colors' )
			},
			typographyScheme: {
				view: require( 'embroidery-panel/pages/schemes/typography' )
			},
			colorPickerScheme: {
				view: require( 'embroidery-panel/pages/schemes/color-picker' )
			}
		};

		var schemesTypes = Object.keys( embroidery.schemes.getSchemes() ),
			disabledSchemes = _.difference( schemesTypes, embroidery.schemes.getEnabledSchemesTypes() );

		_.each( disabledSchemes, function( schemeType ) {
			var scheme  = embroidery.schemes.getScheme( schemeType );

			pages[ schemeType + 'Scheme' ].view = require( 'embroidery-panel/pages/schemes/disabled' ).extend( {
				disabledTitle: scheme.disabled_title
			} );
		} );

		return pages;
	},

	initPages: function() {
		var pages;

		this.getPages = function( page ) {
			if ( ! pages ) {
				pages = this.buildPages();
			}

			return page ? pages[ page ] : pages;
		};

		this.addPage = function( pageName, pageData ) {
			if ( ! pages ) {
				pages = this.buildPages();
			}

			pages[ pageName ] = pageData;
		};
	},

	getHeaderView: function() {
		return this.getChildView( 'header' );
	},

	getFooterView: function() {
		return this.getChildView( 'footer' );
	},

	getCurrentPageName: function() {
		return this.currentPageName;
	},

	getCurrentPageView: function() {
		return this.currentPageView;
	},

	setPage: function( page, title, viewOptions ) {
		var pageData = this.getPages( page );

		if ( ! pageData ) {
			throw new ReferenceError( 'Embroidery panel doesn\'t have page named \'' + page + '\'' );
		}

		if ( pageData.options ) {
			viewOptions = _.extend( pageData.options, viewOptions );
		}

		var View = pageData.view;

		if ( pageData.getView ) {
			View = pageData.getView();
		}

		this.currentPageView = new View( viewOptions );

		this.showChildView( 'content', this.currentPageView );

		this.getHeaderView().setTitle( title || pageData.title );

		this.currentPageName = page;

		this
			.trigger( 'set:page', this.currentPageView )
			.trigger( 'set:page:' + page, this.currentPageView );
	},

	openEditor: function( model, view ) {
		var currentPageName = this.getCurrentPageName();

		if ( 'editor' === currentPageName ) {
			var currentPageView = this.getCurrentPageView(),
				currentEditableModel = currentPageView.model;

			if ( currentEditableModel === model ) {
				return;
			}
		}

		var elementData = embroidery.getElementData( model );

		this.setPage( 'editor', embroidery.translate( 'edit_element', [ elementData.title ] ), {
			model: model,
			editedElementView: view
		} );

		var action = 'panel/open_editor/' + model.get( 'elType' );

		// Example: panel/open_editor/widget
		embroidery.hooks.doAction( action, this, model, view );

		// Example: panel/open_editor/widget/heading
		embroidery.hooks.doAction( action + '/' + model.get( 'widgetType' ), this, model, view );
	},

	onBeforeShow: function() {
		var PanelFooterItemView = require( 'embroidery-layouts/panel/footer' ),
			PanelHeaderItemView = require( 'embroidery-layouts/panel/header' );

		// Edit Mode
		this.showChildView( 'modeSwitcher', new EditModeItemView() );

		// Header
		this.showChildView( 'header', new PanelHeaderItemView() );

		// Footer
		this.showChildView( 'footer', new PanelFooterItemView() );

		// Added Editor events
		this.updateScrollbar = _.throttle( this.updateScrollbar, 100 );

		this.getRegion( 'content' )
			.on( 'before:show', this.onEditorBeforeShow.bind( this ) )
			.on( 'empty', this.onEditorEmpty.bind( this ) )
			.on( 'show', this.updateScrollbar.bind( this ) );

		// Set default page to elements
		this.setPage( 'elements' );

		this.listenTo( embroidery.channels.data, 'scrollbar:update', this.updateScrollbar );
	},

	onEditorBeforeShow: function() {
		_.defer( this.updateScrollbar.bind( this ) );
	},

	onEditorEmpty: function() {
		this.updateScrollbar();
	},

	updateScrollbar: function() {
		var $panel = this.content.$el;

		if ( ! this._isScrollbarInitialized ) {
			$panel.perfectScrollbar();
			this._isScrollbarInitialized = true;

			return;
		}

		$panel.perfectScrollbar( 'update' );
	}
} );

module.exports = PanelLayoutView;

},{"embroidery-layouts/edit-mode":75,"embroidery-layouts/panel/footer":76,"embroidery-layouts/panel/header":77,"embroidery-panel/pages/editor":78,"embroidery-panel/pages/elements/elements":81,"embroidery-panel/pages/schemes/color-picker":93,"embroidery-panel/pages/schemes/colors":94,"embroidery-panel/pages/schemes/disabled":95,"embroidery-panel/pages/schemes/typography":99}],101:[function(require,module,exports){
var Ajax;

Ajax = {
	config: {},

	initConfig: function() {
		this.config = {
			ajaxParams: {
				type: 'POST',
				url: embroidery.config.ajaxurl,
				data: {}
			},
			actionPrefix: 'embroidery_'
		};
	},

	init: function() {
		this.initConfig();
	},

	send: function( action, options ) {
		var self = this,
			ajaxParams = embroidery.helpers.cloneObject( this.config.ajaxParams );

		options = options || {};

		action = this.config.actionPrefix + action;

		jQuery.extend( ajaxParams, options );

		if ( ajaxParams.data instanceof FormData ) {
			ajaxParams.data.append( 'action', action );
			ajaxParams.data.append( '_nonce', embroidery.config.nonce );
		} else {
			ajaxParams.data.action = action;
			ajaxParams.data._nonce = embroidery.config.nonce;
		}

		var successCallback = ajaxParams.success,
			errorCallback = ajaxParams.error;

		if ( successCallback || errorCallback ) {
			ajaxParams.success = function( response ) {
				if ( response.success && successCallback ) {
					successCallback( response.data );
				}

				if ( ( ! response.success ) && errorCallback ) {
					errorCallback( response.data );
				}
			};

			if ( errorCallback ) {
				ajaxParams.error = function( data ) {
					errorCallback( data );
				};
			} else {
				ajaxParams.error = function( XMLHttpRequest ) {
					var message = self.createErrorMessage( XMLHttpRequest );

					embroidery.notifications.showToast( {
						message: message
					} );
				};
			}
		}

		return jQuery.ajax( ajaxParams );
	},

	createErrorMessage: function( XMLHttpRequest ) {
		var message;
		if ( 4 === XMLHttpRequest.readyState ) {
			message = embroidery.translate( 'server_error' );
			if ( 200 !== XMLHttpRequest.status ) {
				message += ' (' + XMLHttpRequest.status + ' ' + XMLHttpRequest.statusText + ')';
			}
		} else if ( 0 === XMLHttpRequest.readyState ) {
			message = embroidery.translate( 'server_connection_lost' );
		} else {
			message = embroidery.translate( 'unknown_error' );
		}

		return message + '.';
	}
};

module.exports = Ajax;

},{}],102:[function(require,module,exports){
var Conditions;

Conditions = function() {
	var self = this;

	this.compare = function( leftValue, rightValue, operator ) {
		switch ( operator ) {
			/* jshint ignore:start */
			case '==':
				return leftValue == rightValue;
			case '!=':
				return leftValue != rightValue;
			/* jshint ignore:end */
			case '!==':
				return leftValue !== rightValue;
			case 'in':
				return -1 !== rightValue.indexOf( leftValue );
			case '!in':
				return -1 === rightValue.indexOf( leftValue );
			case '<':
				return leftValue < rightValue;
			case '<=':
				return leftValue <= rightValue;
			case '>':
				return leftValue > rightValue;
			case '>=':
				return leftValue >= rightValue;
			default:
				return leftValue === rightValue;
		}
	};

	this.check = function( conditions, comparisonObject ) {
		var isOrCondition = 'or' === conditions.relation,
			conditionSucceed = ! isOrCondition;

		jQuery.each( conditions.terms, function() {
			var term = this,
				comparisonResult;

			if ( term.terms ) {
				comparisonResult = self.check( term, comparisonObject );
			} else {
				var parsedName = term.name.match( /(\w+)(?:\[(\w+)])?/ ),
					value = comparisonObject[ parsedName[ 1 ] ];

				if ( parsedName[ 2 ] ) {
					value = value[ parsedName[ 2 ] ];
				}

				comparisonResult = self.compare( value, term.value, term.operator );
			}

			if ( isOrCondition ) {
				if ( comparisonResult ) {
					conditionSucceed = true;
				}

				return ! comparisonResult;
			}

			if ( ! comparisonResult ) {
				return conditionSucceed = false;
			}
		} );

		return conditionSucceed;
	};
};

module.exports = new Conditions();

},{}],103:[function(require,module,exports){
var ViewModule = require( 'embroidery-utils/view-module' ),
	Stylesheet = require( 'embroidery-editor-utils/stylesheet' ),
	ControlsCSSParser;

ControlsCSSParser = ViewModule.extend( {
	stylesheet: null,

	getDefaultSettings: function() {
		return {
			id: 0
		};
	},

	getDefaultElements: function() {
		return {
			$stylesheetElement: jQuery( '<style>', { id: 'embroidery-style-' + this.getSettings( 'id' ) } )
		};
	},

	initStylesheet: function() {
		var viewportBreakpoints = embroidery.config.viewportBreakpoints;

		this.stylesheet = new Stylesheet();

		this.stylesheet
			.addDevice( 'mobile', 0 )
			.addDevice( 'tablet', viewportBreakpoints.md )
			.addDevice( 'desktop', viewportBreakpoints.lg );
	},

	addStyleRules: function( controls, values, controlsStack, placeholders, replacements ) {
		var self = this;

		_.each( controls, function( control ) {
			if ( control.styleFields && control.styleFields.length ) {
				values[ control.name ].each( function( itemModel ) {
					self.addStyleRules(
						control.styleFields,
						itemModel.attributes,
						controlsStack,
						placeholders.concat( [ '{{CURRENT_ITEM}}' ] ),
						replacements.concat( [ '.embroidery-repeater-item-' + itemModel.get( '_id' ) ] )
					);
				} );
			}

			self.addControlStyleRules( control, values, controlsStack, placeholders, replacements );
		} );
	},

	addControlStyleRules: function( control, values, controlsStack, placeholders, replacements ) {
		var self = this;

		ControlsCSSParser.addControlStyleRules( self.stylesheet, control, controlsStack, function( control ) {
			return self.getStyleControlValue( control, values );
		}, placeholders, replacements );
	},

	getStyleControlValue: function( control, values ) {
		var value = values[ control.name ];

		if ( control.selectors_dictionary ) {
			value = control.selectors_dictionary[ value ] || value;
		}

		if ( ! _.isNumber( value ) && _.isEmpty( value ) ) {
			return;
		}

		return value;
	},

	addStyleToDocument: function() {
		embroidery.$previewContents.find( 'head' ).append( this.elements.$stylesheetElement );

		this.elements.$stylesheetElement.text( this.stylesheet );
	},

	removeStyleFromDocument: function() {
		this.elements.$stylesheetElement.remove();
	},

	onInit: function() {
		ViewModule.prototype.onInit.apply( this, arguments );

		this.initStylesheet();
	}
} );

ControlsCSSParser.addControlStyleRules = function( stylesheet, control, controlsStack, valueCallback, placeholders, replacements ) {
	var value = valueCallback( control );

	if ( undefined === value ) {
		return;
	}

	_.each( control.selectors, function( cssProperty, selector ) {
		var outputCssProperty;

		try {
			outputCssProperty = cssProperty.replace( /{{(?:([^.}]+)\.)?([^}]*)}}/g, function( originalPhrase, controlName, placeholder ) {
				var parserControl = control,
					valueToInsert = value;

				if ( controlName ) {
					parserControl = _.findWhere( controlsStack, { name: controlName } );

					if ( ! parserControl ) {
						return '';
					}

					valueToInsert = valueCallback( parserControl );
				}

				var parsedValue = embroidery.getControlView( parserControl.type ).getStyleValue( placeholder.toLowerCase(), valueToInsert );

				if ( '' === parsedValue ) {
					throw '';
				}

				return parsedValue;
			} );
		} catch ( e ) {
			return;
		}

		if ( _.isEmpty( outputCssProperty ) ) {
			return;
		}

		var devicePattern = /^(?:\([^)]+\)){1,2}/,
			deviceRules = selector.match( devicePattern ),
			query = {};

		if ( deviceRules ) {
			deviceRules = deviceRules[0];

			selector = selector.replace( devicePattern, '' );

			var pureDevicePattern = /\(([^)]+)\)/g,
				pureDeviceRules = [],
				matches;

			while ( matches = pureDevicePattern.exec( deviceRules ) ) {
				pureDeviceRules.push( matches[1] );
			}

			_.each( pureDeviceRules, function( deviceRule ) {
				if ( 'desktop' === deviceRule ) {
					return;
				}

				var device = deviceRule.replace( /\+$/, '' ),
					endPoint = device === deviceRule ? 'max' : 'min';

				query[ endPoint ] = device;
			} );
		}

		_.each( placeholders, function( placeholder, index ) {
			// Check if it's a RegExp
			var regexp = placeholder.source ? placeholder.source : placeholder,
				placeholderPattern = new RegExp( regexp, 'g' );

			selector = selector.replace( placeholderPattern, replacements[ index ] );
		} );

		if ( ! Object.keys( query ).length && control.responsive ) {
			query = _.pick( embroidery.helpers.cloneObject( control.responsive ), [ 'min', 'max' ] );

			if ( 'desktop' === query.max ) {
				delete query.max;
			}
		}

		stylesheet.addRules( selector, outputCssProperty, query );
	} );
};

module.exports = ControlsCSSParser;

},{"embroidery-editor-utils/stylesheet":113,"embroidery-utils/view-module":124}],104:[function(require,module,exports){
var Debug = function() {
	var self = this,
		errorStack = [],
		settings = {},
		elements = {};

	var initSettings = function() {
		settings = {
			debounceDelay: 500,
			urlsToWatch: [
				'embroidery/assets'
			]
		};
	};

	var initElements = function() {
		elements.$window = jQuery( window );
	};

	var onError = function( event ) {
		var originalEvent = event.originalEvent,
			error = originalEvent.error;

		if ( ! error ) {
			return;
		}

		var isInWatchList = false,
			urlsToWatch = settings.urlsToWatch;

		jQuery.each( urlsToWatch, function() {
			if ( -1 !== error.stack.indexOf( this ) ) {
				isInWatchList = true;

				return false;
			}
		} );

		if ( ! isInWatchList ) {
			return;
		}

		self.addError( {
			type: error.name,
			message: error.message,
			url: originalEvent.filename,
			line: originalEvent.lineno,
			column: originalEvent.colno
		} );
	};

	var bindEvents = function() {
		elements.$window.on( 'error', onError );
	};

	var init = function() {
		initSettings();

		initElements();

		bindEvents();

		self.sendErrors = _.debounce( self.sendErrors, settings.debounceDelay );
	};

	this.addURLToWatch = function( url ) {
		settings.urlsToWatch.push( url );
	};

	this.addCustomError = function( error, category, tag ) {
		var errorInfo = {
			type: error.name,
			message: error.message,
			url: error.fileName || error.sourceURL,
			line: error.lineNumber || error.line,
			column: error.columnNumber || error.column,
			customFields: {
				category: category || 'general',
				tag: tag
			}
		};

		if ( ! errorInfo.url ) {
			var stackInfo =  error.stack.match( /\n {4}at (.*?(?=:(\d+):(\d+)))/ );

			if ( stackInfo ) {
				errorInfo.url = stackInfo[1];
				errorInfo.line = stackInfo[2];
				errorInfo.column = stackInfo[3];
			}
		}

		this.addError( errorInfo );
	};

	this.addError = function( errorParams ) {
		var defaultParams = {
			type: 'Error',
			timestamp: Math.floor( new Date().getTime() / 1000 ),
			message: null,
			url: null,
			line: null,
			column: null,
			customFields: {}
		};

		errorStack.push( jQuery.extend( true, defaultParams, errorParams ) );

		self.sendErrors();
	};

	this.sendErrors = function() {
		// Avoid recursions on errors in ajax
		elements.$window.off( 'error', onError );

		jQuery.ajax( {
			url: EmbroideryConfig.ajaxurl,
			method: 'POST',
			data: {
				action: 'embroidery_debug_log',
				data: errorStack
			},
			success: function() {
				errorStack = [];

				// Restore error handler
				elements.$window.on( 'error', onError );
			}
		} );
	};

	init();
};

module.exports = new Debug();

},{}],105:[function(require,module,exports){
var heartbeat;

heartbeat = {

	init: function() {
		var modal;

		this.getModal = function() {
			if ( ! modal ) {
				modal = this.initModal();
			}

			return modal;
		};

		jQuery( document ).on( {
			'heartbeat-send': function( event, data ) {
				data.embroidery_post_lock = {
					post_ID: embroidery.config.post_id
				};
			},
			'heartbeat-tick': function( event, response ) {
				if ( response.locked_user ) {
					if ( embroidery.saver.isEditorChanged() ) {
						embroidery.saver.saveEditor( {
							status: 'autosave'
						} );
					}

					heartbeat.showLockMessage( response.locked_user );
				} else {
					heartbeat.getModal().hide();
				}

				embroidery.config.nonce = response.embroideryNonce;
			},
			'heartbeat-tick.wp-refresh-nonces': function( event, response ) {
				var nonces = response['embroidery-refresh-nonces'];

				if ( nonces ) {
					if ( nonces.heartbeatNonce ) {
						embroidery.config.nonce = nonces.embroideryNonce;
					}

					if ( nonces.heartbeatNonce ) {
						window.heartbeatSettings.nonce = nonces.heartbeatNonce;
					}
				}
			}
		} );

		if ( embroidery.config.locked_user ) {
			heartbeat.showLockMessage( embroidery.config.locked_user );
		}
	},

	initModal: function() {
		var modal = embroidery.dialogsManager.createWidget( 'lightbox', {
			headerMessage: embroidery.translate( 'take_over' )
		} );

		modal.addButton( {
			name: 'go_back',
			text: embroidery.translate( 'go_back' ),
			callback: function() {
				parent.history.go( -1 );
			}
		} );

		modal.addButton( {
			name: 'take_over',
			text: embroidery.translate( 'take_over' ),
			callback: function() {
				wp.heartbeat.enqueue( 'embroidery_force_post_lock', true );
				wp.heartbeat.connectNow();
			}
		} );

		return modal;
	},

	showLockMessage: function( lockedUser ) {
		var modal = heartbeat.getModal();

		modal
			.setMessage( embroidery.translate( 'dialog_user_taken_over', [ lockedUser ] ) )
		    .show();
	}
};

module.exports = heartbeat;

},{}],106:[function(require,module,exports){
var helpers;

helpers = {
	_enqueuedFonts: [],

	elementsHierarchy: {
		section: {
			column: {
				widget: null,
				section: null
			}
		}
	},

	enqueueFont: function( font ) {
		if ( -1 !== this._enqueuedFonts.indexOf( font ) ) {
			return;
		}

		var fontType = embroidery.config.controls.font.options[ font ],
			fontUrl,

			subsets = {
				'ru_RU': 'cyrillic',
				'uk': 'cyrillic',
				'bg_BG': 'cyrillic',
				'vi': 'vietnamese',
				'el': 'greek',
				'he_IL': 'hebrew'
			};

		switch ( fontType ) {
			case 'googlefonts' :
				fontUrl = 'https://fonts.googleapis.com/css?family=' + font + ':100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic';

				if ( subsets[ embroidery.config.locale ] ) {
					fontUrl += '&subset=' + subsets[ embroidery.config.locale ];
				}

				break;

			case 'earlyaccess' :
				var fontLowerString = font.replace( /\s+/g, '' ).toLowerCase();
				fontUrl = 'https://fonts.googleapis.com/earlyaccess/' + fontLowerString + '.css';
				break;
		}

		if ( ! _.isEmpty( fontUrl ) ) {
			embroidery.$previewContents.find( 'link:last' ).after( '<link href="' + fontUrl + '" rel="stylesheet" type="text/css">' );
		}
		this._enqueuedFonts.push( font );
	},

	getElementChildType: function( elementType, container ) {
		if ( ! container ) {
			container = this.elementsHierarchy;
		}

		if ( undefined !== container[ elementType ] ) {

			if ( jQuery.isPlainObject( container[ elementType ] ) ) {
				return Object.keys( container[ elementType ] );
			}

			return null;
		}

		for ( var type in container ) {

			if ( ! container.hasOwnProperty( type ) ) {
				continue;
			}

			if ( ! jQuery.isPlainObject( container[ type ] ) ) {
				continue;
			}

			var result = this.getElementChildType( elementType, container[ type ] );

			if ( result ) {
				return result;
			}
		}

		return null;
	},

	getUniqueID: function() {
		return Math.random().toString( 16 ).substr( 2, 7 );
	},

	stringReplaceAll: function( string, replaces ) {
		var re = new RegExp( Object.keys( replaces ).join( '|' ), 'gi' );

		return string.replace( re, function( matched ) {
			return replaces[ matched ];
		} );
	},

	isActiveControl: function( controlModel, values ) {
		var condition,
			conditions;

		// TODO: Better way to get this?
		if ( _.isFunction( controlModel.get ) ) {
			condition = controlModel.get( 'condition' );
			conditions = controlModel.get( 'conditions' );
		} else {
			condition = controlModel.condition;
			conditions = controlModel.conditions;
		}

		// Multiple conditions with relations.
		if ( conditions ) {
			return embroidery.conditions.check( conditions, values );
		}

		if ( _.isEmpty( condition ) ) {
			return true;
		}

		var hasFields = _.filter( condition, function( conditionValue, conditionName ) {
			var conditionNameParts = conditionName.match( /([a-z_0-9]+)(?:\[([a-z_]+)])?(!?)$/i ),
				conditionRealName = conditionNameParts[1],
				conditionSubKey = conditionNameParts[2],
				isNegativeCondition = !! conditionNameParts[3],
				controlValue = values[ conditionRealName ];

			if ( undefined === controlValue ) {
				return true;
			}

			if ( conditionSubKey ) {
				controlValue = controlValue[ conditionSubKey ];
			}

			// If it's a non empty array - check if the conditionValue contains the controlValue,
			// If the controlValue is a non empty array - check if the controlValue contains the conditionValue
			// otherwise check if they are equal. ( and give the ability to check if the value is an empty array )
			var isContains;
			if ( _.isArray( conditionValue ) && ! _.isEmpty( conditionValue ) ) {
				isContains = _.contains( conditionValue, controlValue );
			} else if ( _.isArray( controlValue ) && ! _.isEmpty( controlValue ) ) {
				isContains = _.contains( controlValue, conditionValue );
			} else {
				isContains = _.isEqual( conditionValue, controlValue );
			}

			return isNegativeCondition ? isContains : ! isContains;
		} );

		return _.isEmpty( hasFields );
	},

	cloneObject: function( object ) {
		return JSON.parse( JSON.stringify( object ) );
	},

	disableElementEvents: function( $element ) {
		$element.each( function() {
			var currentPointerEvents = this.style.pointerEvents;

			if ( 'none' === currentPointerEvents ) {
				return;
			}

			jQuery( this )
				.data( 'backup-pointer-events', currentPointerEvents )
				.css( 'pointer-events', 'none' );
		} );
	},

	enableElementEvents: function( $element ) {
		$element.each( function() {
			var $this = jQuery( this ),
				backupPointerEvents = $this.data( 'backup-pointer-events' );

			if ( undefined === backupPointerEvents ) {
				return;
			}

			$this
				.removeData( 'backup-pointer-events' )
				.css( 'pointer-events', backupPointerEvents );
		} );
	},

	getColorPickerPaletteIndex: function( paletteKey ) {
		return [ '7', '8', '1', '5', '2', '3', '6', '4' ].indexOf( paletteKey );
	},

	wpColorPicker: function( $element, options ) {
		var self = this,
			colorPickerScheme = embroidery.schemes.getScheme( 'color-picker' ),
			items = _.sortBy( colorPickerScheme.items, function( item ) {
				return self.getColorPickerPaletteIndex( item.key );
			} ),
			defaultOptions = {
				width: window.innerWidth >= 1440 ? 271 : 251,
				palettes: _.pluck( items, 'value' )
			};

		if ( options ) {
			_.extend( defaultOptions, options );
		}

		return $element.wpColorPicker( defaultOptions );
	},

	isInViewport: function( element, html ) {
		var rect = element.getBoundingClientRect();
		html = html || document.documentElement;
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= ( window.innerHeight || html.clientHeight ) &&
			rect.right <= ( window.innerWidth || html.clientWidth )
		);
	},

	scrollToView: function( view ) {
		// Timeout according to preview resize css animation duration
		setTimeout( function() {
			embroidery.$previewContents.find( 'html, body' ).animate( {
				scrollTop: view.$el.offset().top - embroidery.$preview[0].contentWindow.innerHeight / 2
			} );
		}, 500 );
	}
};

module.exports = helpers;

},{}],107:[function(require,module,exports){
var ImagesManager;

ImagesManager = function() {
	var self = this;

	var cache = {};

	var debounceDelay = 300;

	var registeredItems = [];

	var getNormalizedSize = function( image ) {
		var size,
			imageSize = image.size;

		if ( 'custom' === imageSize ) {
			var customDimension = image.dimension;

			if ( customDimension.width || customDimension.height ) {
				size = 'custom_' + customDimension.width + 'x' + customDimension.height;
			} else {
				return 'full';
			}
		} else {
			size = imageSize;
		}

		return size;
	};

	self.onceTriggerChange = _.once( function( model ) {
		window.setTimeout( function() {
			model.get( 'settings' ).trigger( 'change', model.get( 'settings' ) );
		}, 700 );
	} );

	self.getImageUrl = function( image ) {
		// Register for AJAX checking
		self.registerItem( image );

		var imageUrl = self.getItem( image );

		// If it's not in cache, like a new dropped widget or a custom size - get from settings
		if ( ! imageUrl ) {

			if ( 'custom' === image.size ) {

				if ( embroidery.getPanelView() && 'editor' === embroidery.getPanelView().currentPageName && image.model ) {
					// Trigger change again, so it's will load from the cache
					self.onceTriggerChange( image.model );
				}

				return;
			}

			// If it's a new dropped widget
			imageUrl = image.url;
		}

		return imageUrl;
	};

	self.getItem = function( image ) {
		var size = getNormalizedSize( image ),
			id =  image.id;

		if ( ! size ) {
			return false;
		}

		if ( cache[ id ] && cache[ id ][ size ] ) {
			return cache[ id ][ size ];
		}

		return false;
	};

	self.registerItem = function( image ) {
		if ( '' === image.id ) {
			// It's a new dropped widget
			return;
		}

		if ( self.getItem( image ) ) {
			// It's already in cache
			return;
		}

		registeredItems.push( image );

		self.debounceGetRemoteItems();
	};

	self.getRemoteItems = function() {
		var requestedItems = [],
		registeredItemsLength = Object.keys( registeredItems ).length,
			image,
			index;

		// It's one item, so we can render it from remote server
		if ( 0 === registeredItemsLength ) {
			return;
		} else if ( 1 === registeredItemsLength ) {
			for ( index in registeredItems ) {
				image = registeredItems[ index ];
				break;
			}

			if ( image && image.model ) {
				image.model.renderRemoteServer();
				return;
			}
		}

		for ( index in registeredItems ) {
			image = registeredItems[ index ];

			var size = getNormalizedSize( image ),
				id = image.id,
				isFirstTime = ! cache[ id ] || 0 === Object.keys( cache[ id ] ).length;

			requestedItems.push( {
				id: id,
				size: size,
				is_first_time: isFirstTime
			} );
		}

		window.embroidery.ajax.send(
			'get_images_details', {
				data: {
					items: requestedItems
				},
				success: function( data ) {
					var id,
						size;

					for ( id in data ) {
						if ( ! cache[ id ] ) {
							cache[ id ] = {};
						}

						for ( size in data[ id ] ) {
							cache[ id ][ size ] = data[ id ][ size ];
						}
					}
					registeredItems = [];
				}
			}
		);
	};

	self.debounceGetRemoteItems = _.debounce( self.getRemoteItems, debounceDelay );
};

module.exports = new ImagesManager();

},{}],108:[function(require,module,exports){
/**
 * HTML5 - Drag and Drop
 */
;(function( $ ) {

	var hasFullDataTransferSupport = function( event ) {
		try {
			event.originalEvent.dataTransfer.setData( 'test', 'test' );

			event.originalEvent.dataTransfer.clearData( 'test' );

			return true;
		} catch ( e ) {
			return false;
		}
	};

	var Draggable = function( userSettings ) {
		var self = this,
			settings = {},
			elementsCache = {},
			defaultSettings = {
				element: '',
				groups: null,
				onDragStart: null,
				onDragEnd: null
			};

		var initSettings = function() {
			$.extend( true, settings, defaultSettings, userSettings );
		};

		var initElementsCache = function() {
			elementsCache.$element = $( settings.element );
		};

		var buildElements = function() {
			elementsCache.$element.attr( 'draggable', true );
		};

		var onDragEnd = function( event ) {
			if ( $.isFunction( settings.onDragEnd ) ) {
				settings.onDragEnd.call( elementsCache.$element, event, self );
			}
		};

		var onDragStart = function( event ) {
			var groups = settings.groups || [],
				dataContainer = {
					groups: groups
				};

			if ( hasFullDataTransferSupport( event ) ) {
				event.originalEvent.dataTransfer.setData( JSON.stringify( dataContainer ), true );
			}

			if ( $.isFunction( settings.onDragStart ) ) {
				settings.onDragStart.call( elementsCache.$element, event, self );
			}
		};

		var attachEvents = function() {
			elementsCache.$element
				.on( 'dragstart', onDragStart )
				.on( 'dragend', onDragEnd );
		};

		var init = function() {
			initSettings();

			initElementsCache();

			buildElements();

			attachEvents();
		};

		this.destroy = function() {
			elementsCache.$element.off( 'dragstart', onDragStart );

			elementsCache.$element.removeAttr( 'draggable' );
		};

		init();
	};

	var Droppable = function( userSettings ) {
		var self = this,
			settings = {},
			elementsCache = {},
			currentElement,
			currentSide,
			defaultSettings = {
				element: '',
				items: '>',
				horizontalSensitivity: '10%',
				axis: [ 'vertical', 'horizontal' ],
				placeholder: true,
				currentElementClass: 'html5dnd-current-element',
				placeholderClass: 'html5dnd-placeholder',
				hasDraggingOnChildClass: 'html5dnd-has-dragging-on-child',
				groups: null,
				isDroppingAllowed: null,
				onDragEnter: null,
				onDragging: null,
				onDropping: null,
				onDragLeave: null
			};

		var initSettings = function() {
			$.extend( settings, defaultSettings, userSettings );
		};

		var initElementsCache = function() {
			elementsCache.$element = $( settings.element );

			elementsCache.$placeholder = $( '<div>', { 'class': settings.placeholderClass } );
		};

		var hasHorizontalDetection = function() {
			return -1 !== settings.axis.indexOf( 'horizontal' );
		};

		var hasVerticalDetection = function() {
			return -1 !== settings.axis.indexOf( 'vertical' );
		};

		var checkHorizontal = function( offsetX, elementWidth ) {
			var isPercentValue,
				sensitivity;

			if ( ! hasHorizontalDetection() ) {
				return false;
			}

			if ( ! hasVerticalDetection() ) {
				return offsetX > elementWidth / 2 ? 'right' : 'left';
			}

			sensitivity = settings.horizontalSensitivity.match( /\d+/ );

			if ( ! sensitivity ) {
				return false;
			}

			sensitivity = sensitivity[0];

			isPercentValue = /%$/.test( settings.horizontalSensitivity );

			if ( isPercentValue ) {
				sensitivity = elementWidth / sensitivity;
			}

			if ( offsetX > elementWidth - sensitivity ) {
				return 'right';
			} else if ( offsetX < sensitivity ) {
				return 'left';
			}

			return false;
		};

		var setSide = function( event ) {
			var $element = $( currentElement ),
				elementHeight = $element.outerHeight() - elementsCache.$placeholder.outerHeight(),
				elementWidth = $element.outerWidth();

			event = event.originalEvent;

			if ( currentSide = checkHorizontal( event.offsetX, elementWidth ) ) {
				return;
			}

			if ( ! hasVerticalDetection() ) {
				currentSide = null;

				return;
			}

			var elementPosition = currentElement.getBoundingClientRect();

			currentSide = event.clientY > elementPosition.top + elementHeight / 2 ? 'bottom' : 'top';
		};

		var insertPlaceholder = function() {
			if ( ! settings.placeholder ) {
				return;
			}

			var insertMethod = 'top' === currentSide ? 'prependTo' : 'appendTo';

			elementsCache.$placeholder[ insertMethod ]( currentElement );
		};

		var isDroppingAllowed = function( event ) {
			var dataTransferTypes,
				draggableGroups,
				isGroupMatch,
				isDroppingAllowed;

			if ( settings.groups && hasFullDataTransferSupport( event ) ) {
				dataTransferTypes = event.originalEvent.dataTransfer.types;

				isGroupMatch = false;

				dataTransferTypes = Array.prototype.slice.apply( dataTransferTypes ); // Convert to array, since Firefox hold it as DOMStringList

				dataTransferTypes.forEach( function( type ) {
					try {
						draggableGroups = JSON.parse( type );

						if ( ! draggableGroups.groups.slice ) {
							return;
						}

						settings.groups.forEach( function( groupName ) {

							if ( -1 !== draggableGroups.groups.indexOf( groupName ) ) {
								isGroupMatch = true;

								return false; // stops the forEach from extra loops
							}
						} );
					} catch ( e ) {
					}
				} );

				if ( ! isGroupMatch ) {
					return false;
				}
			}

			if ( $.isFunction( settings.isDroppingAllowed ) ) {

				isDroppingAllowed = settings.isDroppingAllowed.call( currentElement, currentSide, event, self );

				if ( ! isDroppingAllowed ) {
					return false;
				}
			}

			return true;
		};

		var onDragEnter = function( event ) {
			event.stopPropagation();

			if ( currentElement ) {
				return;
			}

			currentElement = this;

			elementsCache.$element.parents().each( function() {
				var droppableInstance = $( this ).data( 'html5Droppable' );

				if ( ! droppableInstance ) {
					return;
				}

				droppableInstance.doDragLeave();
			} );

			setSide( event );

			if ( ! isDroppingAllowed( event ) ) {
				return;
			}

			insertPlaceholder();

			elementsCache.$element.addClass( settings.hasDraggingOnChildClass );

			$( currentElement ).addClass( settings.currentElementClass );

			if ( $.isFunction( settings.onDragEnter ) ) {
				settings.onDragEnter.call( currentElement, currentSide, event, self );
			}
		};

		var onDragOver = function( event ) {
			event.stopPropagation();

			if ( ! currentElement ) {
				onDragEnter.call( this, event );
			}

			var oldSide = currentSide;

			setSide( event );

			if ( ! isDroppingAllowed( event ) ) {
				return;
			}

			event.preventDefault();

			if ( oldSide !== currentSide ) {
				insertPlaceholder();
			}

			if ( $.isFunction( settings.onDragging ) ) {
				settings.onDragging.call( this, currentSide, event, self );
			}
		};

		var onDragLeave = function( event ) {
			var elementPosition = this.getBoundingClientRect();

			if ( 'dragleave' === event.type && ! (
				event.clientX < elementPosition.left ||
				event.clientX >= elementPosition.right ||
				event.clientY < elementPosition.top ||
				event.clientY >= elementPosition.bottom
			) ) {
				return;
			}

			$( currentElement ).removeClass( settings.currentElementClass );

			self.doDragLeave();
		};

		var onDrop = function( event ) {
			setSide( event );

			if ( ! isDroppingAllowed( event ) ) {
				return;
			}

			event.preventDefault();

			if ( $.isFunction( settings.onDropping ) ) {
				settings.onDropping.call( this, currentSide, event, self );
			}
		};

		var attachEvents = function() {
			elementsCache.$element
				.on( 'dragenter', settings.items, onDragEnter )
				.on( 'dragover', settings.items, onDragOver )
				.on( 'drop', settings.items, onDrop )
				.on( 'dragleave drop', settings.items, onDragLeave );
		};

		var init = function() {
			initSettings();

			initElementsCache();

			attachEvents();
		};

		this.doDragLeave = function() {
			if ( settings.placeholder ) {
				elementsCache.$placeholder.remove();
			}

			elementsCache.$element.removeClass( settings.hasDraggingOnChildClass );

			if ( $.isFunction( settings.onDragLeave ) ) {
				settings.onDragLeave.call( currentElement, event, self );
			}

			currentElement = currentSide = null;
		};

		this.destroy = function() {
			elementsCache.$element
				.off( 'dragenter', settings.items, onDragEnter )
				.off( 'dragover', settings.items, onDragOver )
				.off( 'drop', settings.items, onDrop )
				.off( 'dragleave drop', settings.items, onDragLeave );
		};

		init();
	};

	var plugins = {
		html5Draggable: Draggable,
		html5Droppable: Droppable
	};

	$.each( plugins, function( pluginName, Plugin ) {
		$.fn[ pluginName ] = function( options ) {
			options = options || {};

			this.each( function() {
				var instance = $.data( this, pluginName ),
					hasInstance = instance instanceof Plugin;

				if ( hasInstance ) {

					if ( 'destroy' === options ) {

						instance.destroy();

						$.removeData( this, pluginName );
					}

					return;
				}

				options.element = this;

				$.data( this, pluginName, new Plugin( options ) );
			} );

			return this;
		};
	} );
})( jQuery );

},{}],109:[function(require,module,exports){
/*!
 * jQuery Serialize Object v1.0.1
 */
(function( $ ) {
	$.fn.embroiderySerializeObject = function() {
		var serializedArray = this.serializeArray(),
			data = {};

		var parseObject = function( dataContainer, key, value ) {
			var isArrayKey = /^[^\[\]]+\[]/.test( key ),
				isObjectKey = /^[^\[\]]+\[[^\[\]]+]/.test( key ),
				keyName = key.replace( /\[.*/, '' );

			if ( isArrayKey ) {
				if ( ! dataContainer[ keyName ] ) {
					dataContainer[ keyName ] = [];
				}
			} else {
				if ( ! isObjectKey ) {
					if ( dataContainer.push ) {
						dataContainer.push( value );
					} else {
						dataContainer[ keyName ] = value;
					}

					return;
				}

				if ( ! dataContainer[ keyName ] ) {
					dataContainer[ keyName ] = {};
				}
			}

			var nextKeys = key.match( /\[[^\[\]]*]/g );

			nextKeys[ 0 ] = nextKeys[ 0 ].replace( /\[|]/g, '' );

			return parseObject( dataContainer[ keyName ], nextKeys.join( '' ), value );
		};

		$.each( serializedArray, function() {
			parseObject( data, this.name, this.value );
		} );
		return data;
	};
})( jQuery );

},{}],110:[function(require,module,exports){
var Module = require( 'embroidery-utils/module' );

module.exports = Module.extend( {
	initToast: function() {
		var toast = embroidery.dialogsManager.createWidget( 'buttons', {
			id: 'embroidery-toast',
			position: {
				my: 'center bottom',
				at: 'center bottom-10',
				of: '#embroidery-panel-content-wrapper',
				autoRefresh: true
			},
			hide: {
				onClick: true,
				auto: true,
				autoDelay: 10000
			},
			effects: {
				show: function() {
					var $widget = toast.getElements( 'widget' );

					$widget.show();

					toast.refreshPosition();

					var top = parseInt( $widget.css( 'top' ), 10 );

					$widget
						.hide()
						.css( 'top', top + 100 );

					$widget.animate( {
						opacity: 'show',
						height: 'show',
						paddingBottom: 'show',
						paddingTop: 'show',
						top: top
					}, {
						easing: 'linear',
						duration: 300
					} );
				},
				hide: function() {
					var $widget = toast.getElements( 'widget' ),
						top = parseInt( $widget.css( 'top' ), 10 );

					$widget.animate( {
						opacity: 'hide',
						height: 'hide',
						paddingBottom: 'hide',
						paddingTop: 'hide',
						top: top + 100
					}, {
						easing: 'linear',
						duration: 300
					} );
				}
			},
			buttonTag: 'div'
		} );

		this.getToast = function() {
			return toast;
		};
	},

	showToast: function( options ) {
		var toast = this.getToast();

		toast.setMessage( options.message );

		toast.getElements( 'buttonsWrapper' ).empty();

		if ( options.buttons ) {
			options.buttons.forEach( function( button ) {
				toast.addButton( button );
			} );
		}

		toast.show();
	},

	onInit: function() {
		this.initToast();
	}
} );

},{"embroidery-utils/module":123}],111:[function(require,module,exports){
var presetsFactory;

presetsFactory = {

	getPresetsDictionary: function() {
		return {
			11: 100 / 9,
			12: 100 / 8,
			14: 100 / 7,
			16: 100 / 6,
			33: 100 / 3,
			66: 2 / 3 * 100,
			83: 5 / 6 * 100
		};
	},

	getAbsolutePresetValues: function( preset ) {
		var clonedPreset = embroidery.helpers.cloneObject( preset ),
			presetDictionary = this.getPresetsDictionary();

		_.each( clonedPreset, function( unitValue, unitIndex ) {
			if ( presetDictionary[ unitValue ] ) {
				clonedPreset[ unitIndex ] = presetDictionary[ unitValue ];
			}
		} );

		return clonedPreset;
	},

	getPresets: function( columnsCount, presetIndex ) {
		var presets = embroidery.helpers.cloneObject( embroidery.config.elements.section.presets );

		if ( columnsCount ) {
			presets = presets[ columnsCount ];
		}

		if ( presetIndex ) {
			presets = presets[ presetIndex ];
		}

		return presets;
	},

	getPresetByStructure: function( structure ) {
		var parsedStructure = this.getParsedStructure( structure );

		return this.getPresets( parsedStructure.columnsCount, parsedStructure.presetIndex );
	},

	getParsedStructure: function( structure ) {
		structure += ''; // Make sure this is a string

		return {
			columnsCount: structure.slice( 0, -1 ),
			presetIndex: structure.substr( -1 )
		};
	},

	getPresetSVG: function( preset, svgWidth, svgHeight, separatorWidth ) {
		svgWidth = svgWidth || 100;
		svgHeight = svgHeight || 50;
		separatorWidth = separatorWidth || 2;

		var absolutePresetValues = this.getAbsolutePresetValues( preset ),
			presetSVGPath = this._generatePresetSVGPath( absolutePresetValues, svgWidth, svgHeight, separatorWidth );

		return this._createSVGPreset( presetSVGPath, svgWidth, svgHeight );
	},

	_createSVGPreset: function( presetPath, svgWidth, svgHeight ) {
		var svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );

		svg.setAttributeNS( 'http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink' );
		svg.setAttribute( 'viewBox', '0 0 ' + svgWidth + ' ' + svgHeight );

		var path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );

		path.setAttribute( 'd', presetPath );

		svg.appendChild( path );

		return svg;
	},

	_generatePresetSVGPath: function( preset, svgWidth, svgHeight, separatorWidth ) {
		var DRAW_SIZE = svgWidth - separatorWidth * ( preset.length - 1 );

		var xPointer = 0,
			dOutput = '';

		for ( var i = 0; i < preset.length; i++ ) {
			if ( i ) {
				dOutput += ' ';
			}

			var increment = preset[ i ] / 100 * DRAW_SIZE;

			xPointer += increment;

			dOutput += 'M' + ( +xPointer.toFixed( 4 ) ) + ',0';

			dOutput += 'V' + svgHeight;

			dOutput += 'H' + ( +( xPointer - increment ).toFixed( 4 ) );

			dOutput += 'V0Z';

			xPointer += separatorWidth;
		}

		return dOutput;
	}
};

module.exports = presetsFactory;

},{}],112:[function(require,module,exports){
var Schemes,
	Stylesheet = require( 'embroidery-editor-utils/stylesheet' ),
	ControlsCSSParser = require( 'embroidery-editor-utils/controls-css-parser' );

Schemes = function() {
	var self = this,
		stylesheet = new Stylesheet(),
		schemes = {},
		settings = {
			selectorWrapperPrefix: '.embroidery-widget-'
		},
		elements = {};

	var buildUI = function() {
		elements.$previewHead.append( elements.$style );
	};

	var initElements = function() {
		elements.$style = jQuery( '<style>', {
			id: 'embroidery-style-scheme'
		});

		elements.$previewHead = embroidery.$previewContents.find( 'head' );
	};

	var initSchemes = function() {
		schemes = embroidery.helpers.cloneObject( embroidery.config.schemes.items );
	};

	var fetchControlStyles = function( control, controlsStack, widgetType ) {
		ControlsCSSParser.addControlStyleRules( stylesheet, control, controlsStack, function( control ) {
			return self.getSchemeValue( control.scheme.type, control.scheme.value, control.scheme.key ).value;
		}, [ '{{WRAPPER}}' ], [ settings.selectorWrapperPrefix + widgetType ] );
	};

	var fetchWidgetControlsStyles = function( widget ) {
		var widgetSchemeControls = self.getWidgetSchemeControls( widget );

		_.each( widgetSchemeControls, function( control ) {
			fetchControlStyles( control, widgetSchemeControls, widget.widget_type );
		} );
	};

	var fetchAllWidgetsSchemesStyle = function() {
		_.each( embroidery.config.widgets, function( widget ) {
			fetchWidgetControlsStyles(  widget  );
		} );
	};

	this.init = function() {
		initElements();
		buildUI();
		initSchemes();

		return self;
	};

	this.getWidgetSchemeControls = function( widget ) {
		return _.filter( widget.controls, function( control ) {
			return _.isObject( control.scheme );
		} );
	};

	this.getSchemes = function() {
		return schemes;
	};

	this.getEnabledSchemesTypes = function() {
		return embroidery.config.schemes.enabled_schemes;
	};

	this.getScheme = function( schemeType ) {
		return schemes[ schemeType ];
	};

	this.getSchemeValue = function( schemeType, value, key ) {
		if ( this.getEnabledSchemesTypes().indexOf( schemeType ) < 0 ) {
			return false;
		}

		var scheme = self.getScheme( schemeType ),
			schemeValue = scheme.items[ value ];

		if ( key && _.isObject( schemeValue ) ) {
			var clonedSchemeValue = embroidery.helpers.cloneObject( schemeValue );

			clonedSchemeValue.value = schemeValue.value[ key ];

			return clonedSchemeValue;
		}

		return schemeValue;
	};

	this.printSchemesStyle = function() {
		stylesheet.empty();

		fetchAllWidgetsSchemesStyle();

		elements.$style.text( stylesheet );
	};

	this.resetSchemes = function( schemeName ) {
		schemes[ schemeName ] = embroidery.helpers.cloneObject( embroidery.config.schemes.items[ schemeName ] );
	};

	this.saveScheme = function( schemeName ) {
		embroidery.config.schemes.items[ schemeName ].items = embroidery.helpers.cloneObject( schemes[ schemeName ].items );

		var itemsToSave = {};

		_.each( schemes[ schemeName ].items, function( item, key ) {
			itemsToSave[ key ] = item.value;
		} );

		NProgress.start();

		embroidery.ajax.send( 'apply_scheme', {
			data: {
				scheme_name: schemeName,
				data: JSON.stringify( itemsToSave )
			},
			success: function() {
				NProgress.done();
			}
		} );
	};

	this.setSchemeValue = function( schemeName, itemKey, value ) {
		schemes[ schemeName ].items[ itemKey ].value = value;
	};
};

module.exports = new Schemes();

},{"embroidery-editor-utils/controls-css-parser":103,"embroidery-editor-utils/stylesheet":113}],113:[function(require,module,exports){
( function( $ ) {

	var Stylesheet = function() {
		var self = this,
			rules = {},
			rawCSS = {},
			devices = {};

		var getDeviceMaxValue = function( deviceName ) {
			var deviceNames = Object.keys( devices ),
				deviceNameIndex = deviceNames.indexOf( deviceName ),
				nextIndex = deviceNameIndex + 1;

			if ( nextIndex >= deviceNames.length ) {
				throw new RangeError( 'Max value for this device is out of range.' );
			}

			return devices[ deviceNames[ nextIndex ] ] - 1;
		};

		var queryToHash = function( query ) {
			var hash = [];

			$.each( query, function( endPoint ) {
				hash.push( endPoint + '_' + this );
			} );

			return hash.join( '-' );
		};

		var hashToQuery = function( hash ) {
			var query = {};

			hash = hash.split( '-' ).filter( String );

			hash.forEach( function( singleQuery ) {
				var queryParts = singleQuery.split( '_' ),
					endPoint = queryParts[0],
					deviceName = queryParts[1];

				query[ endPoint ] = 'max' === endPoint ? getDeviceMaxValue( deviceName ) : devices[ deviceName ];
			} );

			return query;
		};

		var addQueryHash = function( queryHash ) {
			rules[ queryHash ] = {};

			var hashes = Object.keys( rules );

			if ( hashes.length < 2 ) {
				return;
			}

			// Sort the devices from narrowest to widest
			hashes.sort( function( a, b ) {
				if ( 'all' === a ) {
					return -1;
				}

				if ( 'all' === b ) {
					return 1;
				}

				var aQuery = hashToQuery( a ),
					bQuery = hashToQuery( b );

				return bQuery.max - aQuery.max;
			} );

			var sortedRules = {};

			hashes.forEach( function( deviceName ) {
				sortedRules[ deviceName ] = rules[ deviceName ];
			} );

			rules = sortedRules;
		};

		var getQueryHashStyleFormat = function( queryHash ) {
			var query = hashToQuery( queryHash ),
				styleFormat = [];

			$.each( query, function( endPoint ) {
				styleFormat.push( '(' + endPoint + '-width:' + this + 'px)' );
			} );

			return '@media' + styleFormat.join( ' and ' );
		};

		this.addDevice = function( deviceName, deviceValue ) {
			devices[ deviceName ] = deviceValue;

			var deviceNames = Object.keys( devices );

			if ( deviceNames.length < 2 ) {
				return self;
			}

			// Sort the devices from narrowest to widest
			deviceNames.sort( function( a, b ) {
				return devices[ a ] - devices[ b ];
			} );

			var sortedDevices = {};

			deviceNames.forEach( function( deviceName ) {
				sortedDevices[ deviceName ] = devices[ deviceName ];
			} );

			devices = sortedDevices;

			return self;
		};

		this.addRawCSS = function( key, css ) {
			rawCSS[ key ] = css;
		};

		this.addRules = function( selector, styleRules, query ) {
			var queryHash = 'all';

			if ( ! _.isEmpty( query ) ) {
				queryHash = queryToHash( query );
			}

			if ( ! rules[ queryHash ] ) {
				addQueryHash( queryHash );
			}

			if ( ! styleRules ) {
				var parsedRules = selector.match( /[^{]+\{[^}]+}/g );

				$.each( parsedRules, function() {
					var parsedRule = this.match( /([^{]+)\{([^}]+)}/ );

					if ( parsedRule ) {
						self.addRules( parsedRule[1].trim(), parsedRule[2].trim(), query );
					}
				} );

				return;
			}

			if ( ! rules[ queryHash ][ selector ] ) {
				rules[ queryHash ][ selector ] = {};
			}

			if ( 'string' === typeof styleRules ) {
				styleRules = styleRules.split( ';' ).filter( String );

				var orderedRules = {};

				try {
					$.each( styleRules, function() {
						var property = this.split( /:(.*)?/ );

						orderedRules[ property[0].trim() ] = property[1].trim().replace( ';', '' );
					} );
				} catch ( error ) { // At least one of the properties is incorrect
					return;
				}

				styleRules = orderedRules;
			}

			$.extend( rules[ queryHash ][ selector ], styleRules );

			return self;
		};

		this.getRules = function() {
			return rules;
		};

		this.empty = function() {
			rules = {};
			rawCSS = {};
		};

		this.toString = function() {
			var styleText = '';

			$.each( rules, function( queryHash ) {
				var deviceText = Stylesheet.parseRules( this );

				if ( 'all' !== queryHash ) {
					deviceText = getQueryHashStyleFormat( queryHash ) + '{' + deviceText + '}';
				}

				styleText += deviceText;
			} );

			$.each( rawCSS, function() {
				styleText += this;
			} );

			return styleText;
		};
	};

	Stylesheet.parseRules = function( rules ) {
		var parsedRules = '';

		$.each( rules, function( selector ) {
			var selectorContent = Stylesheet.parseProperties( this );

			if ( selectorContent ) {
				parsedRules += selector + '{' + selectorContent + '}';
			}
		} );

		return parsedRules;
	};

	Stylesheet.parseProperties = function( properties ) {
		var parsedProperties = '';

		$.each( properties, function( propertyKey ) {
			if ( this ) {
				parsedProperties += propertyKey + ':' + this + ';';
			}
		} );

		return parsedProperties;
	};

	module.exports = Stylesheet;
} )( jQuery );

},{}],114:[function(require,module,exports){
var AddSectionView;

AddSectionView = Marionette.ItemView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-add-section' ),

	attributes: {
		'data-view': 'choose-action'
	},

	ui: {
		addNewSection: '.embroidery-add-new-section',
		closeButton: '.embroidery-add-section-close',
		addSectionButton: '.embroidery-add-section-button',
		addTemplateButton: '.embroidery-add-template-button',
		selectPreset: '.embroidery-select-preset',
		presets: '.embroidery-preset'
	},

	events: {
		'click @ui.addSectionButton': 'onAddSectionButtonClick',
		'click @ui.addTemplateButton': 'onAddTemplateButtonClick',
		'click @ui.closeButton': 'onCloseButtonClick',
		'click @ui.presets': 'onPresetSelected'
	},

	className: function() {
		return 'embroidery-add-section embroidery-visible-desktop';
	},

	addSection: function( properties, options ) {
		return embroidery.sections.currentView.addSection( properties, options );
	},

	setView: function( view ) {
		this.$el.attr( 'data-view', view );
	},

	showSelectPresets: function() {
		this.setView( 'select-preset' );
	},

	closeSelectPresets: function() {
		this.setView( 'choose-action' );
	},

	getTemplatesModalOptions: function() {
		return {
			onReady: function() {
				embroidery.templates.showTemplates();
			}
		};
	},

	onAddSectionButtonClick: function() {
		this.showSelectPresets();
	},

	onAddTemplateButtonClick: function() {
		embroidery.templates.startModal( this.getTemplatesModalOptions() );
	},

	onRender: function() {
		this.$el.html5Droppable( {
			axis: [ 'vertical' ],
			groups: [ 'embroidery-element' ],
			placeholder: false,
			currentElementClass: 'embroidery-html5dnd-current-element',
			hasDraggingOnChildClass: 'embroidery-dragging-on-child',
			onDropping: this.onDropping.bind( this )
		} );
	},

	onPresetSelected: function( event ) {
		this.closeSelectPresets();

		var selectedStructure = event.currentTarget.dataset.structure,
			parsedStructure = embroidery.presetsFactory.getParsedStructure( selectedStructure ),
			elements = [],
			loopIndex;

		for ( loopIndex = 0; loopIndex < parsedStructure.columnsCount; loopIndex++ ) {
			elements.push( {
				id: embroidery.helpers.getUniqueID(),
				elType: 'column',
				settings: {},
				elements: []
			} );
		}

		embroidery.channels.data.trigger( 'element:before:add', {
			elType: 'section'
		} );

		var newSection = this.addSection( { elements: elements } );

		newSection.setStructure( selectedStructure );

		embroidery.channels.data.trigger( 'element:after:add' );
	},

	onDropping: function() {
		embroidery.channels.data.trigger( 'section:before:drop' );
		this.addSection().addElementFromPanel();
		embroidery.channels.data.trigger( 'section:after:drop' );
	}
} );

module.exports = AddSectionView;

},{}],115:[function(require,module,exports){
var BaseAddSectionView = require( 'embroidery-views/add-section/base' );

module.exports = BaseAddSectionView.extend( {
	id: 'embroidery-add-new-section',

	onCloseButtonClick: function() {
		this.closeSelectPresets();
	}
} );

},{"embroidery-views/add-section/base":114}],116:[function(require,module,exports){
var BaseAddSectionView = require( 'embroidery-views/add-section/base' );

module.exports = BaseAddSectionView.extend( {
	options: {
		atIndex: null
	},

	className: function() {
		return BaseAddSectionView.prototype.className.apply( this, arguments ) + ' embroidery-add-section-inline';
	},

	addSection: function( properties, options ) {
		options = options || {};

		options.at = this.getOption( 'atIndex' );

		return BaseAddSectionView.prototype.addSection.call( this, properties, options );
	},

	getTemplatesModalOptions: function() {
		return _.extend( BaseAddSectionView.prototype.getTemplatesModalOptions.apply( this, arguments ), {
			importOptions: {
				at: this.getOption( 'atIndex' )
			}
		} );
	},

	fadeToDeath: function() {
		var self = this;

		self.$el.slideUp( function() {
			self.destroy();
		} );
	},

	onCloseButtonClick: function() {
		this.fadeToDeath();
	},

	onPresetSelected: function() {
		BaseAddSectionView.prototype.onPresetSelected.apply( this, arguments );

		this.destroy();
	},

	onAddTemplateButtonClick: function() {
		BaseAddSectionView.prototype.onAddTemplateButtonClick.apply( this, arguments );

		this.destroy();
	},

	onDropping: function() {
		BaseAddSectionView.prototype.onDropping.apply( this, arguments );

		this.destroy();
	}
} );

},{"embroidery-views/add-section/base":114}],117:[function(require,module,exports){
module.exports = Marionette.CompositeView.extend( {

	templateHelpers: function() {
		return {
			view: this
		};
	},

	getBehavior: function( name ) {
		return this._behaviors[ Object.keys( this.behaviors() ).indexOf( name ) ];
	},

	addChildModel: function( model, options ) {
		return this.collection.add( model, options, true );
	},

	addChildElement: function( itemData, options ) {
		options = options || {};

		var myChildType = this.getChildType(),
			elType = itemData.get ? itemData.get( 'elType' ) : itemData.elType;

		if ( -1 === myChildType.indexOf( elType ) ) {
			delete options.at;

			return this.children.last().addChildElement( itemData, options );
		}

		var newModel = this.addChildModel( itemData, options ),
			newView = this.children.findByModel( newModel );

		newView.edit();

		return newView;
	}
} );

},{}],118:[function(require,module,exports){
var SectionView = require( 'embroidery-elements/views/section' ),
	BaseContainer = require( 'embroidery-views/base-container' ),
	BaseSectionsContainerView;

BaseSectionsContainerView = BaseContainer.extend( {
	childView: SectionView,

	behaviors: function() {
		var behaviors = {
			Sortable: {
				behaviorClass: require( 'embroidery-behaviors/sortable' ),
				elChildType: 'section'
			},
			HandleDuplicate: {
				behaviorClass: require( 'embroidery-behaviors/handle-duplicate' )
			},
			HandleAddMode: {
				behaviorClass: require( 'embroidery-behaviors/duplicate' )
			}
		};

		return embroidery.hooks.applyFilters( 'elements/base-section-container/behaviors', behaviors, this );
	},

	getSortableOptions: function() {
		return {
			handle: '> .embroidery-element-overlay .embroidery-editor-section-settings .embroidery-editor-element-trigger',
			items: '> .embroidery-section'
		};
	},

	getChildType: function() {
		return [ 'section' ];
	},

	isCollectionFilled: function() {
		return false;
	},

	initialize: function() {
		this
			.listenTo( this.collection, 'add remove reset', this.onCollectionChanged )
			.listenTo( embroidery.channels.panelElements, 'element:drag:start', this.onPanelElementDragStart )
			.listenTo( embroidery.channels.panelElements, 'element:drag:end', this.onPanelElementDragEnd );
	},

	addSection: function( properties, options ) {
		var newSection = {
			id: embroidery.helpers.getUniqueID(),
			elType: 'section',
			settings: {},
			elements: []
		};

		if ( properties ) {
			_.extend( newSection, properties );
		}

		var newModel = this.addChildModel( newSection, options );

		return this.children.findByModelCid( newModel.cid );
	},

	onCollectionChanged: function() {
		embroidery.saver.setFlagEditorChange( true );
	},

	onPanelElementDragStart: function() {
		embroidery.helpers.disableElementEvents( this.$el.find( 'iframe' ) );
	},

	onPanelElementDragEnd: function() {
		embroidery.helpers.enableElementEvents( this.$el.find( 'iframe' ) );
	}
} );

module.exports = BaseSectionsContainerView;

},{"embroidery-behaviors/duplicate":65,"embroidery-behaviors/handle-duplicate":66,"embroidery-behaviors/sortable":70,"embroidery-elements/views/section":73,"embroidery-views/base-container":117}],119:[function(require,module,exports){
var ControlsStack;

ControlsStack = Marionette.CompositeView.extend( {
	className: 'embroidery-panel-controls-stack',

	classes: {
		popover: 'embroidery-controls-popover'
	},

	activeTab: null,

	activeSection: null,

	templateHelpers: function() {
		return {
			elementData: embroidery.getElementData( this.model )
		};
	},

	ui: function() {
		return {
			tabs: '.embroidery-panel-navigation-tab',
			reloadButton: '.embroidery-update-preview-button'
		};
	},

	events: function() {
		return {
			'click @ui.tabs': 'onClickTabControl',
			'click @ui.reloadButton': 'onReloadButtonClick'
		};
	},

	modelEvents: {
		'destroy': 'onModelDestroy'
	},

	behaviors: {
		HandleInnerTabs: {
			behaviorClass: require( 'embroidery-behaviors/inner-tabs' )
		}
	},

	initialize: function() {
		this.listenTo( embroidery.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	filter: function( controlModel ) {
		if ( controlModel.get( 'tab' ) !== this.activeTab ) {
			return false;
		}

		if ( 'section' === controlModel.get( 'type' ) ) {
			return true;
		}

		var section = controlModel.get( 'section' );

		return ! section || section === this.activeSection;
	},

	isVisibleSectionControl: function( sectionControlModel ) {
		return this.activeTab === sectionControlModel.get( 'tab' );
	},

	activateTab: function( $tab ) {
		var self = this,
			activeTab = this.activeTab = $tab.data( 'tab' );

		this.ui.tabs.removeClass( 'active' );

		$tab.addClass( 'active' );

		var sectionControls = this.collection.filter( function( controlModel ) {
			return 'section' === controlModel.get( 'type' ) && self.isVisibleSectionControl( controlModel );
		} );

		if ( sectionControls[0] ) {
			this.activateSection( sectionControls[0].get( 'name' ) );
		}
	},

	activateSection: function( sectionName ) {
		this.activeSection = sectionName;
	},

	getChildView: function( item ) {
		var controlType = item.get( 'type' );

		return embroidery.getControlView( controlType );
	},

	handlePopovers: function() {
		var self = this,
			popoverStarted = false,
			$popover;

		self.removePopovers();

		self.children.each( function( child ) {
			if ( popoverStarted ) {
				$popover.append( child.$el );
			}

			var popover = child.model.get( 'popover' );

			if ( ! popover ) {
				return;
			}

			if ( popover.start ) {
				popoverStarted = true;

				$popover = jQuery( '<div>', { 'class': self.classes.popover } );

				child.$el.before( $popover );

				$popover.append( child.$el );
			}

			if ( popover.end ) {
				popoverStarted = false;
			}
		} );
	},

	removePopovers: function() {
		this.$el.find( '.' + this.classes.popover ).remove();
	},

	openActiveSection: function() {
		var activeSection = this.activeSection,
			activeSectionView = this.children.filter( function( view ) {
				return activeSection === view.model.get( 'name' );
			} );

		if ( activeSectionView[0] ) {
			activeSectionView[0].ui.heading.addClass( 'embroidery-open' );
		}
	},

	onRenderCollection: function() {
		this.openActiveSection();

		this.handlePopovers();
	},

	onRenderTemplate: function() {
		this.activateTab( this.ui.tabs.eq( 0 ) );
	},

	onModelDestroy: function() {
		this.destroy();
	},

	onClickTabControl: function( event ) {
		event.preventDefault();

		var $tab = this.$( event.currentTarget );

		if ( this.activeTab === $tab.data( 'tab' ) ) {
			return;
		}

		this.activateTab( $tab );

		this._renderChildren();
	},

	onReloadButtonClick: function() {
		embroidery.reloadPreview();
	},

	onDeviceModeChange: function() {
		this.$el.removeClass( 'embroidery-responsive-switchers-open' );
	},

	onChildviewControlSectionClicked: function( childView ) {
		var isSectionOpen = childView.ui.heading.hasClass( 'embroidery-open' );

		this.activateSection( isSectionOpen ? null : childView.model.get( 'name' ) );

		this._renderChildren();
	},

	onChildviewResponsiveSwitcherClick: function( childView, device ) {
		if ( 'desktop' === device ) {
			this.$el.toggleClass( 'embroidery-responsive-switchers-open' );
		}
	}
} );

module.exports = ControlsStack;

},{"embroidery-behaviors/inner-tabs":68}],120:[function(require,module,exports){
var BaseSectionsContainerView = require( 'embroidery-views/base-sections-container' ),
	AddSectionView = require( 'embroidery-views/add-section/independent' ),
	Preview;

Preview = BaseSectionsContainerView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-preview' ),

	className: 'embroidery-inner',

	childViewContainer: '.embroidery-section-wrap',

	onRender: function() {
		var addNewSectionView = new AddSectionView();

		addNewSectionView.render();

		this.$el.append( addNewSectionView.$el );
	}
} );

module.exports = Preview;

},{"embroidery-views/add-section/independent":115,"embroidery-views/base-sections-container":118}],121:[function(require,module,exports){
'use strict';

/**
 * Handles managing all events for whatever you plug it into. Priorities for hooks are based on lowest to highest in
 * that, lowest priority hooks are fired first.
 */
var EventManager = function() {
	var slice = Array.prototype.slice,
		MethodsAvailable;

	/**
	 * Contains the hooks that get registered with this EventManager. The array for storage utilizes a "flat"
	 * object literal such that looking up the hook utilizes the native object literal hash.
	 */
	var STORAGE = {
		actions: {},
		filters: {}
	};

	/**
	 * Removes the specified hook by resetting the value of it.
	 *
	 * @param type Type of hook, either 'actions' or 'filters'
	 * @param hook The hook (namespace.identifier) to remove
	 *
	 * @private
	 */
	function _removeHook( type, hook, callback, context ) {
		var handlers, handler, i;

		if ( ! STORAGE[ type ][ hook ] ) {
			return;
		}
		if ( ! callback ) {
			STORAGE[ type ][ hook ] = [];
		} else {
			handlers = STORAGE[ type ][ hook ];
			if ( ! context ) {
				for ( i = handlers.length; i--; ) {
					if ( handlers[ i ].callback === callback ) {
						handlers.splice( i, 1 );
					}
				}
			} else {
				for ( i = handlers.length; i--; ) {
					handler = handlers[ i ];
					if ( handler.callback === callback && handler.context === context ) {
						handlers.splice( i, 1 );
					}
				}
			}
		}
	}

	/**
	 * Use an insert sort for keeping our hooks organized based on priority. This function is ridiculously faster
	 * than bubble sort, etc: http://jsperf.com/javascript-sort
	 *
	 * @param hooks The custom array containing all of the appropriate hooks to perform an insert sort on.
	 * @private
	 */
	function _hookInsertSort( hooks ) {
		var tmpHook, j, prevHook;
		for ( var i = 1, len = hooks.length; i < len; i++ ) {
			tmpHook = hooks[ i ];
			j = i;
			while ( ( prevHook = hooks[ j - 1 ] ) && prevHook.priority > tmpHook.priority ) {
				hooks[ j ] = hooks[ j - 1 ];
				--j;
			}
			hooks[ j ] = tmpHook;
		}

		return hooks;
	}

	/**
	 * Adds the hook to the appropriate storage container
	 *
	 * @param type 'actions' or 'filters'
	 * @param hook The hook (namespace.identifier) to add to our event manager
	 * @param callback The function that will be called when the hook is executed.
	 * @param priority The priority of this hook. Must be an integer.
	 * @param [context] A value to be used for this
	 * @private
	 */
	function _addHook( type, hook, callback, priority, context ) {
		var hookObject = {
			callback: callback,
			priority: priority,
			context: context
		};

		// Utilize 'prop itself' : http://jsperf.com/hasownproperty-vs-in-vs-undefined/19
		var hooks = STORAGE[ type ][ hook ];
		if ( hooks ) {
			// TEMP FIX BUG
			var hasSameCallback = false;
			jQuery.each( hooks, function() {
				if ( this.callback === callback ) {
					hasSameCallback = true;
					return false;
				}
			} );

			if ( hasSameCallback ) {
				return;
			}
			// END TEMP FIX BUG

			hooks.push( hookObject );
			hooks = _hookInsertSort( hooks );
		} else {
			hooks = [ hookObject ];
		}

		STORAGE[ type ][ hook ] = hooks;
	}

	/**
	 * Runs the specified hook. If it is an action, the value is not modified but if it is a filter, it is.
	 *
	 * @param type 'actions' or 'filters'
	 * @param hook The hook ( namespace.identifier ) to be ran.
	 * @param args Arguments to pass to the action/filter. If it's a filter, args is actually a single parameter.
	 * @private
	 */
	function _runHook( type, hook, args ) {
		var handlers = STORAGE[ type ][ hook ], i, len;

		if ( ! handlers ) {
			return ( 'filters' === type ) ? args[ 0 ] : false;
		}

		len = handlers.length;
		if ( 'filters' === type ) {
			for ( i = 0; i < len; i++ ) {
				args[ 0 ] = handlers[ i ].callback.apply( handlers[ i ].context, args );
			}
		} else {
			for ( i = 0; i < len; i++ ) {
				handlers[ i ].callback.apply( handlers[ i ].context, args );
			}
		}

		return ( 'filters' === type ) ? args[ 0 ] : true;
	}

	/**
	 * Adds an action to the event manager.
	 *
	 * @param action Must contain namespace.identifier
	 * @param callback Must be a valid callback function before this action is added
	 * @param [priority=10] Used to control when the function is executed in relation to other callbacks bound to the same hook
	 * @param [context] Supply a value to be used for this
	 */
	function addAction( action, callback, priority, context ) {
		if ( 'string' === typeof action && 'function' === typeof callback ) {
			priority = parseInt( ( priority || 10 ), 10 );
			_addHook( 'actions', action, callback, priority, context );
		}

		return MethodsAvailable;
	}

	/**
	 * Performs an action if it exists. You can pass as many arguments as you want to this function; the only rule is
	 * that the first argument must always be the action.
	 */
	function doAction( /* action, arg1, arg2, ... */ ) {
		var args = slice.call( arguments );
		var action = args.shift();

		if ( 'string' === typeof action ) {
			_runHook( 'actions', action, args );
		}

		return MethodsAvailable;
	}

	/**
	 * Removes the specified action if it contains a namespace.identifier & exists.
	 *
	 * @param action The action to remove
	 * @param [callback] Callback function to remove
	 */
	function removeAction( action, callback ) {
		if ( 'string' === typeof action ) {
			_removeHook( 'actions', action, callback );
		}

		return MethodsAvailable;
	}

	/**
	 * Adds a filter to the event manager.
	 *
	 * @param filter Must contain namespace.identifier
	 * @param callback Must be a valid callback function before this action is added
	 * @param [priority=10] Used to control when the function is executed in relation to other callbacks bound to the same hook
	 * @param [context] Supply a value to be used for this
	 */
	function addFilter( filter, callback, priority, context ) {
		if ( 'string' === typeof filter && 'function' === typeof callback ) {
			priority = parseInt( ( priority || 10 ), 10 );
			_addHook( 'filters', filter, callback, priority, context );
		}

		return MethodsAvailable;
	}

	/**
	 * Performs a filter if it exists. You should only ever pass 1 argument to be filtered. The only rule is that
	 * the first argument must always be the filter.
	 */
	function applyFilters( /* filter, filtered arg, arg2, ... */ ) {
		var args = slice.call( arguments );
		var filter = args.shift();

		if ( 'string' === typeof filter ) {
			return _runHook( 'filters', filter, args );
		}

		return MethodsAvailable;
	}

	/**
	 * Removes the specified filter if it contains a namespace.identifier & exists.
	 *
	 * @param filter The action to remove
	 * @param [callback] Callback function to remove
	 */
	function removeFilter( filter, callback ) {
		if ( 'string' === typeof filter ) {
			_removeHook( 'filters', filter, callback );
		}

		return MethodsAvailable;
	}

	/**
	 * Maintain a reference to the object scope so our public methods never get confusing.
	 */
	MethodsAvailable = {
		removeFilter: removeFilter,
		applyFilters: applyFilters,
		addFilter: addFilter,
		removeAction: removeAction,
		doAction: doAction,
		addAction: addAction
	};

	// return all of the publicly available methods
	return MethodsAvailable;
};

module.exports = EventManager;

},{}],122:[function(require,module,exports){
var HotKeys = function() {
	var hotKeysHandlers = this.hotKeysHandlers = {};

	var isMac = function() {
		return -1 !== navigator.userAgent.indexOf( 'Mac OS X' );
	};

	var applyHotKey = function( event ) {
		var handlers = hotKeysHandlers[ event.which ];

		if ( ! handlers ) {
			return;
		}

		jQuery.each( handlers, function() {
			var handler = this;

			if ( handler.isWorthHandling && ! handler.isWorthHandling( event ) ) {
				return;
			}

			// Fix for some keyboard sources that consider alt key as ctrl key
			if ( ! handler.allowAltKey && event.altKey ) {
				return;
			}

			event.preventDefault();

			handler.handle( event );
		} );
	};

	this.isControlEvent = function( event ) {
		return event[ isMac() ? 'metaKey' : 'ctrlKey' ];
	};

	this.addHotKeyHandler = function( keyCode, handlerName, handler ) {
		if ( ! hotKeysHandlers[ keyCode ] ) {
			hotKeysHandlers[ keyCode ] = {};
		}

		hotKeysHandlers[ keyCode ][ handlerName ] = handler;
	};

	this.bindListener = function( $listener ) {
		$listener.on( 'keydown', applyHotKey );
	};
};

module.exports = new HotKeys();

},{}],123:[function(require,module,exports){
var Module = function() {
	var $ = jQuery,
		instanceParams = arguments,
		self = this,
		settings,
		events = {};

	var ensureClosureMethods = function() {
		$.each( self, function( methodName ) {
			var oldMethod = self[ methodName ];

			if ( 'function' !== typeof oldMethod ) {
				return;
			}

			self[ methodName ] = function() {
				return oldMethod.apply( self, arguments );
			};
		});
	};

	var initSettings = function() {
		settings = self.getDefaultSettings();

		var instanceSettings = instanceParams[0];

		if ( instanceSettings ) {
			$.extend( settings, instanceSettings );
		}
	};

	var init = function() {
		self.__construct.apply( self, instanceParams );

		ensureClosureMethods();

		initSettings();

		self.trigger( 'init' );
	};

	this.getItems = function( items, itemKey ) {
		if ( itemKey ) {
			var keyStack = itemKey.split( '.' ),
				currentKey = keyStack.splice( 0, 1 );

			if ( ! keyStack.length ) {
				return items[ currentKey ];
			}

			if ( ! items[ currentKey ] ) {
				return;
			}

			return this.getItems(  items[ currentKey ], keyStack.join( '.' ) );
		}

		return items;
	};

	this.getSettings = function( setting ) {
		return this.getItems( settings, setting );
	};

	this.setSettings = function( settingKey, value, settingsContainer ) {
		if ( ! settingsContainer ) {
			settingsContainer = settings;
		}

		if ( 'object' === typeof settingKey ) {
			$.extend( settingsContainer, settingKey );

			return self;
		}

		var keyStack = settingKey.split( '.' ),
			currentKey = keyStack.splice( 0, 1 );

		if ( ! keyStack.length ) {
			settingsContainer[ currentKey ] = value;

			return self;
		}

		if ( ! settingsContainer[ currentKey ] ) {
			settingsContainer[ currentKey ] = {};
		}

		return self.setSettings( keyStack.join( '.' ), value, settingsContainer[ currentKey ] );
	};

	this.forceMethodImplementation = function( methodArguments ) {
		var functionName = methodArguments.callee.name;

		throw new ReferenceError( 'The method ' + functionName + ' must to be implemented in the inheritor child.' );
	};

	this.on = function( eventName, callback ) {
		if ( ! events[ eventName ] ) {
			events[ eventName ] = [];
		}

		events[ eventName ].push( callback );

		return self;
	};

	this.off = function( eventName, callback ) {
		if ( ! events[ eventName ] ) {
			return self;
		}

		if ( ! callback ) {
			delete events[ eventName ];

			return self;
		}

		var callbackIndex = events[ eventName ].indexOf( callback );

		if ( -1 !== callbackIndex ) {
			delete events[ eventName ][ callbackIndex ];
		}

		return self;
	};

	this.trigger = function( eventName ) {
		var methodName = 'on' + eventName[ 0 ].toUpperCase() + eventName.slice( 1 ),
			params = Array.prototype.slice.call( arguments, 1 );

		if ( self[ methodName ] ) {
			self[ methodName ].apply( self, params );
		}

		var callbacks = events[ eventName ];

		if ( ! callbacks ) {
			return self;
		}

		$.each( callbacks, function( index, callback ) {
			callback.apply( self, params );
		} );

		return self;
	};

	init();
};

Module.prototype.__construct = function() {};

Module.prototype.getDefaultSettings = function() {
	return {};
};

Module.extendsCount = 0;

Module.extend = function( properties ) {
	var $ = jQuery,
		parent = this;

	var child = function() {
		return parent.apply( this, arguments );
	};

	$.extend( child, parent );

	child.prototype = Object.create( $.extend( {}, parent.prototype, properties ) );

	child.prototype.constructor = child;

	/*
	 * Constructor ID is used to set an unique ID
     * to every extend of the Module.
     *
	 * It's useful in some cases such as unique
	 * listener for frontend handlers.
	 */
	var constructorID = ++Module.extendsCount;

	child.prototype.getConstructorID = function() {
		return constructorID;
	};

	child.__super__ = parent.prototype;

	return child;
};

module.exports = Module;

},{}],124:[function(require,module,exports){
var Module = require( './module' ),
	ViewModule;

ViewModule = Module.extend( {
	elements: null,

	getDefaultElements: function() {
		return {};
	},

	bindEvents: function() {},

	onInit: function() {
		this.initElements();

		this.bindEvents();
	},

	initElements: function() {
		this.elements = this.getDefaultElements();
	}
} );

module.exports = ViewModule;

},{"./module":123}],125:[function(require,module,exports){
module.exports = Marionette.Behavior.extend( {
	listenerAttached: false,

	// use beforeRender that runs after the collection is exist
	onBeforeRender: function() {
		if ( this.view.collection && ! this.listenerAttached ) {
			this.view.collection.on( 'update', this.saveCollectionHistory, this );
			this.listenerAttached = true;
		}
	},

	saveCollectionHistory: function( collection, event ) {
		if ( ! embroidery.history.history.getActive() ) {
			return;
		}

		var historyItem,
			models,
			firstModel,
			type;

		if ( event.add ) {
			models = event.changes.added;
			firstModel = models[0];
			type = 'add';
		} else {
			models = event.changes.removed;
			firstModel = models[0];
			type = 'remove';
		}

		var title = embroidery.history.history.getModelLabel( firstModel );

		// If it's an unknown model - don't save
		if ( ! title ) {
			return;
		}

		var modelsJSON = [];

		_.each( models, function( model ) {
			modelsJSON.push( model.toJSON( { copyHtmlCache: true } ) );
		} );

		historyItem = {
			type: type,
			elementType: firstModel.get( 'elType' ),
			elementID: firstModel.get( 'id' ),
			title: title,
			history: {
				behavior: this,
				collection: collection,
				event: event,
				models: modelsJSON
			}
		};

		embroidery.history.history.addItem( historyItem );
	},

	add: function( models, toView, position ) {
		if ( 'section' === models[0].elType ) {
			_.each( models, function( model ) {
				model.dontFillEmpty = true;
			} );
		}

		toView.addChildModel( models, { at: position, silent: 0 } );
	},

	remove: function( models, fromCollection ) {
		fromCollection.remove( models, { silent: 0 } );
	},

	restore: function( historyItem, isRedo ) {
		var	type = historyItem.get( 'type' ),
			history = historyItem.get( 'history' ),
			didAction = false,
			behavior;

		// Find the new behavior and work with him
		if ( history.behavior.view.model ) {
			var modelID = history.behavior.view.model.get( 'id' ),
				view = embroidery.history.history.findView( modelID );
			if ( view ) {
				behavior = view.getBehavior( 'CollectionHistory' );
			}
		}

		// Container or new Elements - Doesn't have a new behavior
		if ( ! behavior ) {
			behavior = history.behavior;
		}

		// Stop listen to undo actions
		behavior.view.collection.off( 'update', behavior.saveCollectionHistory );

		switch ( type ) {
			case 'add':
				if ( isRedo ) {
					this.add( history.models, behavior.view, history.event.index );
				} else {
					this.remove( history.models, behavior.view.collection );
				}

				didAction = true;
				break;
			case 'remove':
				if ( isRedo ) {
					this.remove( history.models, behavior.view.collection );
				} else {
					this.add( history.models, behavior.view, history.event.index );
				}

				didAction = true;
				break;
		}

		// Listen again
		behavior.view.collection.on( 'update', behavior.saveCollectionHistory, history.behavior );

		return didAction;
	}
} );


},{}],126:[function(require,module,exports){
var ItemModel = require( './item' );

module.exports = Backbone.Collection.extend( {
	model: ItemModel
} );

},{"./item":129}],127:[function(require,module,exports){
module.exports = Marionette.Behavior.extend( {
	oldValues: [],

	listenerAttached: false,

	initialize: function() {
		this.lazySaveTextHistory = _.debounce( this.saveTextHistory.bind( this ), 800 );
	},

	// use beforeRender that runs after the settingsModel is exist
	onBeforeRender: function() {
		if ( ! this.listenerAttached ) {
			this.listenTo( this.view.getEditModel().get( 'settings' ), 'change', this.saveHistory );
			this.listenerAttached = true;
		}
	},

	saveTextHistory: function( model, changed, control ) {
		var changedAttributes = {},
			currentValue = model.get( control.name ),
			newValue;

		if ( currentValue instanceof Backbone.Collection ) {
			// Deep clone.
			newValue = currentValue.toJSON();
		} else {
			newValue = currentValue;
		}

		changedAttributes[ control.name ] = {
			old: this.oldValues[ control.name ],
			'new': newValue
		};

		var historyItem = {
			type: 'change',
			elementType: 'control',
			title: embroidery.history.history.getModelLabel( model ),
			subTitle: model.controls[ changed[0] ].label,
			history: {
				behavior: this,
				changed: changedAttributes,
				model: this.view.getEditModel().toJSON()
			}
		};

		embroidery.history.history.addItem( historyItem );

		delete this.oldValues[ control.name ];
	},

	saveHistory: function( model ) {
		if ( ! embroidery.history.history.getActive() ) {
			return;
		}

		var self = this,
			changed = Object.keys( model.changed );

		if ( ! changed.length || ! model.controls[ changed[0] ] ) {
			return;
		}

		if ( 1 === changed.length ) {
			var control = model.controls[ changed[0] ];

			if ( _.isUndefined( self.oldValues[ control.name ] ) ) {
				self.oldValues[ control.name ] = model.previous( control.name );
			}

			if ( embroidery.history.history.isItemStarted() ) {
				// Do not delay the execution
				self.saveTextHistory( model, changed, control );
			} else {
				self.lazySaveTextHistory( model, changed, control );
			}

			return;
		}

		var changedAttributes = {};

		_.each( changed, function( controlName ) {
			changedAttributes[ controlName ] = {
				old: model.previous( controlName ),
				'new': model.get( controlName )
			};
		} );

		var historyItem = {
			type: 'change',
			elementType: 'control',
			title: embroidery.history.history.getModelLabel( model ),
			history: {
				behavior: this,
				changed: changedAttributes,
				model: this.view.getEditModel().toJSON()
			}
		};

		if ( 1 === changed.length ) {
			historyItem.subTitle = model.controls[ changed[0] ].label;
		}

		embroidery.history.history.addItem( historyItem );
	},

	restore: function( historyItem, isRedo ) {
		var	history = historyItem.get( 'history' ),
			modelID = history.model.id,
			view = embroidery.history.history.findView( modelID );

		if ( ! view ) {
			return;
		}

		var model = view.getEditModel ? view.getEditModel() : view.model,
			settings = model.get( 'settings' ),
			behavior = view.getBehavior( 'ElementHistory' );

		// Stop listen to restore actions
		behavior.stopListening( settings, 'change', this.saveHistory );

		var restoredValues = {};
		_.each( history.changed, function( values, key ) {
			if ( isRedo ) {
				restoredValues[ key ] = values['new'];
			} else {
				restoredValues[ key ] = values.old;
			}
		} );

		// Set at once.
		settings.set( restoredValues );

		// Trigger each field for `baseControl.onSettingsExternalChange`
		_.each( history.changed, function( values, key ) {
			settings.trigger( 'change:external:' + key );
		} );

		historyItem.set( 'status', isRedo ? 'not_applied' : 'applied' );

		// Listen again
		behavior.listenTo( settings, 'change', this.saveHistory );
	}
} );

},{}],128:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-history-no-items',
	id: 'embroidery-panel-history-no-items',
	className: 'embroidery-panel-nerd-box'
} );

},{}],129:[function(require,module,exports){
module.exports = Backbone.Model.extend( {
	defaults: {
		id: 0,
		type: '',
		elementType: '',
		status: 'not_applied',
		title: '',
		subTitle: '',
		action: '',
		history: {}
	},

	initialize: function() {
		this.set( 'items', new Backbone.Collection() );
	}
} );

},{}],130:[function(require,module,exports){
var HistoryCollection = require( './collection' ),
	HistoryItem = require( './item' ),
	ElementHistoryBehavior = require( './element-behavior' ),
	CollectionHistoryBehavior = require( './collection-behavior' );

var	Manager = function() {
	var self = this,
		currentItemID = null,
		items = new HistoryCollection(),
		editorSaved = false,
		active = true;

	var translations = {
		add: embroidery.translate( 'added' ),
		remove: embroidery.translate( 'removed' ),
		change: embroidery.translate( 'edited' ),
		move: embroidery.translate( 'moved' ),
		duplicate: embroidery.translate( 'duplicated' )
	};

	var addBehaviors = function( behaviors ) {
		behaviors.ElementHistory = {
			behaviorClass: ElementHistoryBehavior
		};

		behaviors.CollectionHistory = {
			behaviorClass: CollectionHistoryBehavior
		};

		return behaviors;
	};

	var addCollectionBehavior = function( behaviors ) {
		behaviors.CollectionHistory = {
			behaviorClass: CollectionHistoryBehavior
		};

		return behaviors;
	};

	var getActionLabel = function( itemData ) {
		if ( translations[ itemData.type ] ) {
			return translations[ itemData.type ];
		}

		return itemData.type;
	};

	var navigate = function( isRedo ) {
		var currentItem = items.find( function( model ) {
				return 'not_applied' ===  model.get( 'status' );
			} ),
			currentItemIndex = items.indexOf( currentItem ),
			requiredIndex = isRedo ? currentItemIndex - 1 : currentItemIndex + 1;

		if ( ( ! isRedo && ! currentItem ) || requiredIndex < 0  || requiredIndex >= items.length ) {
			return;
		}

		self.doItem( requiredIndex );
	};

	var addHotKeys = function() {
		var H_KEY = 72,
			Z_KEY = 90;

		embroidery.hotKeys.addHotKeyHandler( Z_KEY, 'historyNavigation', {
			isWorthHandling: function( event ) {
				return items.length && ! jQuery( event.target ).is( 'input, textarea, [contenteditable=true]' );
			},
			handle: function( event ) {
				navigate( Z_KEY === event.which && event.shiftKey );
			}
		} );

		embroidery.hotKeys.addHotKeyHandler( H_KEY, 'showHistoryPage', {
			isWorthHandling: function( event ) {
				return embroidery.hotKeys.isControlEvent( event ) && event.shiftKey;
			},
			handle: function() {
				embroidery.getPanelView().setPage( 'historyPage' );
			}
		} );
	};

	var onPanelSave = function() {
		if ( items.length >= 2 ) {
			// Check if it's a save after made changes, `items.length - 1` is the `Editing Started Item
			var firstEditItem = items.at( items.length - 2 );
			editorSaved = ( 'not_applied' === firstEditItem.get( 'status' ) );
		}
	};

	var init = function() {
		addHotKeys();

		embroidery.hooks.addFilter( 'elements/base/behaviors', addBehaviors );
		embroidery.hooks.addFilter( 'elements/base-section-container/behaviors', addCollectionBehavior );

		embroidery.channels.data
			.on( 'drag:before:update', self.startMovingItem )
			.on( 'drag:after:update', self.endItem )

			.on( 'element:before:add', self.startAddElement )
			.on( 'element:after:add', self.endItem )

			.on( 'element:before:remove', self.startRemoveElement )
			.on( 'element:after:remove', self.endItem )

			.on( 'element:before:duplicate', self.startDuplicateElement )
			.on( 'element:after:duplicate', self.endItem )

			.on( 'section:before:drop', self.startDropElement )
			.on( 'section:after:drop', self.endItem )

			.on( 'template:before:insert', self.startInsertTemplate )
			.on( 'template:after:insert', self.endItem );

		embroidery.channels.editor.on( 'saved', onPanelSave );
	};

	this.setActive = function( value ) {
		active = value;
	};

	this.getActive = function() {
		return active;
	};

	this.getItems = function() {
		return items;
	};

	this.startItem = function( itemData ) {
		currentItemID = this.addItem( itemData );
	};

	this.endItem = function() {
		currentItemID = null;
	};

	this.isItemStarted = function() {
		return null !== currentItemID;
	};

	this.addItem = function( itemData ) {
		if ( ! this.getActive() ) {
			return;
		}

		if ( ! items.length ) {
			items.add( {
				status: 'not_applied',
				title: embroidery.translate( 'editing_started' ),
				subTitle: '',
				action: '',
				editing_started: true
			} );
		}

		// Remove old applied items from top of list
		while ( items.length && 'applied' === items.first().get( 'status' ) ) {
			items.shift();
		}

		var id = currentItemID ? currentItemID : new Date().getTime();

		var	currentItem = items.findWhere( {
			id: id
		} );

		if ( ! currentItem ) {
			currentItem = new HistoryItem( {
				id: id,
				title: itemData.title,
				subTitle: itemData.subTitle,
				action: getActionLabel( itemData ),
				type: itemData.type,
				elementType: itemData.elementType
			} );

			self.startItemTitle = '';
			self.startItemAction = '';
		}

		var position = 0;

		// Temp fix. On move a column - insert the `remove` subItem before the section changes subItem.
		// In a multi columns section - the structure has been changed,
		// In a one column section - it's filled with an empty column,
		// The order is important for the `redoItem`, that needed to change the section first
		// and only after that - to remove the column.
		if ( 'column' === itemData.elementType && 'remove' === itemData.type && 'column' === currentItem.get( 'elementType' ) ) {
			position = 1;
		}

		currentItem.get( 'items' ).add( itemData, { at: position } );

		items.add( currentItem, { at: 0 } );

		var panel = embroidery.getPanelView();

		if ( 'historyPage' === panel.getCurrentPageName() ) {
			panel.getCurrentPageView().render();
		}

		return id;
	};

	this.doItem = function( index ) {
		// Don't track while restore the item
		this.setActive( false );

		var item = items.at( index );

		if ( 'not_applied' === item.get( 'status' ) ) {
			this.undoItem( index );
		} else {
			this.redoItem( index );
		}

		this.setActive( true );

		var panel = embroidery.getPanelView(),
			panelPage = panel.getCurrentPageView(),
			viewToScroll;

		if ( 'editor' === panel.getCurrentPageName() ) {
			if ( panelPage.getOption( 'editedElementView' ).isDestroyed ) {
				// If the the element isn't exist - show the history panel
				panel.setPage( 'historyPage' );
			} else {
				// If element exist - render again, maybe the settings has been changed
				viewToScroll = panelPage.getOption( 'editedElementView' );
			}
		} else {
			if ( 'historyPage' === panel.getCurrentPageName() ) {
				panelPage.render();
			}

			// Try scroll to affected element.
			if ( item instanceof Backbone.Model && item.get( 'items' ).length  ) {
				var oldView = item.get( 'items' ).first().get( 'history' ).behavior.view;
				if ( oldView.model ) {
					viewToScroll = self.findView( oldView.model.get( 'id' ) ) ;
				}
			}
		}

		if ( viewToScroll && ! embroidery.helpers.isInViewport( viewToScroll.$el[0], embroidery.$previewContents.find( 'html' )[0] ) ) {
			embroidery.helpers.scrollToView( viewToScroll );
		}

		if ( item.get( 'editing_started' ) ) {
			if ( ! editorSaved ) {
				embroidery.saver.setFlagEditorChange( false );
			}
		}
	};

	this.undoItem = function( index ) {
		var item;

		for ( var stepNum = 0; stepNum < index; stepNum++ ) {
			item = items.at( stepNum );

			if ( 'not_applied' === item.get( 'status' ) ) {
				item.get( 'items' ).each( function( subItem ) {
					var history = subItem.get( 'history' );

					if ( history ) { /* type duplicate first items hasn't history */
						history.behavior.restore( subItem );
					}
				} );

				item.set( 'status', 'applied' );
			}
		}
	};

	this.redoItem = function( index ) {
		for ( var stepNum = items.length - 1; stepNum >= index; stepNum-- ) {
			var item = items.at( stepNum );

			if ( 'applied' === item.get( 'status' ) ) {
				var reversedSubItems = _.toArray( item.get( 'items' ).models ).reverse();

				_( reversedSubItems ).each( function( subItem ) {
					var history = subItem.get( 'history' );

					if ( history ) { /* type duplicate first items hasn't history */
						history.behavior.restore( subItem, true );
					}
				} );

				item.set( 'status', 'not_applied' );
			}
		}
	};

	this.getModelLabel = function( model ) {
		if ( ! ( model instanceof Backbone.Model ) ) {
			model = new Backbone.Model( model );
		}

		return embroidery.getElementData( model ).title;
	};

	this.findView = function( modelID, views ) {
		var self = this,
			founded = false;

		if ( ! views ) {
			views = embroidery.sections.currentView.children;
		}

		_.each( views._views, function( view ) {
			if ( founded ) {
				return;
			}
			// Widget global used getEditModel
			var model = view.getEditModel ? view.getEditModel() : view.model;

			if ( modelID === model.get( 'id' ) ) {
				founded = view;
			} else if ( view.children && view.children.length ) {
				founded = self.findView( modelID, view.children );
			}
		} );

		return founded;
	};

	this.startMovingItem = function( model ) {
		embroidery.history.history.startItem( {
			type: 'move',
			title: self.getModelLabel( model ),
			elementType: model.get( 'elType' )
		} );
	};

	this.startInsertTemplate = function( model ) {
		embroidery.history.history.startItem( {
			type: 'add',
			title: embroidery.translate( 'template' ),
			subTitle: model.get( 'title' ),
			elementType: 'template'
		} );
	};

	this.startDropElement = function() {
		var elementView = embroidery.channels.panelElements.request( 'element:selected' );
		embroidery.history.history.startItem( {
			type: 'add',
			title: self.getModelLabel( elementView.model ),
			elementType: elementView.model.get( 'widgetType' ) || elementView.model.get( 'elType' )
		} );
	};

	this.startAddElement = function( model ) {
		embroidery.history.history.startItem( {
			type: 'add',
			title: self.getModelLabel( model ),
			elementType: model.elType
		} );
	};

	this.startDuplicateElement = function( model ) {
		embroidery.history.history.startItem( {
			type: 'duplicate',
			title: self.getModelLabel( model ),
			elementType: model.get( 'elType' )
		} );
	};

	this.startRemoveElement = function( model ) {
		embroidery.history.history.startItem( {
			type: 'remove',
			title: self.getModelLabel( model ),
			elementType: model.get( 'elType' )
		} );
	};

	init();
};

module.exports = new Manager();

},{"./collection":126,"./collection-behavior":125,"./element-behavior":127,"./item":129}],131:[function(require,module,exports){
module.exports = Marionette.CompositeView.extend( {
	id: 'embroidery-panel-history',

	template: '#tmpl-embroidery-panel-history-tab',

	childView: Marionette.ItemView.extend( {
		template: '#tmpl-embroidery-panel-history-item',
		ui: {
			item: '.embroidery-history-item'
		},
		triggers: {
			'click @ui.item': 'item:click'
		}
	} ),

	childViewContainer: '#embroidery-history-list',

	currentItem: null,

	onRender: function() {
		var self = this;

		_.defer( function() {
			// Set current item - the first not applied item
			if ( self.children.length ) {
				var currentItem = self.collection.find( function( model ) {
						return 'not_applied' ===  model.get( 'status' );
					} ),
					currentView = self.children.findByModel( currentItem );

				self.updateCurrentItem( currentView.$el );
			}
		} );
	},

	updateCurrentItem: function( element ) {
		var currentItemClass = 'embroidery-history-item-current';

		if ( this.currentItem ) {
			this.currentItem.removeClass( currentItemClass );
		}

		this.currentItem = element;

		this.currentItem.addClass( currentItemClass );
	},

	onChildviewItemClick: function( childView, event ) {
		if ( childView.$el === this.currentItem ) {
			return;
		}

		var collection = event.model.collection,
			itemIndex = collection.findIndex( event.model );

		embroidery.history.history.doItem( itemIndex );

		this.updateCurrentItem( childView.$el );

		if ( ! this.isDestroyed ) {
			this.render();
		}
	}
} );

},{}],132:[function(require,module,exports){
var HistoryPageView = require( './panel-page' ),
	Manager;

Manager = function() {
	var self = this;

	var addPanelPage = function() {
		embroidery.getPanelView().addPage( 'historyPage', {
			view: HistoryPageView,
			title: embroidery.translate( 'history' )
		} );
	};

	var init = function() {
		embroidery.on( 'preview:loaded', addPanelPage );

		self.history = require( './history/manager' );

		self.revisions = require( './revisions/manager' );

		self.revisions.init();
	};

	jQuery( window ).on( 'embroidery:init', init );
};

module.exports = new Manager();

},{"./history/manager":130,"./panel-page":133,"./revisions/manager":136}],133:[function(require,module,exports){
var TabHistoryView = require( './history/panel-tab' ),
	TabHistoryEmpty = require( './history/empty' ),
	TabRevisionsView = require( './revisions/panel-tab' ),
	TabRevisionsEmpty = require( './revisions/empty' );

module.exports = Marionette.LayoutView.extend( {
	template: '#tmpl-embroidery-panel-history-page',

	regions: {
		content: '#embroidery-panel-history-content'
	},

	ui: {
		tabs: '.embroidery-panel-navigation-tab'
	},

	events: {
		'click @ui.tabs': 'onTabClick'
	},

	regionViews: {},

	currentTab: null,

	initialize: function() {
		this.initRegionViews();
	},

	initRegionViews: function() {
		var historyItems = embroidery.history.history.getItems(),
			revisionsItems = embroidery.history.revisions.getItems();

		this.regionViews  = {
			history: {
				region: this.content,
				view: function() {
					if ( historyItems.length ) {
						return TabHistoryView;
					}

					return TabHistoryEmpty;
				},
				options: {
					collection: historyItems
				}
			},
			revisions: {
				region: this.content,
				view: function() {
					if ( revisionsItems.length ) {
						return TabRevisionsView;
					}

					return TabRevisionsEmpty;
				},

				options: {
					collection: revisionsItems
				}
			}
		};
	},

	activateTab: function( tabName ) {
		this.ui.tabs
			.removeClass( 'active' )
			.filter( '[data-view="' + tabName + '"]' )
			.addClass( 'active' );

		this.showView( tabName );
	},

	getCurrentTab: function() {
		return this.currentTab;
	},

	showView: function( viewName ) {
		var viewDetails = this.regionViews[ viewName ],
			options = viewDetails.options || {},
			View = viewDetails.view;

		if ( 'function' === typeof View ) {
			View = viewDetails.view();
		}

		options.viewName = viewName;
		this.currentTab = new View( options );

		viewDetails.region.show( this.currentTab );
	},

	onRender: function() {
		this.showView( 'history' );
	},

	onTabClick: function( event ) {
		this.activateTab( event.currentTarget.dataset.view );
	},

	onDestroy: function() {
		embroidery.getPanelView().getFooterView().ui.history.removeClass( 'embroidery-open' );
	}
} );

},{"./history/empty":128,"./history/panel-tab":131,"./revisions/empty":135,"./revisions/panel-tab":138}],134:[function(require,module,exports){
var RevisionModel = require( './model' );

module.exports = Backbone.Collection.extend( {
	model: RevisionModel,
	comparator: function( model ) {
		return -model.get( 'timestamp' );
	}
} );

},{"./model":137}],135:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-revisions-no-revisions',
	id: 'embroidery-panel-revisions-no-revisions',
	className: 'embroidery-panel-nerd-box'
} );

},{}],136:[function(require,module,exports){
var RevisionsCollection = require( './collection' ),
	RevisionsManager;

RevisionsManager = function() {
	var self = this,
		revisions;

	this.getItems = function() {
		return revisions;
	};

	var onEditorSaved = function( data ) {
		if ( data.latest_revisions ) {
			self.addRevisions( data.latest_revisions );
		}

		if ( data.revisions_ids ) {
			var revisionsToKeep = revisions.filter( function( revision ) {
				return -1 !== data.revisions_ids.indexOf( revision.get( 'id' ) );
			} );

			revisions.reset( revisionsToKeep );
		}
	};

	var attachEvents = function() {
		embroidery.channels.editor.on( 'saved', onEditorSaved );
	};

	var addHotKeys = function() {
		var UP_ARROW_KEY = 38,
			DOWN_ARROW_KEY = 40;

		var navigationHandler = {
			isWorthHandling: function() {
				var panel = embroidery.getPanelView();

				if ( 'historyPage' !== panel.getCurrentPageName() ) {
					return false;
				}

				var revisionsTab = panel.getCurrentPageView().getCurrentTab();

				return revisionsTab.currentPreviewId && revisionsTab.currentPreviewItem && revisionsTab.children.length > 1;
			},
			handle: function( event ) {
				embroidery.getPanelView().getCurrentPageView().getCurrentTab().navigate( UP_ARROW_KEY === event.which );
			}
		};

		embroidery.hotKeys.addHotKeyHandler( UP_ARROW_KEY, 'revisionNavigation', navigationHandler );

		embroidery.hotKeys.addHotKeyHandler( DOWN_ARROW_KEY, 'revisionNavigation', navigationHandler );
	};

	this.setEditorData = function( data ) {
		var collection = embroidery.getRegion( 'sections' ).currentView.collection;

		collection.reset( data );
	};

	this.getRevisionDataAsync = function( id, options ) {
		_.extend( options, {
			data: {
				id: id
			}
		} );

		return embroidery.ajax.send( 'get_revision_data', options );
	};

	this.addRevisions = function( items ) {
		items.forEach( function( item ) {
			var existedModel = revisions.findWhere( {
				id: item.id
			} );

			if ( existedModel ) {
				revisions.remove( existedModel );
			}

			revisions.add( item );
		} );
	};

	this.deleteRevision = function( revisionModel, options ) {
		var params = {
			data: {
				id: revisionModel.get( 'id' )
			},
			success: function() {
				if ( options.success ) {
					options.success();
				}

				revisionModel.destroy();

				if ( ! revisions.length ) {
					var panel = embroidery.getPanelView();
					if ( 'historyPage' === panel.getCurrentPageName() ) {
						panel.getCurrentPageView().activateTab( 'revisions' );
					}
				}
			}
		};

		if ( options.error ) {
			params.error = options.error;
		}

		embroidery.ajax.send( 'delete_revision', params );
	};

	this.init = function() {
		revisions = new RevisionsCollection( embroidery.config.revisions );

		attachEvents();

		addHotKeys();
	};
};

module.exports = new RevisionsManager();

},{"./collection":134}],137:[function(require,module,exports){
var RevisionModel;

RevisionModel = Backbone.Model.extend();

RevisionModel.prototype.sync = function() {
	return null;
};

module.exports = RevisionModel;

},{}],138:[function(require,module,exports){
module.exports = Marionette.CompositeView.extend( {
	id: 'embroidery-panel-revisions',

	template: '#tmpl-embroidery-panel-revisions',

	childView: require( './view' ),

	childViewContainer: '#embroidery-revisions-list',

	ui: {
		discard: '.embroidery-panel-scheme-discard .embroidery-button',
		apply: '.embroidery-panel-scheme-save .embroidery-button'
	},

	events: {
		'click @ui.discard': 'onDiscardClick',
		'click @ui.apply': 'onApplyClick'
	},

	isRevisionApplied: false,

	jqueryXhr: null,

	currentPreviewId: null,

	currentPreviewItem: null,

	initialize: function() {
		this.listenTo( embroidery.channels.editor, 'saved', this.onEditorSaved );
		this.currentPreviewId = embroidery.config.current_revision_id;
	},

	getRevisionViewData: function( revisionView ) {
		var self = this;

		this.jqueryXhr = embroidery.history.revisions.getRevisionDataAsync( revisionView.model.get( 'id' ), {
			success: function( data ) {
				embroidery.history.revisions.setEditorData( data );

				self.setRevisionsButtonsActive( true );

				self.jqueryXhr = null;

				revisionView.$el.removeClass( 'embroidery-revision-item-loading' );

				self.enterReviewMode();
			},
			error: function() {
				revisionView.$el.removeClass( 'embroidery-revision-item-loading' );

				if ( 'abort' === self.jqueryXhr.statusText ) {
					return;
				}

				self.currentPreviewItem = null;

				self.currentPreviewId = null;

				alert( 'An error occurred' );
			}
		} );
	},

	setRevisionsButtonsActive: function( active ) {
		this.ui.apply.add( this.ui.discard ).prop( 'disabled', ! active );
	},

	deleteRevision: function( revisionView ) {
		var self = this;

		revisionView.$el.addClass( 'embroidery-revision-item-loading' );

		embroidery.history.revisions.deleteRevision( revisionView.model, {
			success: function() {
				if ( revisionView.model.get( 'id' ) === self.currentPreviewId ) {
					self.onDiscardClick();
				}

				self.currentPreviewId = null;
			},
			error: function( data ) {
				revisionView.$el.removeClass( 'embroidery-revision-item-loading' );

				alert( 'An error occurred' );
			}
		} );
	},

	enterReviewMode: function() {
		embroidery.changeEditMode( 'review' );
	},

	exitReviewMode: function() {
		embroidery.changeEditMode( 'edit' );
	},

	navigate: function( reverse ) {
		var currentPreviewItemIndex = this.collection.indexOf( this.currentPreviewItem.model ),
			requiredIndex = reverse ? currentPreviewItemIndex - 1 : currentPreviewItemIndex + 1;

		if ( requiredIndex < 0 ) {
			requiredIndex = this.collection.length - 1;
		}

		if ( requiredIndex >= this.collection.length ) {
			requiredIndex = 0;
		}

		this.children.findByIndex( requiredIndex ).ui.detailsArea.trigger( 'click' );
	},

	onEditorSaved: function() {
		this.exitReviewMode();

		this.setRevisionsButtonsActive( false );

		this.currentPreviewId = embroidery.config.current_revision_id;
	},

	onApplyClick: function() {
		embroidery.saver.setFlagEditorChange( true );

		embroidery.saver.saveAutoSave();

		this.isRevisionApplied = true;

		this.currentPreviewId = null;
	},

	onDiscardClick: function() {
		embroidery.history.revisions.setEditorData( embroidery.config.data );

		embroidery.saver.setFlagEditorChange( this.isRevisionApplied );

		this.isRevisionApplied = false;

		this.setRevisionsButtonsActive( false );

		this.currentPreviewId = null;

		this.exitReviewMode();

		if ( this.currentPreviewItem ) {
			this.currentPreviewItem.$el.removeClass( 'embroidery-revision-current-preview' );
		}
	},

	onDestroy: function() {
		if ( this.currentPreviewId && this.currentPreviewId !== embroidery.config.current_revision_id ) {
			this.onDiscardClick();
		}
	},

	onRenderCollection: function() {
		if ( ! this.currentPreviewId ) {
			return;
		}

		var currentPreviewModel = this.collection.findWhere({ id: this.currentPreviewId });

		// Ensure the model is exist and not deleted during a save.
		if ( currentPreviewModel ) {
			this.currentPreviewItem = this.children.findByModelCid( currentPreviewModel.cid );
			this.currentPreviewItem.$el.addClass( 'embroidery-revision-current-preview' );
		}
	},

	onChildviewDetailsAreaClick: function( childView ) {
		var self = this,
			revisionID = childView.model.get( 'id' );

		if ( revisionID === self.currentPreviewId ) {
			return;
		}

		if ( this.jqueryXhr ) {
			this.jqueryXhr.abort();
		}

		if ( self.currentPreviewItem ) {
			self.currentPreviewItem.$el.removeClass( 'embroidery-revision-current-preview' );
		}

		childView.$el.addClass( 'embroidery-revision-current-preview embroidery-revision-item-loading' );

		if ( embroidery.saver.isEditorChanged() && null === self.currentPreviewId ) {
			embroidery.saver.saveEditor( {
				status: 'autosave',
				onSuccess: function() {
					self.getRevisionViewData( childView );
				}
			} );
		} else {
			self.getRevisionViewData( childView );
		}

		self.currentPreviewItem = childView;

		self.currentPreviewId = revisionID;
	},

	onChildviewDeleteClick: function( childView ) {
		var self = this,
			type = childView.model.get( 'type' ),
			id = childView.model.get( 'id' );

		var removeDialog = embroidery.dialogsManager.createWidget( 'confirm', {
			message: embroidery.translate( 'dialog_confirm_delete', [ type ] ),
			headerMessage: embroidery.translate( 'delete_element', [ type ] ),
			strings: {
				confirm: embroidery.translate( 'delete' ),
				cancel: embroidery.translate( 'cancel' )
			},
			defaultOption: 'confirm',
			onConfirm: function() {
				self.deleteRevision( childView );
			}
		} );

		removeDialog.show();
	}
} );

},{"./view":139}],139:[function(require,module,exports){
module.exports =  Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-revisions-revision-item',

	className: 'embroidery-revision-item',

	ui: {
		detailsArea: '.embroidery-revision-item__details',
		deleteButton: '.embroidery-revision-item__tools-delete'
	},

	triggers: {
		'click @ui.detailsArea': 'detailsArea:click',
		'click @ui.deleteButton': 'delete:click'
	}
} );

},{}]},{},[108,109,59])
//# sourceMappingURL=editor.js.map
