var PanelElementsElementsView;

PanelElementsElementsView = Marionette.CollectionView.extend( {
	childView: require( 'embroidery-panel/pages/elements/views/element' ),

	id: 'embroidery-panel-elements',

	initialize: function() {
		this.listenTo( embroidery.channels.panelElements, 'filter:change', this.onFilterChanged );
	},

	filter: function( childModel ) {
		var filterValue = embroidery.channels.panelElements.request( 'filter:value' );

		if ( ! filterValue ) {
			return true;
		}

		if ( -1 !== childModel.get( 'title' ).toLowerCase().indexOf( filterValue.toLowerCase() ) ) {
			return true;
		}

		return _.any( childModel.get( 'keywords' ), function( keyword ) {
			return ( -1 !== keyword.toLowerCase().indexOf( filterValue.toLowerCase() ) );
		} );
	},

	onFilterChanged: function() {
		var filterValue = embroidery.channels.panelElements.request( 'filter:value' );

		if ( ! filterValue ) {
			this.onFilterEmpty();
		}

		this._renderChildren();

		this.triggerMethod( 'children:render' );
	},

	onFilterEmpty: function() {
		embroidery.getPanelView().getCurrentPageView().showView( 'categories' );
	}
} );

module.exports = PanelElementsElementsView;
