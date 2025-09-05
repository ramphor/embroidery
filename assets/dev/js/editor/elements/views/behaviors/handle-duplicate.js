var HandleDuplicateBehavior;

HandleDuplicateBehavior = Marionette.Behavior.extend( {

	onChildviewRequestDuplicate: function( childView ) {
		if ( this.view.isCollectionFilled() ) {
			return;
		}

		var currentIndex = this.view.collection.indexOf( childView.model ),
			newModel = childView.model.clone();

		embroidery.channels.data.trigger( 'element:before:duplicate', newModel );

		this.view.addChildModel( newModel, { at: currentIndex + 1 } );

		embroidery.channels.data.trigger( 'element:after:duplicate', newModel );
	}
} );

module.exports = HandleDuplicateBehavior;
