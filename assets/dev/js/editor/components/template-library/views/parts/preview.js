var TemplateLibraryPreviewView;

TemplateLibraryPreviewView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-preview',

	id: 'embroidery-template-library-preview',

	ui: {
		iframe: '> iframe'
	},

	onRender: function() {
		this.ui.iframe.attr( 'src', this.getOption( 'url' ) );
	}
} );

module.exports = TemplateLibraryPreviewView;
