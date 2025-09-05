var PanelSchemeItemView;

PanelSchemeItemView = Marionette.ItemView.extend( {
	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-embroidery-panel-scheme-' + this.getUIType() + '-item' );
	},

	className: function() {
		return 'embroidery-panel-scheme-item';
	}
} );

module.exports = PanelSchemeItemView;
