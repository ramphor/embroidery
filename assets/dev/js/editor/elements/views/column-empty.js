var ElementEmptyView;

ElementEmptyView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-empty-preview',

	className: 'embroidery-empty-view',

	events: {
		'click': 'onClickAdd'
	},

	onClickAdd: function() {
		embroidery.getPanelView().setPage( 'elements' );
	}
} );

module.exports = ElementEmptyView;
