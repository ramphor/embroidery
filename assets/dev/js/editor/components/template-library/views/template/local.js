var TemplateLibraryTemplateView = require( 'embroidery-templates/views/template/base' ),
	TemplateLibraryTemplateLocalView;

TemplateLibraryTemplateLocalView = TemplateLibraryTemplateView.extend( {
	template: '#tmpl-embroidery-template-library-template-local',

	ui: function() {
		return _.extend( TemplateLibraryTemplateView.prototype.ui.apply( this, arguments ), {
			deleteButton: '.embroidery-template-library-template-delete',
			morePopup: '.embroidery-template-library-template-more',
			toggleMore: '.embroidery-template-library-template-more-toggle',
			toggleMoreIcon: '.embroidery-template-library-template-more-toggle i'
		} );
	},

	events: function() {
		return _.extend( TemplateLibraryTemplateView.prototype.events.apply( this, arguments ), {
			'click @ui.deleteButton': 'onDeleteButtonClick',
			'click @ui.toggleMore': 'onToggleMoreClick'
		} );
	},

	onDeleteButtonClick: function() {
		var toggleMoreIcon = this.ui.toggleMoreIcon;

		embroidery.templates.deleteTemplate( this.model, {
			onConfirm: function() {
				toggleMoreIcon.removeClass( 'eicon-ellipsis-h' ).addClass( 'fa fa-circle-o-notch fa-spin' );
			},
			onSuccess: function() {
				embroidery.templates.showTemplates();
			}
		} );
	},

	onToggleMoreClick: function() {
		this.ui.morePopup.show();
	},

	onPreviewButtonClick: function() {
		open( this.model.get( 'url' ), '_blank' );
	}
} );

module.exports = TemplateLibraryTemplateLocalView;
