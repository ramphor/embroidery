var PanelMenuGroupView = require( 'embroidery-panel/pages/menu/views/group' ),
	PanelMenuPageView;

PanelMenuPageView = Marionette.CompositeView.extend( {
	id: 'embroidery-panel-page-menu',

	template: '#tmpl-embroidery-panel-menu',

	childView: PanelMenuGroupView,

	childViewContainer: '#embroidery-panel-page-menu-content',

	initialize: function() {
		this.collection = PanelMenuPageView.getGroups();
	},

	onDestroy: function() {
		var arrowClass = 'eicon-arrow-' + ( embroidery.config.is_rtl ? 'right' : 'left' );

		embroidery.panel.currentView.getHeaderView().ui.menuIcon.removeClass( arrowClass ).addClass( 'eicon-menu-bar' );
	}
}, {
	groups: null,

	initGroups: function() {
		this.groups = new Backbone.Collection( [
			{
				name: 'style',
				title: embroidery.translate( 'global_style' ),
				items: [
					{
						name: 'global-colors',
						icon: 'fa fa-paint-brush',
						title: embroidery.translate( 'global_colors' ),
						type: 'page',
						pageName: 'colorScheme'
					},
					{
						name: 'global-fonts',
						icon: 'fa fa-font',
						title: embroidery.translate( 'global_fonts' ),
						type: 'page',
						pageName: 'typographyScheme'
					},
					{
						name: 'color-picker',
						icon: 'fa fa-eyedropper',
						title: embroidery.translate( 'color_picker' ),
						type: 'page',
						pageName: 'colorPickerScheme'
					}
				]
			},
			{
				name: 'settings',
				title: embroidery.translate( 'settings' ),
				items: [
					{
						name: 'embroidery-settings',
						icon: 'fa fa-external-link',
						title: embroidery.translate( 'embroidery_settings' ),
						type: 'link',
						link: embroidery.config.settings_page_link,
						newTab: true
					},
					{
						name: 'about-embroidery',
						icon: 'fa fa-info-circle',
						title: embroidery.translate( 'about_embroidery' ),
						type: 'link',
						link: embroidery.config.embroidery_site,
						newTab: true
					}
				]
			}
		] );
	},

	getGroups: function() {
		if ( ! this.groups ) {
			this.initGroups();
		}

		return this.groups;
	},

	addItem: function( itemData, groupName, before ) {
		var group = this.getGroups().findWhere( { name: groupName } );

		if ( ! group ) {
			return;
		}

		var items = group.get( 'items' ),
			beforeItem;

		if ( before ) {
			beforeItem = _.findWhere( items, { name: before } );
		}

		if ( beforeItem ) {
			items.splice( items.indexOf( beforeItem ), 0, itemData );
		} else {
			items.push( itemData );
		}

	}
} );

module.exports = PanelMenuPageView;
