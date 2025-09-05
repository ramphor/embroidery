module.exports = Marionette.CompositeView.extend( {
	id: 'embroidery-panel-revisions',

	template: '#tmpl-embroidery-panel-revisions',

	childView: require( './view' ),

	childViewContainer: '#embroidery-revisions-list',

	ui: {
		discard: '.embroidery-panel-scheme-discard .embroidery-button',
		apply: '.embroidery-panel-scheme-save .embroidery-button'
	},

	events: {
		'click @ui.discard': 'onDiscardClick',
		'click @ui.apply': 'onApplyClick'
	},

	isRevisionApplied: false,

	jqueryXhr: null,

	currentPreviewId: null,

	currentPreviewItem: null,

	initialize: function() {
		this.listenTo( embroidery.channels.editor, 'saved', this.onEditorSaved );
		this.currentPreviewId = embroidery.config.current_revision_id;
	},

	getRevisionViewData: function( revisionView ) {
		var self = this;

		this.jqueryXhr = embroidery.history.revisions.getRevisionDataAsync( revisionView.model.get( 'id' ), {
			success: function( data ) {
				embroidery.history.revisions.setEditorData( data );

				self.setRevisionsButtonsActive( true );

				self.jqueryXhr = null;

				revisionView.$el.removeClass( 'embroidery-revision-item-loading' );

				self.enterReviewMode();
			},
			error: function() {
				revisionView.$el.removeClass( 'embroidery-revision-item-loading' );

				if ( 'abort' === self.jqueryXhr.statusText ) {
					return;
				}

				self.currentPreviewItem = null;

				self.currentPreviewId = null;

				alert( 'An error occurred' );
			}
		} );
	},

	setRevisionsButtonsActive: function( active ) {
		this.ui.apply.add( this.ui.discard ).prop( 'disabled', ! active );
	},

	deleteRevision: function( revisionView ) {
		var self = this;

		revisionView.$el.addClass( 'embroidery-revision-item-loading' );

		embroidery.history.revisions.deleteRevision( revisionView.model, {
			success: function() {
				if ( revisionView.model.get( 'id' ) === self.currentPreviewId ) {
					self.onDiscardClick();
				}

				self.currentPreviewId = null;
			},
			error: function( data ) {
				revisionView.$el.removeClass( 'embroidery-revision-item-loading' );

				alert( 'An error occurred' );
			}
		} );
	},

	enterReviewMode: function() {
		embroidery.changeEditMode( 'review' );
	},

	exitReviewMode: function() {
		embroidery.changeEditMode( 'edit' );
	},

	navigate: function( reverse ) {
		var currentPreviewItemIndex = this.collection.indexOf( this.currentPreviewItem.model ),
			requiredIndex = reverse ? currentPreviewItemIndex - 1 : currentPreviewItemIndex + 1;

		if ( requiredIndex < 0 ) {
			requiredIndex = this.collection.length - 1;
		}

		if ( requiredIndex >= this.collection.length ) {
			requiredIndex = 0;
		}

		this.children.findByIndex( requiredIndex ).ui.detailsArea.trigger( 'click' );
	},

	onEditorSaved: function() {
		this.exitReviewMode();

		this.setRevisionsButtonsActive( false );

		this.currentPreviewId = embroidery.config.current_revision_id;
	},

	onApplyClick: function() {
		embroidery.saver.setFlagEditorChange( true );

		embroidery.saver.saveAutoSave();

		this.isRevisionApplied = true;

		this.currentPreviewId = null;
	},

	onDiscardClick: function() {
		embroidery.history.revisions.setEditorData( embroidery.config.data );

		embroidery.saver.setFlagEditorChange( this.isRevisionApplied );

		this.isRevisionApplied = false;

		this.setRevisionsButtonsActive( false );

		this.currentPreviewId = null;

		this.exitReviewMode();

		if ( this.currentPreviewItem ) {
			this.currentPreviewItem.$el.removeClass( 'embroidery-revision-current-preview' );
		}
	},

	onDestroy: function() {
		if ( this.currentPreviewId && this.currentPreviewId !== embroidery.config.current_revision_id ) {
			this.onDiscardClick();
		}
	},

	onRenderCollection: function() {
		if ( ! this.currentPreviewId ) {
			return;
		}

		var currentPreviewModel = this.collection.findWhere({ id: this.currentPreviewId });

		// Ensure the model is exist and not deleted during a save.
		if ( currentPreviewModel ) {
			this.currentPreviewItem = this.children.findByModelCid( currentPreviewModel.cid );
			this.currentPreviewItem.$el.addClass( 'embroidery-revision-current-preview' );
		}
	},

	onChildviewDetailsAreaClick: function( childView ) {
		var self = this,
			revisionID = childView.model.get( 'id' );

		if ( revisionID === self.currentPreviewId ) {
			return;
		}

		if ( this.jqueryXhr ) {
			this.jqueryXhr.abort();
		}

		if ( self.currentPreviewItem ) {
			self.currentPreviewItem.$el.removeClass( 'embroidery-revision-current-preview' );
		}

		childView.$el.addClass( 'embroidery-revision-current-preview embroidery-revision-item-loading' );

		if ( embroidery.saver.isEditorChanged() && null === self.currentPreviewId ) {
			embroidery.saver.saveEditor( {
				status: 'autosave',
				onSuccess: function() {
					self.getRevisionViewData( childView );
				}
			} );
		} else {
			self.getRevisionViewData( childView );
		}

		self.currentPreviewItem = childView;

		self.currentPreviewId = revisionID;
	},

	onChildviewDeleteClick: function( childView ) {
		var self = this,
			type = childView.model.get( 'type' ),
			id = childView.model.get( 'id' );

		var removeDialog = embroidery.dialogsManager.createWidget( 'confirm', {
			message: embroidery.translate( 'dialog_confirm_delete', [ type ] ),
			headerMessage: embroidery.translate( 'delete_element', [ type ] ),
			strings: {
				confirm: embroidery.translate( 'delete' ),
				cancel: embroidery.translate( 'cancel' )
			},
			defaultOption: 'confirm',
			onConfirm: function() {
				self.deleteRevision( childView );
			}
		} );

		removeDialog.show();
	}
} );
