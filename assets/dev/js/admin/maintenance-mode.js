var ViewModule = require( 'embroidery-utils/view-module' ),
	MaintenanceModeModule;

MaintenanceModeModule = ViewModule.extend( {
	getDefaultSettings: function() {
		return {
			selectors: {
				modeSelect: '.embroidery_maintenance_mode_mode select',
				maintenanceModeTable: '#tab-maintenance_mode table',
				maintenanceModeDescriptions: '.embroidery-maintenance-mode-description',
				excludeModeSelect: '.embroidery_maintenance_mode_exclude_mode select',
				excludeRolesArea: '.embroidery_maintenance_mode_exclude_roles',
				templateSelect: '.embroidery_maintenance_mode_template_id select',
				editTemplateButton: '.embroidery-edit-template',
				maintenanceModeError: '.embroidery-maintenance-mode-error'
			},
			classes: {
				isEnabled: 'embroidery-maintenance-mode-is-enabled'
			}
		};
	},

	getDefaultElements: function() {
		var elements = {},
			selectors = this.getSettings( 'selectors' );

		elements.$modeSelect = jQuery( selectors.modeSelect );
		elements.$maintenanceModeTable = elements.$modeSelect.parents( selectors.maintenanceModeTable );
		elements.$excludeModeSelect = elements.$maintenanceModeTable.find( selectors.excludeModeSelect );
		elements.$excludeRolesArea = elements.$maintenanceModeTable.find( selectors.excludeRolesArea );
		elements.$templateSelect = elements.$maintenanceModeTable.find( selectors.templateSelect );
		elements.$editTemplateButton = elements.$maintenanceModeTable.find( selectors.editTemplateButton );
		elements.$maintenanceModeDescriptions = elements.$maintenanceModeTable.find( selectors.maintenanceModeDescriptions );
		elements.$maintenanceModeError = elements.$maintenanceModeTable.find( selectors.maintenanceModeError );

		return elements;
	},

	bindEvents: function() {
		var settings = this.getSettings(),
			elements = this.elements;

		elements.$modeSelect.on( 'change', function() {
			elements.$maintenanceModeTable.toggleClass( settings.classes.isEnabled, !! elements.$modeSelect.val() );
			elements.$maintenanceModeDescriptions.hide();
			elements.$maintenanceModeDescriptions.filter( '[data-value="' + elements.$modeSelect.val() + '"]' ).show();
		} ).trigger( 'change' );

		elements.$excludeModeSelect.on( 'change', function() {
			elements.$excludeRolesArea.toggle( 'custom' === elements.$excludeModeSelect.val() );
		} ).trigger( 'change' );

		elements.$templateSelect.on( 'change', function() {
			var templateID = elements.$templateSelect.val();

			if ( ! templateID ) {
				elements.$editTemplateButton.hide();
				elements.$maintenanceModeError.show();
				return;
			}

			var editUrl = EmbroideryAdminConfig.home_url + '?p=' + templateID + '&embroidery';

			elements.$editTemplateButton
				.prop( 'href', editUrl )
				.show();
			elements.$maintenanceModeError.hide();
		} ).trigger( 'change' );
	}
} );

module.exports = MaintenanceModeModule;
