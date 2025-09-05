var HistoryPageView = require( './panel-page' ),
	Manager;

Manager = function() {
	var self = this;

	var addPanelPage = function() {
		embroidery.getPanelView().addPage( 'historyPage', {
			view: HistoryPageView,
			title: embroidery.translate( 'history' )
		} );
	};

	var init = function() {
		embroidery.on( 'preview:loaded', addPanelPage );

		self.history = require( './history/manager' );

		self.revisions = require( './revisions/manager' );

		self.revisions.init();
	};

	jQuery( window ).on( 'embroidery:init', init );
};

module.exports = new Manager();
