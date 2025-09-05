var BaseSettingsModel = require( 'embroidery-elements/models/base-settings' ),
	ControlsCSSParser = require( 'embroidery-editor-utils/controls-css-parser' ),
	Validator = require( 'embroidery-validator/base' ),
	BaseContainer = require( 'embroidery-views/base-container' ),
	BaseElementView;

BaseElementView = BaseContainer.extend( {
	tagName: 'div',

	controlsCSSParser: null,

	toggleEditTools: true,

	allowRender: true,

	renderAttributes: {},

	className: function() {
		return 'embroidery-element embroidery-element-edit-mode ' + this.getElementUniqueID();
	},

	attributes: function() {
		var type = this.model.get( 'elType' );

		if ( 'widget'  === type ) {
			type = this.model.get( 'widgetType' );
		}

		return {
			'data-id': this.getID(),
			'data-element_type': type
		};
	},

	ui: function() {
		return {
			triggerButton: '> .embroidery-element-overlay .embroidery-editor-element-trigger',
			duplicateButton: '> .embroidery-element-overlay .embroidery-editor-element-duplicate',
			removeButton: '> .embroidery-element-overlay .embroidery-editor-element-remove',
			saveButton: '> .embroidery-element-overlay .embroidery-editor-element-save',
			settingsList: '> .embroidery-element-overlay .embroidery-editor-element-settings',
			addButton: '> .embroidery-element-overlay .embroidery-editor-element-add'
		};
	},

	behaviors: function() {
		var behaviors = {};

		return embroidery.hooks.applyFilters( 'elements/base/behaviors', behaviors, this );
	},

	getBehavior: function( name ) {
		return this._behaviors[ Object.keys( this.behaviors() ).indexOf( name ) ];
	},

	events: function() {
		return {
			'click @ui.removeButton': 'onClickRemove',
			'click @ui.saveButton': 'onClickSave',
			'click @ui.duplicateButton': 'onClickDuplicate',
			'click @ui.triggerButton': 'onClickEdit'
		};
	},

	getElementType: function() {
		return this.model.get( 'elType' );
	},

	getIDInt: function() {
		return parseInt( this.getID(), 16 );
	},

	getChildType: function() {
		return embroidery.helpers.getElementChildType( this.getElementType() );
	},

	getChildView: function( model ) {
		var ChildView,
			elType = model.get( 'elType' );

		if ( 'section' === elType ) {
			ChildView = require( 'embroidery-elements/views/section' );
		} else if ( 'column' === elType ) {
			ChildView = require( 'embroidery-elements/views/column' );
		} else {
			ChildView = embroidery.modules.WidgetView;
		}

		return embroidery.hooks.applyFilters( 'element/view', ChildView, model, this );
	},

	// TODO: backward compatibility method since 1.8.0
	templateHelpers: function() {
		var templateHelpers = BaseContainer.prototype.templateHelpers.apply( this, arguments );

		return jQuery.extend( templateHelpers, {
			editModel: this.getEditModel() // @deprecated. Use view.getEditModel() instead.
		} );
	},

	getTemplateType: function() {
		return 'js';
	},

	getEditModel: function() {
		return this.model;
	},

	initialize: function() {
		// grab the child collection from the parent model
		// so that we can render the collection as children
		// of this parent element
		this.collection = this.model.get( 'elements' );

		if ( this.collection ) {
			this.listenTo( this.collection, 'add remove reset', this.onCollectionChanged, this );
		}

		var editModel = this.getEditModel();

		this.listenTo( editModel.get( 'settings' ), 'change', this.onSettingsChanged, this );
		this.listenTo( editModel.get( 'editSettings' ), 'change', this.onEditSettingsChanged, this );

		this.initControlsCSSParser();
	},

	edit: function() {
		embroidery.getPanelView().openEditor( this.getEditModel(), this );
	},

	addElementFromPanel: function( options ) {
		var elementView = embroidery.channels.panelElements.request( 'element:selected' );

		var itemData = {
			id: embroidery.helpers.getUniqueID(),
			elType: elementView.model.get( 'elType' )
		};

		if ( 'widget' === itemData.elType ) {
			itemData.widgetType = elementView.model.get( 'widgetType' );
		} else if ( 'section' === itemData.elType ) {
			itemData.elements = [];
			itemData.isInner = true;
		} else {
			return;
		}

		var customData = elementView.model.get( 'custom' );

		if ( customData ) {
			_.extend( itemData, customData );
		}

		embroidery.channels.data.trigger( 'element:before:add', itemData );

		var newView = this.addChildElement( itemData, options );

		if ( 'section' === newView.getElementType() && newView.isInner() ) {
			newView.addEmptyColumn();
		}

		embroidery.channels.data.trigger( 'element:after:add', itemData );

	},

	addControlValidator: function( controlName, validationCallback ) {
		validationCallback = validationCallback.bind( this );

		var validator = new Validator( { customValidationMethod: validationCallback } ),
			validators = this.getEditModel().get( 'settings' ).validators;

		if ( ! validators[ controlName ] ) {
			validators[ controlName ] = [];
		}

		validators[ controlName ].push( validator );
	},

	addRenderAttribute: function( element, key, value, overwrite ) {
		var self = this;

		if ( 'object' === typeof element ) {
			jQuery.each( element, function( elementKey ) {
				self.addRenderAttribute( elementKey, this, null, overwrite );
			} );

			return self;
		}

		if ( 'object' === typeof key ) {
			jQuery.each( key, function( attributeKey ) {
				self.addRenderAttribute( element, attributeKey, this, overwrite );
			} );

			return self;
		}

		if ( ! self.renderAttributes[ element ] ) {
			self.renderAttributes[ element ] = {};
		}

		if ( ! self.renderAttributes[ element ][ key ] ) {
			self.renderAttributes[ element ][ key ] = [];
		}

		if ( ! Array.isArray( value ) ) {
			value = [ value ];
		}

		if ( overwrite ) {
			self.renderAttributes[ element ][ key ] = value;
		} else {
			self.renderAttributes[ element ][ key ] = self.renderAttributes[ element ][ key ].concat( value );
		}
	},

	getRenderAttributeString: function( element ) {
		if ( ! this.renderAttributes[ element ] ) {
			return '';
		}

		var renderAttributes = this.renderAttributes[ element ],
			attributes = [];

		jQuery.each( renderAttributes, function( attributeKey ) {
			attributes.push( attributeKey + '="' + _.escape( this.join( ' ' ) ) + '"' );
		} );

		return attributes.join( ' ' );
	},

	isCollectionFilled: function() {
		return false;
	},

	isInner: function() {
		return !! this.model.get( 'isInner' );
	},

	initControlsCSSParser: function() {
		this.controlsCSSParser = new ControlsCSSParser( { id: this.model.cid } );
	},

	enqueueFonts: function() {
		var editModel = this.getEditModel(),
			settings = editModel.get( 'settings' );

		_.each( settings.getFontControls(), function( control ) {
			var fontFamilyName = editModel.getSetting( control.name );

			if ( _.isEmpty( fontFamilyName ) ) {
				return;
			}

			embroidery.helpers.enqueueFont( fontFamilyName );
		} );
	},

	renderStyles: function( settings ) {
		if ( ! settings ) {
			settings = this.getEditModel().get( 'settings' );
		}

		this.controlsCSSParser.stylesheet.empty();

		this.controlsCSSParser.addStyleRules( settings.getStyleControls(), settings.attributes, this.getEditModel().get( 'settings' ).controls, [ /{{ID}}/g, /{{WRAPPER}}/g ], [ this.getID(), '#embroidery .' + this.getElementUniqueID() ] );

		this.controlsCSSParser.addStyleToDocument();

		var extraCSS = embroidery.hooks.applyFilters( 'editor/style/styleText', '', this );

		if ( extraCSS ) {
			this.controlsCSSParser.elements.$stylesheetElement.append( extraCSS );
		}
	},

	renderCustomClasses: function() {
		var self = this;

		var settings = self.getEditModel().get( 'settings' ),
			classControls = settings.getClassControls();

		// Remove all previous classes
		_.each( classControls, function( control ) {
			var previousClassValue = settings.previous( control.name );

			if ( control.classes_dictionary ) {
				if ( undefined !== control.classes_dictionary[ previousClassValue ] ) {
					previousClassValue = control.classes_dictionary[ previousClassValue ];
				}
			}

			self.$el.removeClass( control.prefix_class + previousClassValue );
		} );

		// Add new classes
		_.each( classControls, function( control ) {
			var value = settings.attributes[ control.name ],
				classValue = value;

			if ( control.classes_dictionary ) {
				if ( undefined !== control.classes_dictionary[ value ] ) {
					classValue = control.classes_dictionary[ value ];
				}
			}

			var isVisible = embroidery.helpers.isActiveControl( control, settings.attributes );

			if ( isVisible && ! _.isEmpty( classValue ) ) {
				self.$el
					.addClass( control.prefix_class + classValue )
					.addClass( _.result( self, 'className' ) );
			}
		} );
	},

	renderCustomElementID: function() {
		var customElementID = this.getEditModel().get( 'settings' ).get( '_element_id' );

		this.$el.attr( 'id', customElementID );
	},

	getModelForRender: function() {
		return embroidery.hooks.applyFilters( 'element/templateHelpers/editModel', this.getEditModel(), this );
	},

	renderUIOnly: function() {
		var editModel = this.getModelForRender();

		this.renderStyles( editModel.get( 'settings' ) );
		this.renderCustomClasses();
		this.renderCustomElementID();
		this.enqueueFonts();
	},

	renderUI: function() {
		this.renderStyles();
		this.renderCustomClasses();
		this.renderCustomElementID();
		this.enqueueFonts();
	},

	runReadyTrigger: function() {
		var self = this;

		_.defer( function() {
			embroideryFrontend.elementsHandler.runReadyTrigger( self.$el );
		} );
	},

	getID: function() {
		return this.model.get( 'id' );
	},

	getElementUniqueID: function() {
		return 'embroidery-element-' + this.getID();
	},

	duplicate: function() {
		this.trigger( 'request:duplicate' );
	},

	renderOnChange: function( settings ) {
		if ( ! this.allowRender ) {
			return;
		}

		// Make sure is correct model
		if ( settings instanceof BaseSettingsModel ) {
			var hasChanged = settings.hasChanged(),
				isContentChanged = ! hasChanged,
				isRenderRequired = ! hasChanged;

			_.each( settings.changedAttributes(), function( settingValue, settingKey ) {
				var control = settings.getControl( settingKey );

				if ( '_column_size' === settingKey ) {
					isRenderRequired = true;
					return;
				}

				if ( ! control ) {
					isRenderRequired = true;
					isContentChanged = true;
					return;
				}

				if ( 'none' !== control.render_type ) {
					isRenderRequired = true;
				}

				if ( -1 !== [ 'none', 'ui' ].indexOf( control.render_type ) ) {
					return;
				}

				if ( 'template' === control.render_type || ! settings.isStyleControl( settingKey ) && ! settings.isClassControl( settingKey ) && '_element_id' !== settingKey ) {
					isContentChanged = true;
				}
			} );

			if ( ! isRenderRequired ) {
				return;
			}

			if ( ! isContentChanged ) {
				this.renderUIOnly();
				return;
			}
		}

		// Re-render the template
		var templateType = this.getTemplateType(),
			editModel = this.getEditModel();

		if ( 'js' === templateType ) {
			this.getEditModel().setHtmlCache();
			this.render();
			editModel.renderOnLeave = true;
		} else {
			editModel.renderRemoteServer();
		}
	},

	onBeforeRender: function() {
		this.renderAttributes = {};
	},

	onRender: function() {
		var self = this;

		self.renderUI();

		self.runReadyTrigger();

		if ( self.toggleEditTools ) {
			var triggerButton = self.ui.triggerButton;

			self.ui.settingsList.hoverIntent( function() {
				triggerButton.addClass( 'embroidery-active' );
			}, function() {
				triggerButton.removeClass( 'embroidery-active' );
			}, { timeout: 500 } );
		}
	},

	onCollectionChanged: function() {
		embroidery.saver.setFlagEditorChange( true );
	},

	onEditSettingsChanged: function( changedModel ) {
		embroidery.channels.editor
			.trigger( 'change:editSettings', changedModel, this );
	},

	onSettingsChanged: function( changedModel ) {
		embroidery.saver.setFlagEditorChange( true );

		this.renderOnChange( changedModel );
	},

	onClickEdit: function( event ) {
		if ( ! jQuery( event.target ).closest( '.embroidery-clickable' ).length ) {
			event.preventDefault();

			event.stopPropagation();
		}

		var activeMode = embroidery.channels.dataEditMode.request( 'activeMode' );

		if ( 'edit' !== activeMode ) {
			return;
		}

		this.edit();
	},

	onClickDuplicate: function( event ) {
		event.preventDefault();
		event.stopPropagation();

		this.duplicate();
	},

	removeElement: function() {
		embroidery.channels.data.trigger( 'element:before:remove', this.model );

		var parent = this._parent;

		parent.isManualRemoving = true;

		this.model.destroy();

		parent.isManualRemoving = false;

		embroidery.channels.data.trigger( 'element:after:remove', this.model );
	},

	onClickRemove: function( event ) {
		event.preventDefault();
		event.stopPropagation();
		this.removeElement();
	},

	onClickSave: function( event ) {
		event.preventDefault();

		var model = this.model;

		embroidery.templates.startModal( {
			onReady: function() {
				embroidery.templates.getLayout().showSaveTemplateView( model );
			}
		} );
	},

	onDestroy: function() {
		this.controlsCSSParser.removeStyleFromDocument();
	}
} );

module.exports = BaseElementView;
