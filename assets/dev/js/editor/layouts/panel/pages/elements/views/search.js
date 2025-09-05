var PanelElementsSearchView;

PanelElementsSearchView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-element-search',

	id: 'embroidery-panel-elements-search-wrapper',

	ui: {
		input: 'input'
	},

	events: {
		'keyup @ui.input': 'onInputChanged'
	},

	clearInput: function() {
		this.ui.input.val( '' );
	},

	onInputChanged: function( event ) {
		var ESC_KEY = 27;

		if ( ESC_KEY === event.keyCode ) {
			this.clearInput();
		}

		this.triggerMethod( 'search:change:input' );
	},

	onRender: function() {
		var input = this.ui.input;

		setTimeout( function() {
			input.focus();
		} );
	}
} );

module.exports = PanelElementsSearchView;
