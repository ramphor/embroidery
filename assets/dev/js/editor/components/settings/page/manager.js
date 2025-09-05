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
