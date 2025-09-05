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
