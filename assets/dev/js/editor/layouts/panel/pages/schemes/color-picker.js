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
