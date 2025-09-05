var ControlsStack = require( 'embroidery-views/controls-stack' );

module.exports = ControlsStack.extend( {
	id: function() {
		return 'embroidery-panel-' + this.getOption( 'name' ) + '-settings';
	},

	getTemplate: function() {
		return '#tmpl-embroidery-panel-' + this.getOption( 'name' ) + '-settings';
	},

	childViewContainer: function() {
		return '#embroidery-panel-' + this.getOption( 'name' ) + '-settings-controls';
	},

	childViewOptions: function() {
		return {
			elementSettingsModel: this.model
		};
	},

	initialize: function() {
		this.collection = new Backbone.Collection( _.values( this.model.controls ) );
	}
} );
