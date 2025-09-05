var HandlerModule = require( 'embroidery-frontend/handler-module' );

var BackgroundVideo = HandlerModule.extend( {
	player: null,

	isYTVideo: null,

	getDefaultSettings: function() {
		return {
			selectors: {
				backgroundVideoContainer: '.embroidery-background-video-container',
				backgroundVideoEmbed: '.embroidery-background-video-embed',
				backgroundVideoHosted: '.embroidery-background-video-hosted'
			}
		};
	},

	getDefaultElements: function() {
		var selectors = this.getSettings( 'selectors' ),
			elements = {
				$backgroundVideoContainer: this.$element.find( selectors.backgroundVideoContainer )
			};

		elements.$backgroundVideoEmbed = elements.$backgroundVideoContainer.children( selectors.backgroundVideoEmbed );

		elements.$backgroundVideoHosted = elements.$backgroundVideoContainer.children( selectors.backgroundVideoHosted );

		return elements;
	},

	calcVideosSize: function() {
		var containerWidth = this.elements.$backgroundVideoContainer.outerWidth(),
			containerHeight = this.elements.$backgroundVideoContainer.outerHeight(),
			aspectRatioSetting = '16:9', //TEMP
			aspectRatioArray = aspectRatioSetting.split( ':' ),
			aspectRatio = aspectRatioArray[ 0 ] / aspectRatioArray[ 1 ],
			ratioWidth = containerWidth / aspectRatio,
			ratioHeight = containerHeight * aspectRatio,
			isWidthFixed = containerWidth / containerHeight > aspectRatio;

		return {
			width: isWidthFixed ? containerWidth : ratioHeight,
			height: isWidthFixed ? ratioWidth : containerHeight
		};
	},

	changeVideoSize: function() {
		var $video = this.isYTVideo ? jQuery( this.player.getIframe() ) : this.elements.$backgroundVideoHosted,
			size = this.calcVideosSize();

		$video.width( size.width ).height( size.height );
	},

	prepareYTVideo: function( YT, videoID ) {
		var self = this,
			$backgroundVideoContainer = self.elements.$backgroundVideoContainer;

		$backgroundVideoContainer.addClass( 'embroidery-loading embroidery-invisible' );

		self.player = new YT.Player( self.elements.$backgroundVideoEmbed[ 0 ], {
			videoId: videoID,
			events: {
				onReady: function() {
					self.player.mute();

					self.changeVideoSize();

					self.player.playVideo();
				},
				onStateChange: function( event ) {
					switch ( event.data ) {
						case YT.PlayerState.PLAYING:
							$backgroundVideoContainer.removeClass( 'embroidery-invisible embroidery-loading' );

							break;
						case YT.PlayerState.ENDED:
							self.player.seekTo( 0 );
					}
				}
			},
			playerVars: {
				controls: 0,
				showinfo: 0,
				rel: 0
			}
		} );

		embroideryFrontend.getElements( '$window' ).on( 'resize', self.changeVideoSize );
	},

	activate: function() {
		var self = this,
			videoLink = self.getElementSettings( 'background_video_link' ),
			videoID = embroideryFrontend.utils.youtube.getYoutubeIDFromURL( videoLink );

		self.isYTVideo = !! videoID;

		if ( videoID ) {
			embroideryFrontend.utils.youtube.onYoutubeApiReady( function( YT ) {
				setTimeout( function() {
					self.prepareYTVideo( YT, videoID );
				}, 1 );
			} );
		} else {
			self.elements.$backgroundVideoHosted.attr( 'src', videoLink ).one( 'canplay', self.changeVideoSize );
		}
	},

	deactivate: function() {
		if ( this.isYTVideo && this.player.getIframe() ) {
			this.player.destroy();
		} else {
			this.elements.$backgroundVideoHosted.removeAttr( 'src' );
		}
	},

	run: function() {
		var elementSettings = this.getElementSettings();

		if ( 'video' === elementSettings.background_background && elementSettings.background_video_link ) {
			this.activate();
		} else {
			this.deactivate();
		}
	},

	onInit: function() {
		HandlerModule.prototype.onInit.apply( this, arguments );

		this.run();
	},

	onElementChange: function( propertyName ) {
		if ( 'background_background' === propertyName ) {
			this.run();
		}
	}
} );

var StretchedSection = HandlerModule.extend( {

	stretchElement: null,

	bindEvents: function() {
		embroideryFrontend.addListenerOnce( this.$element.data( 'model-cid' ), 'resize', this.stretchSection );
	},

	initStretch: function() {
		this.stretchElement = new embroideryFrontend.modules.StretchElement( { element: this.$element } );
	},

	stretchSection: function() {
		var isStretched = this.$element.hasClass( 'embroidery-section-stretched' );

		if ( embroideryFrontend.isEditMode() || isStretched ) {
			this.stretchElement.reset();
		}

		if ( isStretched ) {
			this.stretchElement.setSettings( 'selectors.container', embroideryFrontend.getGeneralSettings( 'embroidery_stretched_section_container' ) || window );

			this.stretchElement.stretch();
		}
	},

	onInit: function() {
		HandlerModule.prototype.onInit.apply( this, arguments );

		this.initStretch();

		this.stretchSection();
	},

	onGeneralSettingsChange: function( changed ) {
		if ( 'embroidery_stretched_section_container' in changed ) {
			this.stretchSection();
		}
	}
} );

var Shapes = HandlerModule.extend( {

	getDefaultSettings: function() {
		return {
			selectors: {
				container: '> .embroidery-shape-%s'
			},
			svgURL: embroideryFrontend.config.urls.assets + 'shapes/'
		};
	},

	getDefaultElements: function() {
		var elements = {},
			selectors = this.getSettings( 'selectors' );

		elements.$topContainer = this.$element.find( selectors.container.replace( '%s', 'top' ) );

		elements.$bottomContainer = this.$element.find( selectors.container.replace( '%s', 'bottom' ) );

		return elements;
	},

	buildSVG: function( side ) {
		var self = this,
			baseSettingKey = 'shape_divider_' + side,
			shapeType = self.getElementSettings( baseSettingKey ),
			$svgContainer = this.elements[ '$' + side + 'Container' ];

		$svgContainer.empty().attr( 'data-shape', shapeType );

		if ( ! shapeType ) {
			return;
		}

		var fileName = shapeType;

		if ( self.getElementSettings( baseSettingKey + '_negative' ) ) {
			fileName += '-negative';
		}

		var svgURL = self.getSettings( 'svgURL' ) + fileName + '.svg';

		jQuery.get( svgURL, function( data ) {
			$svgContainer.append( data.childNodes[0] );
		} );

		this.setNegative( side );
	},

	setNegative: function( side ) {
		this.elements[ '$' + side + 'Container' ].attr( 'data-negative', !! this.getElementSettings( 'shape_divider_' + side + '_negative' ) );
	},

	onInit: function() {
		var self = this;

		HandlerModule.prototype.onInit.apply( self, arguments );

		[ 'top', 'bottom' ].forEach( function( side ) {
			if ( self.getElementSettings( 'shape_divider_' + side ) ) {
				self.buildSVG( side );
			}
		} );
	},

	onElementChange: function( propertyName ) {
		var shapeChange = propertyName.match( /^shape_divider_(top|bottom)$/ );

		if ( shapeChange ) {
			this.buildSVG( shapeChange[1] );

			return;
		}

		var negativeChange = propertyName.match( /^shape_divider_(top|bottom)_negative$/ );

		if ( negativeChange ) {
			this.buildSVG( negativeChange[1] );

			this.setNegative( negativeChange[1] );
		}
	}
} );

module.exports = function( $scope ) {
	if ( embroideryFrontend.isEditMode() || $scope.hasClass( 'embroidery-section-stretched' ) ) {
		new StretchedSection( { $element: $scope } );
	}

	if ( embroideryFrontend.isEditMode() ) {
		new Shapes( { $element:  $scope } );
	}

	new BackgroundVideo( { $element: $scope } );
};
