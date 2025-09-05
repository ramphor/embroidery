var ControlBaseView = require( 'embroidery-controls/base' );

module.exports = ControlBaseView.extend( {

	ui: function() {
		var ui = ControlBaseView.prototype.ui.apply( this, arguments );

		ui.button = 'button';

		return ui;
	},

	events: {
		'click @ui.button': 'onButtonClick'
	},

	onButtonClick: function() {
		var eventName = this.model.get( 'event' );

		embroidery.channels.editor.trigger( eventName, this );
	}
} );
