module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-template-library-header-logo',

	id: 'embroidery-template-library-header-logo',

	events: {
		'click': 'onClick'
	},

	onClick: function() {
		embroidery.templates.setTemplatesSource( 'remote' );
	}
} );
