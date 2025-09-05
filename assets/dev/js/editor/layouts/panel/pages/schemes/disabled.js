var PanelSchemeDisabledView;

PanelSchemeDisabledView = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-schemes-disabled',

	id: 'embroidery-panel-schemes-disabled',

	className: 'embroidery-panel-nerd-box',

	disabledTitle: '',

	templateHelpers: function() {
		return {
			disabledTitle: this.disabledTitle
		};
	}
} );

module.exports = PanelSchemeDisabledView;
