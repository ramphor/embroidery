var ControlMultipleBaseItemView = require( 'embroidery-controls/base-multiple' ),
	ControlMediaItemView;

ControlMediaItemView = ControlMultipleBaseItemView.extend( {
	ui: function() {
		var ui = ControlMultipleBaseItemView.prototype.ui.apply( this, arguments );

		ui.controlMedia = '.embroidery-control-media';
		ui.frameOpeners = '.embroidery-control-media-upload-button, .embroidery-control-media-image';
		ui.deleteButton = '.embroidery-control-media-delete';

		return ui;
	},

	events: function() {
		return _.extend( ControlMultipleBaseItemView.prototype.events.apply( this, arguments ), {
			'click @ui.frameOpeners': 'openFrame',
			'click @ui.deleteButton': 'deleteImage'
		} );
	},

	onReady: function() {
		if ( _.isEmpty( this.getControlValue( 'url' ) ) ) {
			this.ui.controlMedia.addClass( 'media-empty' );
		}
	},

	openFrame: function() {
		if ( ! this.frame ) {
			this.initFrame();
		}

		this.frame.open();
	},

	deleteImage: function() {
		this.setValue( {
			url: '',
			id: ''
		} );

		this.render();
	},

	/**
	 * Create a media modal select frame, and store it so the instance can be reused when needed.
	 */
	initFrame: function() {
		this.frame = wp.media( {
			button: {
				text: embroidery.translate( 'insert_media' )
			},
			states: [
				new wp.media.controller.Library( {
					title: embroidery.translate( 'insert_media' ),
					library: wp.media.query( { type: 'image' } ),
					multiple: false,
					date: false
				} )
			]
		} );

		// When a file is selected, run a callback.
		this.frame.on( 'insert select', this.select.bind( this ) );
	},

	/**
	 * Callback handler for when an attachment is selected in the media modal.
	 * Gets the selected image information, and sets it within the control.
	 */
	select: function() {
		this.trigger( 'before:select' );

		// Get the attachment from the modal frame.
		var attachment = this.frame.state().get( 'selection' ).first().toJSON();

		if ( attachment.url ) {
			this.setValue( {
				url: attachment.url,
				id: attachment.id
			} );

			this.render();
		}

		this.trigger( 'after:select' );
	},

	onBeforeDestroy: function() {
		this.$el.remove();
	}
} );

module.exports = ControlMediaItemView;
