var TemplateLibraryHeaderView = require( 'embroidery-templates/views/parts/header' ),
	TemplateLibraryHeaderLogoView = require( 'embroidery-templates/views/parts/header-parts/logo' ),
	TemplateLibraryHeaderActionsView = require( 'embroidery-templates/views/parts/header-parts/actions' ),
	TemplateLibraryHeaderMenuView = require( 'embroidery-templates/views/parts/header-parts/menu' ),
	TemplateLibraryHeaderPreviewView = require( 'embroidery-templates/views/parts/header-parts/preview' ),
	TemplateLibraryHeaderBackView = require( 'embroidery-templates/views/parts/header-parts/back' ),
	TemplateLibraryLoadingView = require( 'embroidery-templates/views/parts/loading' ),
	TemplateLibraryCollectionView = require( 'embroidery-templates/views/parts/templates' ),
	TemplateLibrarySaveTemplateView = require( 'embroidery-templates/views/parts/save-template' ),
	TemplateLibraryImportView = require( 'embroidery-templates/views/parts/import' ),
	TemplateLibraryPreviewView = require( 'embroidery-templates/views/parts/preview' ),
	TemplateLibraryLayoutView;

TemplateLibraryLayoutView = Marionette.LayoutView.extend( {
	el: '#embroidery-template-library-modal',

	regions: {
		modalContent: '.dialog-message',
		modalHeader: '.dialog-widget-header'
	},

	initialize: function() {
		this.getRegion( 'modalHeader' ).show( new TemplateLibraryHeaderView() );
	},

	getHeaderView: function() {
		return this.getRegion( 'modalHeader' ).currentView;
	},

	getTemplateActionButton: function( templateData ) {
		var viewId = '#tmpl-embroidery-template-library-' + ( templateData.isPro ? 'get-pro-button' : 'insert-button' );

		viewId = embroidery.hooks.applyFilters( 'embroidery/editor/template-library/template/action-button', viewId, templateData );

		var template = Marionette.TemplateCache.get( viewId );

		return Marionette.Renderer.render( template );
	},

	showLoadingView: function() {
		this.modalContent.show( new TemplateLibraryLoadingView() );
	},

	showTemplatesView: function( templatesCollection ) {
		this.modalContent.show( new TemplateLibraryCollectionView( {
			collection: templatesCollection
		} ) );

		var headerView = this.getHeaderView();

		headerView.tools.show( new TemplateLibraryHeaderActionsView() );
		headerView.menuArea.show( new TemplateLibraryHeaderMenuView() );
		headerView.logoArea.show( new TemplateLibraryHeaderLogoView() );
	},

	showImportView: function() {
		this.getHeaderView().menuArea.reset();

		this.modalContent.show( new TemplateLibraryImportView() );
	},

	showSaveTemplateView: function( elementModel ) {
		this.getHeaderView().menuArea.reset();

		this.modalContent.show( new TemplateLibrarySaveTemplateView( { model: elementModel } ) );
	},

	showPreviewView: function( templateModel ) {
		this.modalContent.show( new TemplateLibraryPreviewView( {
			url: templateModel.get( 'url' )
		} ) );

		var headerView = this.getHeaderView();

		headerView.menuArea.reset();

		headerView.tools.show( new TemplateLibraryHeaderPreviewView( {
			model: templateModel
		} ) );

		headerView.logoArea.show( new TemplateLibraryHeaderBackView() );
	}
} );

module.exports = TemplateLibraryLayoutView;
