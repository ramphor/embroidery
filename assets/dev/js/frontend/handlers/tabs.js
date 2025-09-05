var TabsModule = require( 'embroidery-frontend/handlers/base-tabs' );

module.exports = function( $scope ) {
	new TabsModule( {
		$element: $scope,
		toggleSelf: false
	} );
};
