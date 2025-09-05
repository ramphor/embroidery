var TemplateLibraryInsertTemplateBehavior = require( 'embroidery-templates/behaviors/insert-template' ),
	TemplateLibraryTemplateView;

TemplateLibraryTemplateView = Marionette.ItemView.extend( {
	className: function() {
		var classes = 'embroidery-template-library-template embroidery-template-library-template-' + this.model.get( 'source' );

		if ( this.model.get( 'isPro' ) ) {
			classes += ' embroidery-template-library-pro-template';
		}

		return classes;
	},

	ui: function() {
		return {
			previewButton: '.embroidery-template-library-template-preview'
		};
	},

	events: function() {
		return {
			'click @ui.previewButton': 'onPreviewButtonClick'
		};
	},

	behaviors: {
		insertTemplate: {
			behaviorClass: TemplateLibraryInsertTemplateBehavior
		}
	}
} );

module.exports = TemplateLibraryTemplateView;
