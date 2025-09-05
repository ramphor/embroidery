var PanelElementsElementView;

PanelElementsElementView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-element-library-element',

	className: 'embroidery-element-wrapper',

	onRender: function() {
		var self = this;

		this.$el.html5Draggable( {

			onDragStart: function() {
				embroidery.channels.panelElements
					.reply( 'element:selected', self )
					.trigger( 'element:drag:start' );
			},

			onDragEnd: function() {
				embroidery.channels.panelElements.trigger( 'element:drag:end' );
			},

			groups: [ 'embroidery-element' ]
		} );
	}
} );

module.exports = PanelElementsElementView;
