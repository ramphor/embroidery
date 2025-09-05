var PanelElementsElementsCollection = require( '../collections/elements' ),
	PanelElementsCategoryView;

PanelElementsCategoryView = Marionette.CompositeView.extend( {
	template: '#tmpl-embroidery-panel-elements-category',

	className: 'embroidery-panel-category',

	childView: require( 'embroidery-panel/pages/elements/views/element' ),

	childViewContainer: '.panel-elements-category-items',

	initialize: function() {
		this.collection = new PanelElementsElementsCollection( this.model.get( 'items' ) );
	}
} );

module.exports = PanelElementsCategoryView;
