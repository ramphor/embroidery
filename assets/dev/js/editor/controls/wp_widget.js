var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlWPWidgetItemView;

ControlWPWidgetItemView = ControlBaseDataView.extend( {
	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.form = 'form';
		ui.loading = '.wp-widget-form-loading';

		return ui;
	},

	events: function() {
		return {
			'keyup @ui.form :input': 'onFormChanged',
			'change @ui.form :input': 'onFormChanged'
		};
	},

	onFormChanged: function() {
		var idBase = 'widget-' + this.model.get( 'id_base' ),
			settings = this.ui.form.embroiderySerializeObject()[ idBase ].REPLACE_TO_ID;

		this.setValue( settings );
	},

	onReady: function() {
		var self = this;

		embroidery.ajax.send( 'editor_get_wp_widget_form', {
			data: {
				// Fake Widget ID
				id: self.model.cid,
				widget_type: self.model.get( 'widget' ),
				data: JSON.stringify( self.elementSettingsModel.toJSON() )
			},
			success: function( data ) {
				self.ui.form.html( data );
				// WP >= 4.8
				if ( wp.textWidgets ) {
					self.ui.form.addClass( 'open' );
					var event = new jQuery.Event( 'widget-added' );
					wp.textWidgets.handleWidgetAdded( event, self.ui.form );
					wp.mediaWidgets.handleWidgetAdded( event, self.ui.form );

					// WP >= 4.9
					if ( wp.customHtmlWidgets ) {
						wp.customHtmlWidgets.handleWidgetAdded( event, self.ui.form );
					}
				}

				embroidery.hooks.doAction( 'panel/widgets/' + self.model.get( 'widget' ) + '/controls/wp_widget/loaded', self );
			}
		} );
	}
} );

module.exports = ControlWPWidgetItemView;
