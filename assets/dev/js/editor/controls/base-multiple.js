var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlBaseMultipleItemView;

ControlBaseMultipleItemView = ControlBaseDataView.extend( {

	applySavedValue: function() {
		var values = this.getControlValue(),
			$inputs = this.$( '[data-setting]' ),
			self = this;

		_.each( values, function( value, key ) {
			var $input = $inputs.filter( function() {
				return key === this.dataset.setting;
			} );

			self.setInputValue( $input, value );
		} );
	},

	getControlValue: function( key ) {
		var values = this.elementSettingsModel.get( this.model.get( 'name' ) );

		if ( ! jQuery.isPlainObject( values ) ) {
			return {};
		}

		if ( key ) {
			var value = values[ key ];

			if ( undefined === value ) {
				value = '';
			}

			return value;
		}

		return embroidery.helpers.cloneObject( values );
	},

	setValue: function( key, value ) {
		var values = this.getControlValue();

		if ( 'object' === typeof key ) {
			_.each( key, function( internalValue, internalKey ) {
				values[ internalKey ] = internalValue;
			} );
		} else {
			values[ key ] = value;
		}

		this.setSettingsModel( values );
	},

	updateElementModel: function( value, input ) {
		var key = input.dataset.setting;

		this.setValue( key, value );
	}
}, {
	// Static methods
	getStyleValue: function( placeholder, controlValue ) {
		if ( ! _.isObject( controlValue ) ) {
			return ''; // invalid
		}

		return controlValue[ placeholder ];
	}
} );

module.exports = ControlBaseMultipleItemView;
