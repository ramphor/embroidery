var SectionView = require( 'embroidery-elements/views/section' ),
	BaseContainer = require( 'embroidery-views/base-container' ),
	BaseSectionsContainerView;

BaseSectionsContainerView = BaseContainer.extend( {
	childView: SectionView,

	behaviors: function() {
		var behaviors = {
			Sortable: {
				behaviorClass: require( 'embroidery-behaviors/sortable' ),
				elChildType: 'section'
			},
			HandleDuplicate: {
				behaviorClass: require( 'embroidery-behaviors/handle-duplicate' )
			},
			HandleAddMode: {
				behaviorClass: require( 'embroidery-behaviors/duplicate' )
			}
		};

		return embroidery.hooks.applyFilters( 'elements/base-section-container/behaviors', behaviors, this );
	},

	getSortableOptions: function() {
		return {
			handle: '> .embroidery-element-overlay .embroidery-editor-section-settings .embroidery-editor-element-trigger',
			items: '> .embroidery-section'
		};
	},

	getChildType: function() {
		return [ 'section' ];
	},

	isCollectionFilled: function() {
		return false;
	},

	initialize: function() {
		this
			.listenTo( this.collection, 'add remove reset', this.onCollectionChanged )
			.listenTo( embroidery.channels.panelElements, 'element:drag:start', this.onPanelElementDragStart )
			.listenTo( embroidery.channels.panelElements, 'element:drag:end', this.onPanelElementDragEnd );
	},

	addSection: function( properties, options ) {
		var newSection = {
			id: embroidery.helpers.getUniqueID(),
			elType: 'section',
			settings: {},
			elements: []
		};

		if ( properties ) {
			_.extend( newSection, properties );
		}

		var newModel = this.addChildModel( newSection, options );

		return this.children.findByModelCid( newModel.cid );
	},

	onCollectionChanged: function() {
		embroidery.saver.setFlagEditorChange( true );
	},

	onPanelElementDragStart: function() {
		embroidery.helpers.disableElementEvents( this.$el.find( 'iframe' ) );
	},

	onPanelElementDragEnd: function() {
		embroidery.helpers.enableElementEvents( this.$el.find( 'iframe' ) );
	}
} );

module.exports = BaseSectionsContainerView;
