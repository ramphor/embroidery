module.exports =  Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-revisions-revision-item',

	className: 'embroidery-revision-item',

	ui: {
		detailsArea: '.embroidery-revision-item__details',
		deleteButton: '.embroidery-revision-item__tools-delete'
	},

	triggers: {
		'click @ui.detailsArea': 'detailsArea:click',
		'click @ui.deleteButton': 'delete:click'
	}
} );
