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
