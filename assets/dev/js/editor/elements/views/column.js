var BaseElementView = require( 'embroidery-elements/views/base' ),
	ColumnEmptyView = require( 'embroidery-elements/views/column-empty' ),
	ColumnView;

ColumnView = BaseElementView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-element-column-content' ),

	emptyView: ColumnEmptyView,

	childViewContainer: '> .embroidery-column-wrap > .embroidery-widget-wrap',

	behaviors: function() {
		var behaviors = BaseElementView.prototype.behaviors.apply( this, arguments );

		_.extend( behaviors, {
			Sortable: {
				behaviorClass: require( 'embroidery-behaviors/sortable' ),
				elChildType: 'widget'
			},
			Resizable: {
				behaviorClass: require( 'embroidery-behaviors/resizable' )
			},
			HandleDuplicate: {
				behaviorClass: require( 'embroidery-behaviors/handle-duplicate' )
			},
			HandleAddMode: {
				behaviorClass: require( 'embroidery-behaviors/duplicate' )
			}
		} );

		return embroidery.hooks.applyFilters( 'elements/column/behaviors', behaviors, this );
	},

	className: function() {
		var classes = BaseElementView.prototype.className.apply( this, arguments ),
			type = this.isInner() ? 'inner' : 'top';

		return classes + ' embroidery-column embroidery-' + type + '-column';
	},

	tagName: function() {
		return this.model.getSetting( 'html_tag' ) || 'div';
	},

	ui: function() {
		var ui = BaseElementView.prototype.ui.apply( this, arguments );

		ui.columnInner = '> .embroidery-column-wrap';

		ui.percentsTooltip = '> .embroidery-element-overlay .embroidery-column-percents-tooltip';

		return ui;
	},

	triggers: {
		'click @ui.addButton': 'click:new'
	},

	initialize: function() {
		BaseElementView.prototype.initialize.apply( this, arguments );

		this.addControlValidator( '_inline_size', this.onEditorInlineSizeInputChange );
	},

	isDroppingAllowed: function() {
		var elementView = embroidery.channels.panelElements.request( 'element:selected' );

		if ( ! elementView ) {
			return false;
		}

		var elType = elementView.model.get( 'elType' );

		if ( 'section' === elType ) {
			return ! this.isInner();
		}

		return 'widget' === elType;
	},

	getPercentsForDisplay: function() {
		var inlineSize = +this.model.getSetting( '_inline_size' ) || this.getPercentSize();

		return inlineSize.toFixed( 1 ) + '%';
	},

	changeSizeUI: function() {
		var self = this,
			columnSize = self.model.getSetting( '_column_size' );

		self.$el.attr( 'data-col', columnSize );

		_.defer( function() { // Wait for the column size to be applied
			if ( self.ui.percentsTooltip ) {
				self.ui.percentsTooltip.text( self.getPercentsForDisplay() );
			}
		} );
	},

	getPercentSize: function( size ) {
		if ( ! size ) {
			size = this.el.getBoundingClientRect().width;
		}

		return +( size / this.$el.parent().width() * 100 ).toFixed( 3 );
	},

	getSortableOptions: function() {
		return {
			connectWith: '.embroidery-widget-wrap',
			items: '> .embroidery-element'
		};
	},

	changeChildContainerClasses: function() {
		var emptyClass = 'embroidery-element-empty',
			populatedClass = 'embroidery-element-populated';

		if ( this.collection.isEmpty() ) {
			this.ui.columnInner.removeClass( populatedClass ).addClass( emptyClass );
		} else {
			this.ui.columnInner.removeClass( emptyClass ).addClass( populatedClass );
		}
	},

	// Events
	onCollectionChanged: function() {
		BaseElementView.prototype.onCollectionChanged.apply( this, arguments );

		this.changeChildContainerClasses();
	},

	onRender: function() {
		var self = this;

		BaseElementView.prototype.onRender.apply( self, arguments );

		self.changeChildContainerClasses();

		self.changeSizeUI();

		self.$el.html5Droppable( {
			items: ' > .embroidery-column-wrap > .embroidery-widget-wrap > .embroidery-element, >.embroidery-column-wrap > .embroidery-widget-wrap > .embroidery-empty-view > .embroidery-first-add',
			axis: [ 'vertical' ],
			groups: [ 'embroidery-element' ],
			isDroppingAllowed: self.isDroppingAllowed.bind( self ),
			currentElementClass: 'embroidery-html5dnd-current-element',
			placeholderClass: 'embroidery-sortable-placeholder embroidery-widget-placeholder',
			hasDraggingOnChildClass: 'embroidery-dragging-on-child',
			onDropping: function( side, event ) {
				event.stopPropagation();

				var newIndex = jQuery( this ).index();

				if ( 'bottom' === side ) {
					newIndex++;
				}

				self.addElementFromPanel( { at: newIndex } );
			}
		} );
	},

	onSettingsChanged: function( settings ) {
		BaseElementView.prototype.onSettingsChanged.apply( this, arguments );

		var changedAttributes = settings.changedAttributes();

		if ( '_column_size' in changedAttributes || '_inline_size' in changedAttributes ) {
			this.changeSizeUI();
		}
	},

	onEditorInlineSizeInputChange: function( newValue, oldValue ) {
		var errors = [],
			columnSize = this.model.getSetting( '_column_size' );

		// If there's only one column
		if ( 100 === columnSize ) {
			errors.push( 'Could not resize one column' );

			return errors;
		}

		if ( ! oldValue ) {
			oldValue = columnSize;
		}

		try {
			this._parent.resizeChild( this, +oldValue, +newValue );
		} catch ( e ) {
			if ( e.message === this._parent.errors.columnWidthTooLarge ) {
				errors.push( e.message );
			}
		}

		return errors;
	}
} );

module.exports = ColumnView;
