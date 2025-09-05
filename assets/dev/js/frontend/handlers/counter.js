module.exports = function( $scope, $ ) {
	embroideryFrontend.waypoint( $scope.find( '.embroidery-counter-number' ), function() {
		var $number = $( this ),
			data = $number.data();

		var decimalDigits = data.toValue.toString().match( /\.(.*)/ );

		if ( decimalDigits ) {
			data.rounding = decimalDigits[1].length;
		}

		$number.numerator( data );
	} );
};
