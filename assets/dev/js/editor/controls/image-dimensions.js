var ControlMultipleBaseItemView = require( 'embroidery-controls/base-multiple' ),
	ControlImageDimensionsItemView;

ControlImageDimensionsItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		return {
			inputWidth: 'input[data-setting="width"]',
			inputHeight: 'input[data-setting="height"]',

			btnApply: 'button.embroidery-image-dimensions-apply-button'
		};
	},

	// Override the base events
	events: function() {
		return {
			'click @ui.btnApply': 'onApplyClicked'
		};
	},

	onApplyClicked: function( event ) {
		event.preventDefault();

		this.setValue( {
			width: this.ui.inputWidth.val(),
			height: this.ui.inputHeight.val()
		} );
	}
} );

module.exports = ControlImageDimensionsItemView;
