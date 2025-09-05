var HistoryCollection = require( './collection' ),
	HistoryItem = require( './item' ),
	ElementHistoryBehavior = require( './element-behavior' ),
	CollectionHistoryBehavior = require( './collection-behavior' );

var	Manager = function() {
	var self = this,
		currentItemID = null,
		items = new HistoryCollection(),
		editorSaved = false,
		active = true;

	var translations = {
		add: embroidery.translate( 'added' ),
		remove: embroidery.translate( 'removed' ),
		change: embroidery.translate( 'edited' ),
		move: embroidery.translate( 'moved' ),
		duplicate: embroidery.translate( 'duplicated' )
	};

	var addBehaviors = function( behaviors ) {
		behaviors.ElementHistory = {
			behaviorClass: ElementHistoryBehavior
		};

		behaviors.CollectionHistory = {
			behaviorClass: CollectionHistoryBehavior
		};

		return behaviors;
	};

	var addCollectionBehavior = function( behaviors ) {
		behaviors.CollectionHistory = {
			behaviorClass: CollectionHistoryBehavior
		};

		return behaviors;
	};

	var getActionLabel = function( itemData ) {
		if ( translations[ itemData.type ] ) {
			return translations[ itemData.type ];
		}

		return itemData.type;
	};

	var navigate = function( isRedo ) {
		var currentItem = items.find( function( model ) {
				return 'not_applied' ===  model.get( 'status' );
			} ),
			currentItemIndex = items.indexOf( currentItem ),
			requiredIndex = isRedo ? currentItemIndex - 1 : currentItemIndex + 1;

		if ( ( ! isRedo && ! currentItem ) || requiredIndex < 0  || requiredIndex >= items.length ) {
			return;
		}

		self.doItem( requiredIndex );
	};

	var addHotKeys = function() {
		var H_KEY = 72,
			Z_KEY = 90;

		embroidery.hotKeys.addHotKeyHandler( Z_KEY, 'historyNavigation', {
			isWorthHandling: function( event ) {
				return items.length && ! jQuery( event.target ).is( 'input, textarea, [contenteditable=true]' );
			},
			handle: function( event ) {
				navigate( Z_KEY === event.which && event.shiftKey );
			}
		} );

		embroidery.hotKeys.addHotKeyHandler( H_KEY, 'showHistoryPage', {
			isWorthHandling: function( event ) {
				return embroidery.hotKeys.isControlEvent( event ) && event.shiftKey;
			},
			handle: function() {
				embroidery.getPanelView().setPage( 'historyPage' );
			}
		} );
	};

	var onPanelSave = function() {
		if ( items.length >= 2 ) {
			// Check if it's a save after made changes, `items.length - 1` is the `Editing Started Item
			var firstEditItem = items.at( items.length - 2 );
			editorSaved = ( 'not_applied' === firstEditItem.get( 'status' ) );
		}
	};

	var init = function() {
		addHotKeys();

		embroidery.hooks.addFilter( 'elements/base/behaviors', addBehaviors );
		embroidery.hooks.addFilter( 'elements/base-section-container/behaviors', addCollectionBehavior );

		embroidery.channels.data
			.on( 'drag:before:update', self.startMovingItem )
			.on( 'drag:after:update', self.endItem )

			.on( 'element:before:add', self.startAddElement )
			.on( 'element:after:add', self.endItem )

			.on( 'element:before:remove', self.startRemoveElement )
			.on( 'element:after:remove', self.endItem )

			.on( 'element:before:duplicate', self.startDuplicateElement )
			.on( 'element:after:duplicate', self.endItem )

			.on( 'section:before:drop', self.startDropElement )
			.on( 'section:after:drop', self.endItem )

			.on( 'template:before:insert', self.startInsertTemplate )
			.on( 'template:after:insert', self.endItem );

		embroidery.channels.editor.on( 'saved', onPanelSave );
	};

	this.setActive = function( value ) {
		active = value;
	};

	this.getActive = function() {
		return active;
	};

	this.getItems = function() {
		return items;
	};

	this.startItem = function( itemData ) {
		currentItemID = this.addItem( itemData );
	};

	this.endItem = function() {
		currentItemID = null;
	};

	this.isItemStarted = function() {
		return null !== currentItemID;
	};

	this.addItem = function( itemData ) {
		if ( ! this.getActive() ) {
			return;
		}

		if ( ! items.length ) {
			items.add( {
				status: 'not_applied',
				title: embroidery.translate( 'editing_started' ),
				subTitle: '',
				action: '',
				editing_started: true
			} );
		}

		// Remove old applied items from top of list
		while ( items.length && 'applied' === items.first().get( 'status' ) ) {
			items.shift();
		}

		var id = currentItemID ? currentItemID : new Date().getTime();

		var	currentItem = items.findWhere( {
			id: id
		} );

		if ( ! currentItem ) {
			currentItem = new HistoryItem( {
				id: id,
				title: itemData.title,
				subTitle: itemData.subTitle,
				action: getActionLabel( itemData ),
				type: itemData.type,
				elementType: itemData.elementType
			} );

			self.startItemTitle = '';
			self.startItemAction = '';
		}

		var position = 0;

		// Temp fix. On move a column - insert the `remove` subItem before the section changes subItem.
		// In a multi columns section - the structure has been changed,
		// In a one column section - it's filled with an empty column,
		// The order is important for the `redoItem`, that needed to change the section first
		// and only after that - to remove the column.
		if ( 'column' === itemData.elementType && 'remove' === itemData.type && 'column' === currentItem.get( 'elementType' ) ) {
			position = 1;
		}

		currentItem.get( 'items' ).add( itemData, { at: position } );

		items.add( currentItem, { at: 0 } );

		var panel = embroidery.getPanelView();

		if ( 'historyPage' === panel.getCurrentPageName() ) {
			panel.getCurrentPageView().render();
		}

		return id;
	};

	this.doItem = function( index ) {
		// Don't track while restore the item
		this.setActive( false );

		var item = items.at( index );

		if ( 'not_applied' === item.get( 'status' ) ) {
			this.undoItem( index );
		} else {
			this.redoItem( index );
		}

		this.setActive( true );

		var panel = embroidery.getPanelView(),
			panelPage = panel.getCurrentPageView(),
			viewToScroll;

		if ( 'editor' === panel.getCurrentPageName() ) {
			if ( panelPage.getOption( 'editedElementView' ).isDestroyed ) {
				// If the the element isn't exist - show the history panel
				panel.setPage( 'historyPage' );
			} else {
				// If element exist - render again, maybe the settings has been changed
				viewToScroll = panelPage.getOption( 'editedElementView' );
			}
		} else {
			if ( 'historyPage' === panel.getCurrentPageName() ) {
				panelPage.render();
			}

			// Try scroll to affected element.
			if ( item instanceof Backbone.Model && item.get( 'items' ).length  ) {
				var oldView = item.get( 'items' ).first().get( 'history' ).behavior.view;
				if ( oldView.model ) {
					viewToScroll = self.findView( oldView.model.get( 'id' ) ) ;
				}
			}
		}

		if ( viewToScroll && ! embroidery.helpers.isInViewport( viewToScroll.$el[0], embroidery.$previewContents.find( 'html' )[0] ) ) {
			embroidery.helpers.scrollToView( viewToScroll );
		}

		if ( item.get( 'editing_started' ) ) {
			if ( ! editorSaved ) {
				embroidery.saver.setFlagEditorChange( false );
			}
		}
	};

	this.undoItem = function( index ) {
		var item;

		for ( var stepNum = 0; stepNum < index; stepNum++ ) {
			item = items.at( stepNum );

			if ( 'not_applied' === item.get( 'status' ) ) {
				item.get( 'items' ).each( function( subItem ) {
					var history = subItem.get( 'history' );

					if ( history ) { /* type duplicate first items hasn't history */
						history.behavior.restore( subItem );
					}
				} );

				item.set( 'status', 'applied' );
			}
		}
	};

	this.redoItem = function( index ) {
		for ( var stepNum = items.length - 1; stepNum >= index; stepNum-- ) {
			var item = items.at( stepNum );

			if ( 'applied' === item.get( 'status' ) ) {
				var reversedSubItems = _.toArray( item.get( 'items' ).models ).reverse();

				_( reversedSubItems ).each( function( subItem ) {
					var history = subItem.get( 'history' );

					if ( history ) { /* type duplicate first items hasn't history */
						history.behavior.restore( subItem, true );
					}
				} );

				item.set( 'status', 'not_applied' );
			}
		}
	};

	this.getModelLabel = function( model ) {
		if ( ! ( model instanceof Backbone.Model ) ) {
			model = new Backbone.Model( model );
		}

		return embroidery.getElementData( model ).title;
	};

	this.findView = function( modelID, views ) {
		var self = this,
			founded = false;

		if ( ! views ) {
			views = embroidery.sections.currentView.children;
		}

		_.each( views._views, function( view ) {
			if ( founded ) {
				return;
			}
			// Widget global used getEditModel
			var model = view.getEditModel ? view.getEditModel() : view.model;

			if ( modelID === model.get( 'id' ) ) {
				founded = view;
			} else if ( view.children && view.children.length ) {
				founded = self.findView( modelID, view.children );
			}
		} );

		return founded;
	};

	this.startMovingItem = function( model ) {
		embroidery.history.history.startItem( {
			type: 'move',
			title: self.getModelLabel( model ),
			elementType: model.get( 'elType' )
		} );
	};

	this.startInsertTemplate = function( model ) {
		embroidery.history.history.startItem( {
			type: 'add',
			title: embroidery.translate( 'template' ),
			subTitle: model.get( 'title' ),
			elementType: 'template'
		} );
	};

	this.startDropElement = function() {
		var elementView = embroidery.channels.panelElements.request( 'element:selected' );
		embroidery.history.history.startItem( {
			type: 'add',
			title: self.getModelLabel( elementView.model ),
			elementType: elementView.model.get( 'widgetType' ) || elementView.model.get( 'elType' )
		} );
	};

	this.startAddElement = function( model ) {
		embroidery.history.history.startItem( {
			type: 'add',
			title: self.getModelLabel( model ),
			elementType: model.elType
		} );
	};

	this.startDuplicateElement = function( model ) {
		embroidery.history.history.startItem( {
			type: 'duplicate',
			title: self.getModelLabel( model ),
			elementType: model.get( 'elType' )
		} );
	};

	this.startRemoveElement = function( model ) {
		embroidery.history.history.startItem( {
			type: 'remove',
			title: self.getModelLabel( model ),
			elementType: model.get( 'elType' )
		} );
	};

	init();
};

module.exports = new Manager();
