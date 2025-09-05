module.exports = Marionette.ItemView.extend( {
	options: {
		activeClass: 'embroidery-active'
	},

	template: '#tmpl-embroidery-template-library-header-menu',

	id: 'embroidery-template-library-header-menu',

	ui: {
		menuItems: '.embroidery-template-library-menu-item'
	},

	events: {
		'click @ui.menuItems': 'onMenuItemClick'
	},

	$activeItem: null,

	activateMenuItem: function( $item ) {
		var activeClass = this.getOption( 'activeClass' );

		if ( this.$activeItem === $item ) {
			return;
		}

		if ( this.$activeItem ) {
			this.$activeItem.removeClass( activeClass );
		}

		$item.addClass( activeClass );

		this.$activeItem = $item;
	},

	onRender: function() {
		var currentSource = embroidery.templates.getFilter( 'source' ),
			$sourceItem = this.ui.menuItems.filter( '[data-template-source="' + currentSource + '"]' );

		this.activateMenuItem( $sourceItem );
	},

	onMenuItemClick: function( event ) {
		var item = event.currentTarget;

		this.activateMenuItem( jQuery( item ) );

		embroidery.templates.setTemplatesSource( item.dataset.templateSource );
	}
} );
