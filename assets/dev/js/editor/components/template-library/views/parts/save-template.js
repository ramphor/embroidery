var TemplateLibrarySaveTemplateView;

TemplateLibrarySaveTemplateView = Marionette.ItemView.extend( {
	id: 'embroidery-template-library-save-template',

	template: '#tmpl-embroidery-template-library-save-template',

	ui: {
		form: '#embroidery-template-library-save-template-form',
		submitButton: '#embroidery-template-library-save-template-submit'
	},

	events: {
		'submit @ui.form': 'onFormSubmit'
	},

	getSaveType: function() {
		return this.model ? this.model.get( 'elType' ) : 'page';
	},

	templateHelpers: function() {
		var saveType = this.getSaveType(),
			templateType = embroidery.templates.getTemplateTypes( saveType );

		return templateType.saveDialog;
	},

	onFormSubmit: function( event ) {
		event.preventDefault();

		var formData = this.ui.form.embroiderySerializeObject(),
			saveType = this.model ? this.model.get( 'elType' ) : 'page',
			JSONParams = { removeDefault: true };

		formData.content = this.model ? [ this.model.toJSON( JSONParams ) ] : embroidery.elements.toJSON( JSONParams );

		this.ui.submitButton.addClass( 'embroidery-button-state' );

		embroidery.templates.saveTemplate( saveType, formData );
	}
} );

module.exports = TemplateLibrarySaveTemplateView;
