var PanelHeaderItemView;

PanelHeaderItemView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-header',

	id: 'embroidery-panel-header',

	ui: {
		menuButton: '#embroidery-panel-header-menu-button',
		menuIcon: '#embroidery-panel-header-menu-button i',
		title: '#embroidery-panel-header-title',
		addButton: '#embroidery-panel-header-add-button'
	},

	events: {
		'click @ui.addButton': 'onClickAdd',
		'click @ui.menuButton': 'onClickMenu'
	},

	setTitle: function( title ) {
		this.ui.title.html( title );
	},

	onClickAdd: function() {
		embroidery.getPanelView().setPage( 'elements' );
	},

	onClickMenu: function() {
		var panel = embroidery.getPanelView(),
			currentPanelPageName = panel.getCurrentPageName(),
			nextPage = 'menu' === currentPanelPageName ? 'elements' : 'menu';

		if ( 'menu' === nextPage ) {
			var arrowClass = 'eicon-arrow-' + ( embroidery.config.is_rtl ? 'right' : 'left' );

			this.ui.menuIcon.removeClass( 'eicon-menu-bar' ).addClass( arrowClass );
		}

		panel.setPage( nextPage );
	}
} );

module.exports = PanelHeaderItemView;
