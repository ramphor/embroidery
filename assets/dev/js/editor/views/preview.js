var BaseSectionsContainerView = require( 'embroidery-views/base-sections-container' ),
	AddSectionView = require( 'embroidery-views/add-section/independent' ),
	Preview;

Preview = BaseSectionsContainerView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-preview' ),

	className: 'embroidery-inner',

	childViewContainer: '.embroidery-section-wrap',

	onRender: function() {
		var addNewSectionView = new AddSectionView();

		addNewSectionView.render();

		this.$el.append( addNewSectionView.$el );
	}
} );

module.exports = Preview;
