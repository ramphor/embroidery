module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-embroidery-panel-footer-content',

	tagName: 'nav',

	id: 'embroidery-panel-footer-tools',

	possibleRotateModes: [ 'portrait', 'landscape' ],

	ui: {
		buttonSave: '#embroidery-panel-saver-button-publish, #embroidery-panel-saver-menu-save-draft', // Compatibility for Pro <= 1.9.5
		menuButtons: '.embroidery-panel-footer-tool',
		settings: '#embroidery-panel-footer-settings',
		deviceModeIcon: '#embroidery-panel-footer-responsive > i',
		deviceModeButtons: '#embroidery-panel-footer-responsive .embroidery-panel-footer-sub-menu-item',
		saveTemplate: '#embroidery-panel-saver-menu-save-template',
		history: '#embroidery-panel-footer-history'
	},

	events: {
		'click @ui.settings': 'onClickSettings',
		'click @ui.deviceModeButtons': 'onClickResponsiveButtons',
		'click @ui.saveTemplate': 'onClickSaveTemplate',
		'click @ui.history': 'onClickHistory'
	},

	behaviors: function() {
		var behaviors = {
			saver: {
				behaviorClass: embroidery.modules.saver.footerBehavior
			}
		};

		return embroidery.hooks.applyFilters( 'panel/footer/behaviors', behaviors, this );
	},

	initialize: function() {
		this.listenTo( embroidery.channels.deviceMode, 'change', this.onDeviceModeChange );
	},

	getDeviceModeButton: function( deviceMode ) {
		return this.ui.deviceModeButtons.filter( '[data-device-mode="' + deviceMode + '"]' );
	},

	onPanelClick: function( event ) {
		var $target = jQuery( event.target ),
			isClickInsideOfTool = $target.closest( '.embroidery-panel-footer-sub-menu-wrapper' ).length;

		if ( isClickInsideOfTool ) {
			return;
		}

		var $tool = $target.closest( '.embroidery-panel-footer-tool' ),
			isClosedTool = $tool.length && ! $tool.hasClass( 'embroidery-open' );

		this.ui.menuButtons.filter( ':not(.embroidery-leave-open)' ).removeClass( 'embroidery-open' );

		if ( isClosedTool ) {
			$tool.addClass( 'embroidery-open' );
		}
	},

	onClickSettings: function() {
		var self = this;

		if ( 'page_settings' !== embroidery.getPanelView().getCurrentPageName() ) {
			embroidery.getPanelView().setPage( 'page_settings' );

			embroidery.getPanelView().getCurrentPageView().once( 'destroy', function() {
				self.ui.settings.removeClass( 'embroidery-open' );
			} );
		}
	},

	onDeviceModeChange: function() {
		var previousDeviceMode = embroidery.channels.deviceMode.request( 'previousMode' ),
			currentDeviceMode = embroidery.channels.deviceMode.request( 'currentMode' );

		this.getDeviceModeButton( previousDeviceMode ).removeClass( 'active' );

		this.getDeviceModeButton( currentDeviceMode ).addClass( 'active' );

		// Change the footer icon
		this.ui.deviceModeIcon.removeClass( 'eicon-device-' + previousDeviceMode ).addClass( 'eicon-device-' + currentDeviceMode );
	},

	onClickResponsiveButtons: function( event ) {
		var $clickedButton = this.$( event.currentTarget ),
			newDeviceMode = $clickedButton.data( 'device-mode' );

		embroidery.changeDeviceMode( newDeviceMode );
	},

	onClickSaveTemplate: function() {
		embroidery.templates.startModal( {
			onReady: function() {
				embroidery.templates.getLayout().showSaveTemplateView();
			}
		} );
	},

	onClickHistory: function() {
		if ( 'historyPage' !== embroidery.getPanelView().getCurrentPageName() ) {
			embroidery.getPanelView().setPage( 'historyPage' );
		}
	},

	onRender: function() {
		var self = this;

		_.defer( function() {
			embroidery.getPanelView().$el.on( 'click', self.onPanelClick.bind( self ) );
		} );
	}
} );
