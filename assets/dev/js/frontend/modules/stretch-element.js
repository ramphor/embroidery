var ViewModule = require( '../../utils/view-module' );

module.exports = ViewModule.extend( {
	getDefaultSettings: function() {
		return {
			element: null,
			direction: embroideryFrontend.config.is_rtl ? 'right' : 'left',
			selectors: {
				container: window
			}
		};
	},

	getDefaultElements: function() {
		return {
			$element: jQuery( this.getSettings( 'element' ) )
		};
	},

	stretch: function() {
		var containerSelector = this.getSettings( 'selectors.container' ),
			$element = this.elements.$element,
			$container = jQuery( containerSelector ),
			isSpecialContainer = window !== $container[0];

		this.reset();

		var containerWidth = $container.outerWidth(),
			elementWidth = $element.outerWidth(),
			elementOffset = $element.offset().left,
			correctOffset = elementOffset;

		if ( isSpecialContainer ) {
			var containerOffset = $container.offset().left;

			if ( elementOffset > containerOffset ) {
				correctOffset = elementOffset - containerOffset;
			} else {
				correctOffset = 0;
			}
		}

		if ( embroideryFrontend.config.is_rtl ) {
			correctOffset = containerWidth - ( elementWidth + correctOffset );
		}

		var css = {};

		css.width = containerWidth + 'px';

		css[ this.getSettings( 'direction' ) ] = -correctOffset + 'px';

		$element.css( css );
	},

	reset: function() {
		var css = {};

		css.width = 'auto';

		css[ this.getSettings( 'direction' ) ] = 0;

		this.elements.$element.css( css );
	}
} );
