var HandleAddDuplicateBehavior;

HandleAddDuplicateBehavior = Marionette.Behavior.extend( {

	onChildviewClickNew: function( childView ) {
		var currentIndex = childView.$el.index() + 1;

		this.addChild( { at: currentIndex } );
	},

	onRequestNew: function() {
		this.addChild();
	},

	addChild: function( options ) {
		if ( this.view.isCollectionFilled() ) {
			return;
		}

		options = options || {};

		var newItem = {
			id: embroidery.helpers.getUniqueID(),
			elType: this.view.getChildType()[0],
			settings: {},
			elements: []
		};

		embroidery.channels.data.trigger( 'element:before:add', newItem );

		this.view.addChildModel( newItem, options );

		embroidery.channels.data.trigger( 'element:after:add', newItem );
	}
} );

module.exports = HandleAddDuplicateBehavior;
