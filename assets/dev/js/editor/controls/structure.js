var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlStructureItemView;

ControlStructureItemView = ControlBaseDataView.extend( {
	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.resetStructure = '.embroidery-control-structure-reset';

		return ui;
	},

	events: function() {
		return _.extend( ControlBaseDataView.prototype.events.apply( this, arguments ), {
			'click @ui.resetStructure': 'onResetStructureClick'
		} );
	},

	templateHelpers: function() {
		var helpers = ControlBaseDataView.prototype.templateHelpers.apply( this, arguments );

		helpers.getMorePresets = this.getMorePresets.bind( this );

		return helpers;
	},

	getCurrentEditedSection: function() {
		var editor = embroidery.getPanelView().getCurrentPageView();

		return editor.getOption( 'editedElementView' );
	},

	getMorePresets: function() {
		var parsedStructure = embroidery.presetsFactory.getParsedStructure( this.getControlValue() );

		return embroidery.presetsFactory.getPresets( parsedStructure.columnsCount );
	},

	onInputChange: function() {
		this.getCurrentEditedSection().redefineLayout();

		this.render();
	},

	onResetStructureClick: function() {
		this.getCurrentEditedSection().resetColumnsCustomSize();
	}
} );

module.exports = ControlStructureItemView;
