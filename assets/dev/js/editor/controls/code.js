var ControlBaseDataView = require( 'embroidery-controls/base-data' ),
	ControlCodeEditorItemView;

ControlCodeEditorItemView = ControlBaseDataView.extend( {

	ui: function() {
		var ui = ControlBaseDataView.prototype.ui.apply( this, arguments );

		ui.editor = '.embroidery-code-editor';

		return ui;
	},

	onReady: function() {
		var self = this;

		if ( 'undefined' === typeof ace ) {
			return;
		}

		var langTools = ace.require( 'ace/ext/language_tools' );

		self.editor = ace.edit( this.ui.editor[0] );

		jQuery( self.editor.container ).addClass( 'embroidery-input-style embroidery-code-editor' );

		self.editor.setOptions( {
			mode: 'ace/mode/' + self.model.attributes.language,
			minLines: 10,
			maxLines: Infinity,
			showGutter: true,
			useWorker: true,
			enableBasicAutocompletion: true,
			enableLiveAutocompletion: true
		} );

		self.editor.getSession().setUseWrapMode( true );

		embroidery.panel.$el.on( 'resize.aceEditor', self.onResize.bind( this ) );

		if ( 'css' === self.model.attributes.language ) {
			var selectorCompleter = {
				getCompletions: function( editor, session, pos, prefix, callback ) {
					var list = [],
						token = session.getTokenAt( pos.row, pos.column );

					if ( 0 < prefix.length && 'selector'.match( prefix ) && 'constant' === token.type ) {
						list = [ {
							name: 'selector',
							value: 'selector',
							score: 1,
							meta: 'Embroidery'
						} ];
					}

					callback( null, list );
				}
			};

			langTools.addCompleter( selectorCompleter );
		}

		self.editor.setValue( self.getControlValue(), -1 ); // -1 =  move cursor to the start

		self.editor.on( 'change', function() {
			self.setValue( self.editor.getValue() );
		} );

		if ( 'html' === self.model.attributes.language ) {
			// Remove the `doctype` annotation
			var session = self.editor.getSession();

			session.on( 'changeAnnotation', function() {
				var annotations = session.getAnnotations() || [],
					annotationsLength = annotations.length,
					index = annotations.length;

				while ( index-- ) {
					if ( /doctype first\. Expected/.test( annotations[ index ].text ) ) {
						annotations.splice( index, 1 );
					}
				}

				if ( annotationsLength > annotations.length ) {
					session.setAnnotations( annotations );
				}
			} );
		}
	},

	onResize: function() {
		this.editor.resize();
	},

	onDestroy: function() {
		embroidery.panel.$el.off( 'resize.aceEditor' );
	}
} );

module.exports = ControlCodeEditorItemView;
