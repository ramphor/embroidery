var TemplateLibraryInsertTemplateBehavior = require( 'embroidery-templates/behaviors/insert-template' );

module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-preview',

	id: 'embroidery-template-library-header-preview',

	behaviors: {
		insertTemplate: {
			behaviorClass: TemplateLibraryInsertTemplateBehavior
		}
	}
} );
