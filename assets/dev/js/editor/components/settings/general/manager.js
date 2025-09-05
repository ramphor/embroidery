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
