module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-global',

	id: 'embroidery-panel-global',

	initialize: function() {
		embroidery.getPanelView().getCurrentPageView().search.reset();
	},

	onDestroy: function() {
		embroidery.getPanelView().getCurrentPageView().showView( 'search' );
	}
} );
