var ElementsHandler;

ElementsHandler = function( $ ) {
	var self = this;

	// element-type.skin-type
	var handlers = {
		// Elements
		'section': require( 'embroidery-frontend/handlers/section' ),

		// Widgets
		'accordion.default': require( 'embroidery-frontend/handlers/accordion' ),
		'alert.default': require( 'embroidery-frontend/handlers/alert' ),
		'counter.default': require( 'embroidery-frontend/handlers/counter' ),
		'progress.default': require( 'embroidery-frontend/handlers/progress' ),
		'tabs.default': require( 'embroidery-frontend/handlers/tabs' ),
		'toggle.default': require( 'embroidery-frontend/handlers/toggle' ),
		'video.default': require( 'embroidery-frontend/handlers/video' ),
		'image-carousel.default': require( 'embroidery-frontend/handlers/image-carousel' ),
		'text-editor.default': require( 'embroidery-frontend/handlers/text-editor' )
	};

	var addGlobalHandlers = function() {
		embroideryFrontend.hooks.addAction( 'frontend/element_ready/global', require( 'embroidery-frontend/handlers/global' ) );
		embroideryFrontend.hooks.addAction( 'frontend/element_ready/widget', require( 'embroidery-frontend/handlers/widget' ) );
	};

	var addElementsHandlers = function() {
		$.each( handlers, function( elementName, funcCallback ) {
			embroideryFrontend.hooks.addAction( 'frontend/element_ready/' + elementName, funcCallback );
		} );
	};

	var runElementsHandlers = function() {
		var $elements;

		if ( embroideryFrontend.isEditMode() ) {
			// Elements outside from the Preview
			$elements = jQuery( '.embroidery-element', '.embroidery:not(.embroidery-edit-mode)' );
		} else {
			$elements = $( '.embroidery-element' );
		}

		$elements.each( function() {
			self.runReadyTrigger( $( this ) );
		} );
	};

	var init = function() {
		if ( ! embroideryFrontend.isEditMode() ) {
			self.initHandlers();
		}
	};

	this.initHandlers = function() {
		addGlobalHandlers();

		addElementsHandlers();

		runElementsHandlers();
	};

	this.getHandlers = function( handlerName ) {
		if ( handlerName ) {
			return handlers[ handlerName ];
		}

		return handlers;
	};

	this.runReadyTrigger = function( $scope ) {
		var elementType = $scope.attr( 'data-element_type' );

		if ( ! elementType ) {
			return;
		}

		// Initializing the `$scope` as frontend jQuery instance
		$scope = jQuery( $scope );

		embroideryFrontend.hooks.doAction( 'frontend/element_ready/global', $scope, $ );

		var isWidgetType = ( -1 === [ 'section', 'column' ].indexOf( elementType ) );

		if ( isWidgetType ) {
			embroideryFrontend.hooks.doAction( 'frontend/element_ready/widget', $scope, $ );
		}

		embroideryFrontend.hooks.doAction( 'frontend/element_ready/' + elementType, $scope, $ );
	};

	init();
};

module.exports = ElementsHandler;
