var embroideryTests = {};

embroideryTests.setPanelSelectedElement = function( category, name ) {
	embroidery.getPanelView().setPage( 'elements' );

	var elementsPanel = embroidery.getPanelView().getCurrentPageView().elements.currentView,
		basicElements = elementsPanel.collection.findWhere( { name: category } ),
		view = elementsPanel.children.findByModel( basicElements ),
		headingWidget = view.children.findByModel( view.collection.findWhere( { widgetType: name } ) );

	embroidery.channels.panelElements.reply( 'element:selected', headingWidget );
};

QUnit.module( 'Loading' );

QUnit.test( 'Embroidery exist', function( assert ) {
	assert.ok( embroidery );
});

QUnit.test( 'Preview loaded', function( assert ) {
	assert.ok( embroidery.$previewContents, 'Preview Exist' );
	assert.equal( 1, embroidery.$previewContents.find( '.embroidery-editor-active' ).length, 'Embroidery area Exist' );
});

QUnit.test( 'Frontend CSS loaded', function( assert ) {
	assert.equal( embroidery.$previewContents.find( '#embroidery-frontend-css' ).length, 1 );
});

function testPreview() {

	QUnit.module( 'Widgets' );
	var firstSectionModel = embroidery.sections.currentView.collection.first(),
		firstSectionView = embroidery.sections.currentView.children.findByModel( firstSectionModel ),
		firstColumnModel = firstSectionModel.get( 'elements' ).first(),
		firstColumnView = firstSectionView.children.findByModel( firstColumnModel ),
		elements = [
			// ['basic', ''], // widget columns
			['basic', 'heading'],
			['basic', 'image'],
			// ['basic', 'text-editor'],
			['basic', 'video'],
			['basic', 'button'],
			['basic', 'divider'],
			['basic', 'spacer'],
			['basic', 'google_maps'],
			['basic', 'icon'],
			['general-elements', 'image-box'],
			['general-elements', 'icon-box'],
			['general-elements', 'image-gallery'],
			['general-elements', 'image-carousel'],
			['general-elements', 'icon-list'],
			['general-elements', 'counter'],
			['general-elements', 'progress'],
			['general-elements', 'testimonial'],
			// ['general-elements', 'tabs'],
			// ['general-elements', 'accordion'],
			// ['general-elements', 'toggle'],
			['general-elements', 'social-icons'],
			['general-elements', 'alert'],
			['general-elements', 'audio'],
			['general-elements', 'shortcode'],
			['general-elements', 'html'],
			['general-elements', 'menu-anchor'],
			['general-elements', 'sidebar']
			//,
			// ['wordpress', 'wp-widget-pages'],
			// ['wordpress', 'wp-widget-calendar'],
			// ['wordpress', 'wp-widget-archives'],
			// ['wordpress', 'wp-widget-media_audio'],
			// ['wordpress', 'wp-widget-media_image'],
			// ['wordpress', 'wp-widget-media_video'],
			// ['wordpress', 'wp-widget-meta'],
			// ['wordpress', 'wp-widget-search'],
			// ['wordpress', 'wp-widget-text'],
			// ['wordpress', 'wp-widget-categories'],
			// ['wordpress', 'wp-widget-recent-posts'],
			// ['wordpress', 'wp-widget-recent-comments'],
			// ['wordpress', 'wp-widget-rss'],
			// ['wordpress', 'wp-widget-tag_cloud'],
			// ['wordpress', 'wp-widget-nav_menu'],
			// ['wordpress', 'wp-widget-embroidery-library']
		];

	_( elements ).each(function( element ) {
		QUnit.test( 'addElementFromPanel:' + element[0] + ':' + element[1], function( assert ) {
			embroideryTests.setPanelSelectedElement( element[0], element[1] );
			firstColumnView.addElementFromPanel( { at: 0 } );

			assert.equal( element[1], firstColumnView.model.get( 'elements' ).first().get( 'widgetType' ) );
		});
	});

	QUnit.test( 'Add New Section', function( assert ) {
		// Clear Page
		embroidery.getRegion( 'sections' ).currentView.collection.reset();

		// Clear History
		embroidery.history.history.getItems().reset();

		// Click on `Add section`
		pQuery( '.embroidery-add-section-button' ).click();

		var sectionsCollection = embroidery.sections.currentView.collection,
			historyItems = embroidery.history.history.getItems(),
			presetsStructureButton = pQuery( '.embroidery-add-section-inner [data-structure="10"]' );

		assert.equal( 1, presetsStructureButton.length, 'Presets is shown' );

		QUnit.module( 'Add a Section', function( hooks ) {
			presetsStructureButton.click();

			assert.ok( sectionsCollection.first(), 'Section Added' );
			assert.equal( sectionsCollection.first().get( 'elements' ).first().get( 'elType' ), 'column', 'Empty Column added' );
			assert.equal( historyItems.length, 2, 'History has one item' ); // the first items is the editing started
			assert.equal( historyItems.first().get( 'elementType' ), 'section', 'History elementType is `section`' );
			assert.equal( historyItems.first().get( 'type' ), 'add', 'History type is `add`' );
		} );

		var sectionView = embroidery.sections.currentView.children.first(),
			columnView = sectionView.children.first(),
			columnButtons = {
				trigger: columnView.$el.find( '.embroidery-editor-element-trigger' ),
				add: columnView.$el.find( '.embroidery-editor-element-add' ),
				duplicate: columnView.$el.find( '.embroidery-editor-element-duplicate' ),
				remove: columnView.$el.find( '.embroidery-editor-element-remove' )
		};

		QUnit.module( 'Check columns buttons', function( hooks ) {
			assert.equal( columnButtons.trigger.length, 1, 'Trigger Button exist' );
			assert.equal( columnButtons.add.length, 1, 'Add Button exist' );
			assert.equal( columnButtons.duplicate.length, 1, 'Duplicate Button exist' );
			assert.equal( columnButtons.remove.length, 1, 'Remove Button exist' );
		} );

		QUnit.module( 'Add a Column', function( hooks ) {
			columnButtons.add.click();

			assert.equal( sectionView.children.length, 2, 'Column was Added' );
			assert.equal( historyItems.length, 3, 'History has 2 item' ); // the first items is the editing started
			assert.equal( historyItems.first().get( 'elementType' ), 'column', 'History elementType is `column`' );
			assert.equal( historyItems.first().get( 'type' ), 'add', 'History type is `add`' );
		} );

		QUnit.module( 'Duplicate a Column', function( hooks ) {
			columnButtons.duplicate.click();

			assert.equal( sectionView.children.length, 3, 'Column was Duplicated' );
			assert.equal( historyItems.length, 4, 'History has 3 item' ); // the first items is the editing started
			assert.equal( historyItems.first().get( 'elementType' ), 'column', 'History elementType is `column`' );
			assert.equal( historyItems.first().get( 'type' ), 'duplicate', 'History type is `duplicate`' );
		} );

		QUnit.module( 'Add Heading widget', function( hooks ) {
			embroideryTests.setPanelSelectedElement( 'basic', 'heading' );
			columnView.addElementFromPanel( { at: 0 } );

			assert.equal( columnView.model.get( 'elements' ).first().get( 'widgetType' ), 'heading', 'Heading was Added' );
			assert.equal( historyItems.length, 5, 'History has 4 item' ); // the first items is the editing started
			assert.equal( historyItems.first().get( 'elementType' ), 'widget', 'History elementType is `widget`' );
			assert.equal( historyItems.first().get( 'type' ), 'add', 'History type is `add`' );
		} );
	} );
}

embroidery.on( 'preview:loaded', function() {
	window.pQuery = embroidery.$preview[0].contentWindow.jQuery;
	pQuery( embroidery.$preview[0].contentDocument ).ready( testPreview );
});
