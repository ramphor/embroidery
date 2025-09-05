module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-actions',

	id: 'embroidery-template-library-header-actions',

	ui: {
		'import': '#embroidery-template-library-header-import i',
		sync: '#embroidery-template-library-header-sync i',
		save: '#embroidery-template-library-header-save i'
	},

	events: {
		'click @ui.import': 'onImportClick',
		'click @ui.sync': 'onSyncClick',
		'click @ui.save': 'onSaveClick'
	},

	onImportClick: function() {
		embroidery.templates.getLayout().showImportView();
	},

	onSyncClick: function() {
		var self = this;

		self.ui.sync.addClass( 'eicon-animation-spin' );

		embroidery.templates.requestLibraryData( function() {
			self.ui.sync.removeClass( 'eicon-animation-spin' );

			embroidery.templates.showTemplates();
		}, true, true );
	},

	onSaveClick: function() {
		embroidery.templates.getLayout().showSaveTemplateView();
	}
} );
