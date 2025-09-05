module.exports = function( $scope, $ ) {
	$scope.find( '.embroidery-alert-dismiss' ).on( 'click', function() {
		$( this ).parent().fadeOut();
	} );
};
