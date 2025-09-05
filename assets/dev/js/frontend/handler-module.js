var ViewModule = require( '../utils/view-module' ),
	HandlerModule;

HandlerModule = ViewModule.extend( {
	$element: null,

	onElementChange: null,

	onEditSettingsChange: null,

	onGeneralSettingsChange: null,

	onPageSettingsChange: null,

	isEdit: null,

	__construct: function( settings ) {
		this.$element  = settings.$element;

		this.isEdit = this.$element.hasClass( 'embroidery-element-edit-mode' );

		if ( this.isEdit ) {
			this.addEditorListener();
		}
	},

	findElement: function( selector ) {
		var $mainElement = this.$element;

		return $mainElement.find( selector ).filter( function() {
			return jQuery( this ).closest( '.embroidery-element' ).is( $mainElement );
		} );
	},

	getUniqueHandlerID: function( cid, $element ) {
		if ( ! cid ) {
			cid = this.getModelCID();
		}

		if ( ! $element ) {
			$element = this.$element;
		}

		return cid + $element.attr( 'data-element_type' ) + this.getConstructorID();
	},

	addEditorListener: function() {
		var self = this,
			uniqueHandlerID = self.getUniqueHandlerID();

		if ( self.onElementChange ) {
			var elementName = self.getElementName(),
				eventName = 'change';

			if ( 'global' !== elementName ) {
				eventName += ':' + elementName;
			}

			embroideryFrontend.addListenerOnce( uniqueHandlerID, eventName, function( controlView, elementView ) {
				var elementViewHandlerID = self.getUniqueHandlerID( elementView.model.cid, elementView.$el );

				if ( elementViewHandlerID !== uniqueHandlerID ) {
					return;
				}

				self.onElementChange( controlView.model.get( 'name' ),  controlView, elementView );
			}, embroidery.channels.editor );
		}

		if ( self.onEditSettingsChange ) {
			embroideryFrontend.addListenerOnce( uniqueHandlerID, 'change:editSettings', function( changedModel, view ) {
				if ( view.model.cid !== self.getModelCID() ) {
					return;
				}

				self.onEditSettingsChange( Object.keys( changedModel.changed )[0] );
			}, embroidery.channels.editor );
		}

		[ 'page', 'general' ].forEach( function( settingsType ) {
			var listenerMethodName = 'on' + settingsType.charAt( 0 ).toUpperCase() + settingsType.slice( 1 ) + 'SettingsChange';

			if ( self[ listenerMethodName ] ) {
				embroideryFrontend.addListenerOnce( uniqueHandlerID, 'change', function( model ) {
					self[ listenerMethodName ]( model.changed );
				}, embroidery.settings[ settingsType ].model );
			}
		} );
	},

	getElementName: function() {
		return this.$element.data( 'element_type' ).split( '.' )[0];
	},

	getID: function() {
		return this.$element.data( 'id' );
	},

	getModelCID: function() {
		return this.$element.data( 'model-cid' );
	},

	getElementSettings: function( setting ) {
		var elementSettings = {},
			modelCID = this.getModelCID();

		if ( this.isEdit && modelCID ) {
			var settings = embroideryFrontend.config.elements.data[ modelCID ],
				settingsKeys = embroideryFrontend.config.elements.keys[ settings.attributes.widgetType || settings.attributes.elType ];

			jQuery.each( settings.getActiveControls(), function( controlKey ) {
				if ( -1 !== settingsKeys.indexOf( controlKey ) ) {
					elementSettings[ controlKey ] = settings.attributes[ controlKey ];
				}
			} );
		} else {
			elementSettings = this.$element.data( 'settings' ) || {};
		}

		return this.getItems( elementSettings, setting );
	},

	getEditSettings: function( setting ) {
		var attributes = {};

		if ( this.isEdit ) {
			attributes = embroideryFrontend.config.elements.editSettings[ this.getModelCID() ].attributes;
		}

		return this.getItems( attributes, setting );
	}
} );

module.exports = HandlerModule;
