var AddSectionView;

AddSectionView = Marionette.ItemView.extend( {
	template: Marionette.TemplateCache.get( '#tmpl-embroidery-add-section' ),

	attributes: {
		'data-view': 'choose-action'
	},

	ui: {
		addNewSection: '.embroidery-add-new-section',
		closeButton: '.embroidery-add-section-close',
		addSectionButton: '.embroidery-add-section-button',
		addTemplateButton: '.embroidery-add-template-button',
		selectPreset: '.embroidery-select-preset',
		presets: '.embroidery-preset'
	},

	events: {
		'click @ui.addSectionButton': 'onAddSectionButtonClick',
		'click @ui.addTemplateButton': 'onAddTemplateButtonClick',
		'click @ui.closeButton': 'onCloseButtonClick',
		'click @ui.presets': 'onPresetSelected'
	},

	className: function() {
		return 'embroidery-add-section embroidery-visible-desktop';
	},

	addSection: function( properties, options ) {
		return embroidery.sections.currentView.addSection( properties, options );
	},

	setView: function( view ) {
		this.$el.attr( 'data-view', view );
	},

	showSelectPresets: function() {
		this.setView( 'select-preset' );
	},

	closeSelectPresets: function() {
		this.setView( 'choose-action' );
	},

	getTemplatesModalOptions: function() {
		return {
			onReady: function() {
				embroidery.templates.showTemplates();
			}
		};
	},

	onAddSectionButtonClick: function() {
		this.showSelectPresets();
	},

	onAddTemplateButtonClick: function() {
		embroidery.templates.startModal( this.getTemplatesModalOptions() );
	},

	onRender: function() {
		this.$el.html5Droppable( {
			axis: [ 'vertical' ],
			groups: [ 'embroidery-element' ],
			placeholder: false,
			currentElementClass: 'embroidery-html5dnd-current-element',
			hasDraggingOnChildClass: 'embroidery-dragging-on-child',
			onDropping: this.onDropping.bind( this )
		} );
	},

	onPresetSelected: function( event ) {
		this.closeSelectPresets();

		var selectedStructure = event.currentTarget.dataset.structure,
			parsedStructure = embroidery.presetsFactory.getParsedStructure( selectedStructure ),
			elements = [],
			loopIndex;

		for ( loopIndex = 0; loopIndex < parsedStructure.columnsCount; loopIndex++ ) {
			elements.push( {
				id: embroidery.helpers.getUniqueID(),
				elType: 'column',
				settings: {},
				elements: []
			} );
		}

		embroidery.channels.data.trigger( 'element:before:add', {
			elType: 'section'
		} );

		var newSection = this.addSection( { elements: elements } );

		newSection.setStructure( selectedStructure );

		embroidery.channels.data.trigger( 'element:after:add' );
	},

	onDropping: function() {
		embroidery.channels.data.trigger( 'section:before:drop' );
		this.addSection().addElementFromPanel();
		embroidery.channels.data.trigger( 'section:after:drop' );
	}
} );

module.exports = AddSectionView;
