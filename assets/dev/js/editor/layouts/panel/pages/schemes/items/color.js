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
