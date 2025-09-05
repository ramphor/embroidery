var Module = require( 'embroidery-utils/module' );

module.exports = Module.extend( {
	modules: {
		base: require( 'embroidery-editor/components/settings/base/manager' ),
		general: require( 'embroidery-editor/components/settings/general/manager' ),
		page: require( 'embroidery-editor/components/settings/page/manager' )
	},

	panelPages: {
		base: require( 'embroidery-editor/components/settings/base/panel' )
	},

	onInit: function() {
		this.initSettings();
	},

	initSettings: function() {
		var self = this;

		_.each( embroidery.config.settings, function( config, name ) {
			var Manager = self.modules[ name ] || self.modules.base;

			self[ name ] = new Manager( config );
		} );
	}
} );
