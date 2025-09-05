var PanelElementsCategoryView = require( './category' ),
	PanelElementsCategoriesView;

PanelElementsCategoriesView = Marionette.CompositeView.extend( {
	template: '#tmpl-embroidery-panel-categories',

	childView: PanelElementsCategoryView,

	childViewContainer: '#embroidery-panel-categories',

	id: 'embroidery-panel-elements-categories',

	initialize: function() {
		this.listenTo( embroidery.channels.panelElements, 'filter:change', this.onPanelElementsFilterChange );
	},

	onPanelElementsFilterChange: function() {
		if ( embroidery.channels.panelElements.request( 'filter:value' ) ) {
			embroidery.getPanelView().getCurrentPageView().showView( 'elements' );
		}
	}
} );

module.exports = PanelElementsCategoriesView;
