module.exports = function( $scope, $ ) {
	embroideryFrontend.waypoint( $scope.find( '.embroidery-progress-bar' ), function() {
		var $progressbar = $( this );

		$progressbar.css( 'width', $progressbar.data( 'max' ) + '%' );
	} );
};
