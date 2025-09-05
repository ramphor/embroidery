var TemplateLibraryTemplateView = require( 'embroidery-templates/views/template/base' ),
	TemplateLibraryTemplateRemoteView;

TemplateLibraryTemplateRemoteView = TemplateLibraryTemplateView.extend( {
	template: '#tmpl-embroidery-template-library-template-remote',

	ui: function() {
		return jQuery.extend( TemplateLibraryTemplateView.prototype.ui.apply( this, arguments ), {
			favoriteCheckbox: '.embroidery-template-library-template-favorite-input'
		} );
	},

	events: function() {
		return jQuery.extend( TemplateLibraryTemplateView.prototype.events.apply( this, arguments ), {
			'change @ui.favoriteCheckbox': 'onFavoriteCheckboxChange'
		} );
	},

	onPreviewButtonClick: function() {
		embroidery.templates.getLayout().showPreviewView( this.model );
	},

	onFavoriteCheckboxChange: function() {
		var isFavorite = this.ui.favoriteCheckbox[0].checked;

		this.model.set( 'favorite', isFavorite );

		embroidery.templates.markAsFavorite( this.model, isFavorite );

		if ( ! isFavorite && embroidery.templates.getFilter( 'favorite' ) ) {
			embroidery.channels.templates.trigger( 'filter:change' );
		}
	}
} );

module.exports = TemplateLibraryTemplateRemoteView;
