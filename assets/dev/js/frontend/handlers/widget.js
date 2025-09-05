module.exports = function( $scope, $ ) {
	if ( ! embroideryFrontend.isEditMode() ) {
		return;
	}

	if ( $scope.hasClass( 'embroidery-widget-edit-disabled' ) ) {
		return;
	}

	$scope.find( '.embroidery-element' ).each( function() {
		embroideryFrontend.elementsHandler.runReadyTrigger( $( this ) );
	} );
};
