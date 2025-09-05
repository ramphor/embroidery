var TemplateLibraryTemplatesEmptyView;

TemplateLibraryTemplatesEmptyView = Marionette.ItemView.extend( {
	id: 'embroidery-template-library-templates-empty',

	template: '#tmpl-embroidery-template-library-templates-empty',

	ui: {
		title: '.embroidery-template-library-blank-title',
		message: '.embroidery-template-library-blank-message'
	},

	modesStrings: {
		empty: {
			title: embroidery.translate( 'templates_empty_title' ),
			message: embroidery.translate( 'templates_empty_message' )
		},
		noResults: {
			title: embroidery.translate( 'templates_no_results_title' ),
			message: embroidery.translate( 'templates_no_results_message' )
		},
		noFavorites: {
			title: embroidery.translate( 'templates_no_favorites_title' ),
			message: embroidery.translate( 'templates_no_favorites_message' )
		}
	},

	getCurrentMode: function() {
		if ( embroidery.templates.getFilter( 'text' ) ) {
			return 'noResults';
		}

		if ( embroidery.templates.getFilter( 'favorite' ) ) {
			return 'noFavorites';
		}

		return 'empty';
	},

	onRender: function() {
		var modeStrings = this.modesStrings[ this.getCurrentMode() ];

		this.ui.title.html( modeStrings.title );

		this.ui.message.html( modeStrings.message );
	}
} );

module.exports = TemplateLibraryTemplatesEmptyView;
