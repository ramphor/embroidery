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
