var Module = require( 'embroidery-utils/module' );

module.exports = Module.extend( {
	autoSaveTimer: null,

	autosaveInterval: embroidery.config.autosave_interval * 1000,

	isSaving: false,

	isChangedDuringSave: false,

	__construct: function() {
		this.setWorkSaver();
	},

	startTimer: function( hasChanges ) {
		clearTimeout( this.autoSaveTimer );
		if ( hasChanges ) {
			this.autoSaveTimer = window.setTimeout( _.bind( this.doAutoSave, this ), this.autosaveInterval );
		}
	},

	saveDraft: function() {
		if ( ! this.isEditorChanged() ) {
			return;
		}

		var postStatus = embroidery.settings.page.model.get( 'post_status' );

		switch ( postStatus ) {
			case 'publish':
			case 'private':
				this.doAutoSave();
				break;
			default:
				// Update and create a revision
				this.update();
		}
	},

	doAutoSave: function() {
		var editorMode = embroidery.channels.dataEditMode.request( 'activeMode' );

		// Avoid auto save for Revisions Preview changes.
		if ( 'edit' !== editorMode ) {
			return;
		}

		this.saveAutoSave();
	},

	saveAutoSave: function( options ) {
		if ( ! this.isEditorChanged() ) {
			return;
		}

		options = _.extend( {
			status: 'autosave'
		}, options );

		this.saveEditor( options );
	},

	savePending: function( options ) {
		options = _.extend( {
			status: 'pending'
		}, options );

		this.saveEditor( options );
	},

	discard: function() {
		var self = this;
		embroidery.ajax.send( 'discard_changes', {
			data: {
				post_id: embroidery.config.post_id
			},

			success: function() {
				self.setFlagEditorChange( false );
				location.href = embroidery.config.exit_to_dashboard_url;
			}
		} );
	},

	update: function( options ) {
		options = _.extend( {
			status: embroidery.settings.page.model.get( 'post_status' )
		}, options );

		this.saveEditor( options );
	},

	publish: function( options ) {
		options = _.extend( {
			status: 'publish'
		}, options );

		this.saveEditor( options );
	},

	setFlagEditorChange: function( status ) {
		if ( status && this.isSaving ) {
			this.isChangedDuringSave = true;
		}

		this.startTimer( status );

		embroidery.channels.editor
			.reply( 'status', status )
			.trigger( 'status:change', status );
	},

	isEditorChanged: function() {
		return ( true === embroidery.channels.editor.request( 'status' ) );
	},

	setWorkSaver: function() {
		var self = this;
		embroidery.$window.on( 'beforeunload', function() {
			if ( self.isEditorChanged() ) {
				return embroidery.translate( 'before_unload_alert' );
			}
		} );
	},

	saveEditor: function( options ) {
		if ( this.isSaving ) {
			return;
		}

		options = _.extend( {
			status: 'draft',
			onSuccess: null
		}, options );

		var self = this,
			newData = embroidery.elements.toJSON( { removeDefault: true } ),
			oldStatus = embroidery.settings.page.model.get( 'post_status' ),
			statusChanged = oldStatus !== options.status;

		self.trigger( 'before:save', options )
			.trigger( 'before:save:' + options.status, options );

		self.isSaving = true;

		self.isChangedDuringSave = false;

		self.xhr = embroidery.ajax.send( 'save_builder', {
			data: {
				post_id: embroidery.config.post_id,
				status: options.status,
				data: JSON.stringify( newData )
			},

			success: function( data ) {
				self.afterAjax();

				if ( ! self.isChangedDuringSave ) {
					self.setFlagEditorChange( false );
				}

				if ( 'autosave' !== options.status && statusChanged ) {
					embroidery.settings.page.model.set( 'post_status', options.status );
				}

				if ( data.config ) {
					jQuery.extend( true, embroidery.config, data.config );
				}

				embroidery.config.data = newData;

				embroidery.channels.editor.trigger( 'saved', data );

				self.trigger( 'after:save', data )
					.trigger( 'after:save:' + options.status, data );

				if ( statusChanged ) {
					self.trigger( 'page:status:change', options.status, oldStatus );
				}

				if ( _.isFunction( options.onSuccess ) ) {
					options.onSuccess.call( this, data );
				}
			},
			error: function( data ) {
				self.afterAjax();

				self.trigger( 'after:saveError', data )
					.trigger( 'after:saveError:' + options.status, data );

				var message;

				if ( data.statusText ) {
					message = embroidery.ajax.createErrorMessage( data );

					if ( 0 === data.readyState ) {
						message += ' ' + embroidery.translate( 'saving_disabled' );
					}
				} else if ( data[0] && data[0].code ) {
					message = embroidery.translate( 'server_error' ) + ' ' + data[0].code;
				}

				embroidery.notifications.showToast( {
					message: message
				} );
			}
		} );

		return self.xhr;
	},

	afterAjax: function() {
		this.isSaving = false;
		this.xhr = null;
	}
} );
