var ControlBaseView;

ControlBaseView = Marionette.CompositeView.extend( {
	ui: function() {
		return {
			controlTitle: '.embroidery-control-title'
		};
	},

	behaviors: function() {
		var behaviors = {};

		return embroidery.hooks.applyFilters( 'controls/base/behaviors', behaviors, this );
	},

	getBehavior: function( name ) {
		return this._behaviors[ Object.keys( this.behaviors() ).indexOf( name ) ];
	},

	className: function() {
		// TODO: Any better classes for that?
		var classes = 'embroidery-control embroidery-control-' + this.model.get( 'name' ) + ' embroidery-control-type-' + this.model.get( 'type' ),
			modelClasses = this.model.get( 'classes' ),
			responsive = this.model.get( 'responsive' );

		if ( ! _.isEmpty( modelClasses ) ) {
			classes += ' ' + modelClasses;
		}

		if ( ! _.isEmpty( responsive ) ) {
			classes += ' embroidery-control-responsive-' + responsive.max;
		}

		return classes;
	},

	templateHelpers: function() {
		var controlData = {
			_cid: this.model.cid
		};

		return {
			data: _.extend( {}, this.model.toJSON(), controlData )
		};
	},

	getTemplate: function() {
		return Marionette.TemplateCache.get( '#tmpl-embroidery-control-' + this.model.get( 'type' ) + '-content' );
	},

	initialize: function( options ) {
		this.elementSettingsModel = options.elementSettingsModel;

		var controlType = this.model.get( 'type' ),
			controlSettings = jQuery.extend( true, {}, embroidery.config.controls[ controlType ], this.model.attributes );

		this.model.set( controlSettings );

		this.listenTo( this.elementSettingsModel, 'change', this.toggleControlVisibility );
	},

	toggleControlVisibility: function() {
		var isVisible = embroidery.helpers.isActiveControl( this.model, this.elementSettingsModel.attributes );

		this.$el.toggleClass( 'embroidery-hidden-control', ! isVisible );

		embroidery.channels.data.trigger( 'scrollbar:update' );
	},

	onRender: function() {
		var layoutType = this.model.get( 'label_block' ) ? 'block' : 'inline',
			showLabel = this.model.get( 'show_label' ),
			elClasses = 'embroidery-label-' + layoutType;

		elClasses += ' embroidery-control-separator-' + this.model.get( 'separator' );

		if ( ! showLabel ) {
			elClasses += ' embroidery-control-hidden-label';
		}

		this.$el.addClass( elClasses );

		this.toggleControlVisibility();
	}
} );

module.exports = ControlBaseView;
