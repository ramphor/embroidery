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
