var heartbeat;

heartbeat = {

	init: function() {
		var modal;

		this.getModal = function() {
			if ( ! modal ) {
				modal = this.initModal();
			}

			return modal;
		};

		jQuery( document ).on( {
			'heartbeat-send': function( event, data ) {
				data.embroidery_post_lock = {
					post_ID: embroidery.config.post_id
				};
			},
			'heartbeat-tick': function( event, response ) {
				if ( response.locked_user ) {
					if ( embroidery.saver.isEditorChanged() ) {
						embroidery.saver.saveEditor( {
							status: 'autosave'
						} );
					}

					heartbeat.showLockMessage( response.locked_user );
				} else {
					heartbeat.getModal().hide();
				}

				embroidery.config.nonce = response.embroideryNonce;
			},
			'heartbeat-tick.wp-refresh-nonces': function( event, response ) {
				var nonces = response['embroidery-refresh-nonces'];

				if ( nonces ) {
					if ( nonces.heartbeatNonce ) {
						embroidery.config.nonce = nonces.embroideryNonce;
					}

					if ( nonces.heartbeatNonce ) {
						window.heartbeatSettings.nonce = nonces.heartbeatNonce;
					}
				}
			}
		} );

		if ( embroidery.config.locked_user ) {
			heartbeat.showLockMessage( embroidery.config.locked_user );
		}
	},

	initModal: function() {
		var modal = embroidery.dialogsManager.createWidget( 'lightbox', {
			headerMessage: embroidery.translate( 'take_over' )
		} );

		modal.addButton( {
			name: 'go_back',
			text: embroidery.translate( 'go_back' ),
			callback: function() {
				parent.history.go( -1 );
			}
		} );

		modal.addButton( {
			name: 'take_over',
			text: embroidery.translate( 'take_over' ),
			callback: function() {
				wp.heartbeat.enqueue( 'embroidery_force_post_lock', true );
				wp.heartbeat.connectNow();
			}
		} );

		return modal;
	},

	showLockMessage: function( lockedUser ) {
		var modal = heartbeat.getModal();

		modal
			.setMessage( embroidery.translate( 'dialog_user_taken_over', [ lockedUser ] ) )
		    .show();
	}
};

module.exports = heartbeat;
