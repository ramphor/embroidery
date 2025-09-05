module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-back',

	id: 'embroidery-template-library-header-preview-back',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		embroidery.templates.showTemplates();
	}
} );
