var TemplateLibraryHeaderView;

TemplateLibraryHeaderView = Marionette.LayoutView.extend( {

	id: 'embroidery-template-library-header',

	template: '#tmpl-embroidery-template-library-header',

	regions: {
		logoArea: '#embroidery-template-library-header-logo-area',
		tools: '#embroidery-template-library-header-tools',
		menuArea: '#embroidery-template-library-header-menu-area'
	},

	ui: {
		closeModal: '#embroidery-template-library-header-close-modal'
	},

	events: {
		'click @ui.closeModal': 'onCloseModalClick'
	},

	onCloseModalClick: function() {
		embroidery.templates.closeModal();
	}
} );

module.exports = TemplateLibraryHeaderView;
