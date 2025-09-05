var BaseAddSectionView = require( 'embroidery-views/add-section/base' );

module.exports = BaseAddSectionView.extend( {
	id: 'embroidery-add-new-section',

	onCloseButtonClick: function() {
		this.closeSelectPresets();
	}
} );
