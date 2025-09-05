var EditModeItemView;

EditModeItemView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-mode-switcher-content',

	id: 'embroidery-mode-switcher-inner',

	ui: {
		previewButton: '#embroidery-mode-switcher-preview-input',
		previewLabel: '#embroidery-mode-switcher-preview',
		previewLabelA11y: '#embroidery-mode-switcher-preview .embroidery-screen-only'
	},

	events: {
		'change @ui.previewButton': 'onPreviewButtonChange'
	},

	initialize: function() {
		this.listenTo( embroidery.channels.dataEditMode, 'switch', this.onEditModeChanged );
	},

	getCurrentMode: function() {
		return this.ui.previewButton.is( ':checked' ) ? 'preview' : 'edit';
	},

	setMode: function( mode ) {
		this.ui.previewButton
			.prop( 'checked', 'preview' === mode )
			.trigger( 'change' );
	},

	toggleMode: function() {
		this.setMode( this.ui.previewButton.prop( 'checked' ) ? 'edit' : 'preview' );
	},

	onRender: function() {
		this.onEditModeChanged();
	},

	onPreviewButtonChange: function() {
		embroidery.changeEditMode( this.getCurrentMode() );
	},

	onEditModeChanged: function() {
		var activeMode = embroidery.channels.dataEditMode.request( 'activeMode' ),
			title = embroidery.translate( 'preview' === activeMode ? 'back_to_editor' : 'preview' );

		this.ui.previewLabel.attr( 'title', title );
		this.ui.previewLabelA11y.text( title );
	}
} );

module.exports = EditModeItemView;
