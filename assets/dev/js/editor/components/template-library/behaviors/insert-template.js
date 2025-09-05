var InsertTemplateHandler;

InsertTemplateHandler = Marionette.Behavior.extend( {
	ui: {
		insertButton: '.embroidery-template-library-template-insert'
	},

	events: {
		'click @ui.insertButton': 'onInsertButtonClick'
	},

	onInsertButtonClick: function() {
		if ( this.view.model.get( 'hasPageSettings' ) ) {
			InsertTemplateHandler.showImportDialog( this.view.model );
			return;
		}

		embroidery.templates.importTemplate( this.view.model );
	}
}, {
	dialog: null,

	showImportDialog: function( model ) {
		var dialog = InsertTemplateHandler.getDialog();

		dialog.onConfirm = function() {
			embroidery.templates.importTemplate( model, { withPageSettings: true } );
		};

		dialog.onCancel = function() {
			embroidery.templates.importTemplate( model );
		};

		dialog.show();
	},

	initDialog: function() {
		InsertTemplateHandler.dialog = embroidery.dialogsManager.createWidget( 'confirm', {
			id: 'embroidery-insert-template-settings-dialog',
			headerMessage: embroidery.translate( 'import_template_dialog_header' ),
			message: embroidery.translate( 'import_template_dialog_message' ) + '<br>' + embroidery.translate( 'import_template_dialog_message_attention' ),
			strings: {
				confirm: embroidery.translate( 'yes' ),
				cancel: embroidery.translate( 'no' )
			}
		} );
	},

	getDialog: function() {
		if ( ! InsertTemplateHandler.dialog ) {
			InsertTemplateHandler.initDialog();
		}

		return InsertTemplateHandler.dialog;
	}
} );

module.exports = InsertTemplateHandler;
