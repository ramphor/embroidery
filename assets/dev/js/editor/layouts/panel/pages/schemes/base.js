var childViewTypes = {
		color: require( 'embroidery-panel/pages/schemes/items/color' ),
		typography: require( 'embroidery-panel/pages/schemes/items/typography' )
	},
	PanelSchemeBaseView;

PanelSchemeBaseView = Marionette.CompositeView.extend( {
	id: function() {
		return 'embroidery-panel-scheme-' + this.getType();
	},

	className: function() {
		return 'embroidery-panel-scheme embroidery-panel-scheme-' + this.getUIType();
	},

	childViewContainer: '.embroidery-panel-scheme-items',

	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-embroidery-panel-schemes-' + this.getType() );
	},

	getChildView: function() {
		return childViewTypes[ this.getUIType() ];
	},

	getUIType: function() {
		return this.getType();
	},

	ui: function() {
		return {
			saveButton: '.embroidery-panel-scheme-save .embroidery-button',
			discardButton: '.embroidery-panel-scheme-discard .embroidery-button',
			resetButton: '.embroidery-panel-scheme-reset .embroidery-button'
		};
	},

	events: function() {
		return {
			'click @ui.saveButton': 'saveScheme',
			'click @ui.discardButton': 'discardScheme',
			'click @ui.resetButton': 'setDefaultScheme'
		};
	},

	initialize: function() {
		this.model = new Backbone.Model();

		this.resetScheme();
	},

	getType: function() {},

	getScheme: function() {
		return embroidery.schemes.getScheme( this.getType() );
	},

	changeChildrenUIValues: function( schemeItems ) {
		var self = this;

		_.each( schemeItems, function( value, key ) {
			var model = self.collection.findWhere( { key: key } ),
				childView = self.children.findByModelCid( model.cid );

			childView.changeUIValue( value );
		} );
	},

	discardScheme: function() {
		embroidery.schemes.resetSchemes( this.getType() );

		this.onSchemeChange();

		this.ui.saveButton.prop( 'disabled', true );

		this._renderChildren();
	},

	setSchemeValue: function( key, value ) {
		embroidery.schemes.setSchemeValue( this.getType(), key, value );

		this.onSchemeChange();
	},

	saveScheme: function() {
		embroidery.schemes.saveScheme( this.getType() );

		this.ui.saveButton.prop( 'disabled', true );

		this.resetScheme();

		this._renderChildren();
	},

	setDefaultScheme: function() {
		var defaultScheme = embroidery.config.default_schemes[ this.getType() ].items;

		this.changeChildrenUIValues( defaultScheme );
	},

	resetItems: function() {
		this.model.set( 'items', this.getScheme().items );
	},

	resetCollection: function() {
		var self = this,
			items = self.model.get( 'items' );

		self.collection = new Backbone.Collection();

		_.each( items, function( item, key ) {
			item.type = self.getType();
			item.key = key;

			self.collection.add( item );
		} );
	},

	resetScheme: function() {
		this.resetItems();
		this.resetCollection();
	},

	onSchemeChange: function() {
		embroidery.schemes.printSchemesStyle();
	},

	onChildviewValueChange: function( childView, newValue ) {
		this.ui.saveButton.removeProp( 'disabled' );

		this.setSchemeValue( childView.model.get( 'key' ), newValue );
	}
} );

module.exports = PanelSchemeBaseView;
