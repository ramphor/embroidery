module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-menu-item',

	className: 'embroidery-panel-menu-item',

	triggers: {
		click: 'click'
	}
} );
