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
