var ViewModule = require( '../../utils/view-module' ),
	LightboxModule;

LightboxModule = ViewModule.extend( {
	oldAspectRatio: null,

	oldAnimation: null,

	swiper: null,

	getDefaultSettings: function() {
		return {
			classes: {
				aspectRatio: 'embroidery-aspect-ratio-%s',
				item: 'embroidery-lightbox-item',
				image: 'embroidery-lightbox-image',
				videoContainer: 'embroidery-video-container',
				videoWrapper: 'embroidery-fit-aspect-ratio',
				playButton: 'embroidery-custom-embed-play',
				playButtonIcon: 'fa',
				playing: 'embroidery-playing',
				hidden: 'embroidery-hidden',
				invisible: 'embroidery-invisible',
				preventClose: 'embroidery-lightbox-prevent-close',
				slideshow: {
					container: 'swiper-container',
					slidesWrapper: 'swiper-wrapper',
					prevButton: 'embroidery-swiper-button embroidery-swiper-button-prev',
					nextButton: 'embroidery-swiper-button embroidery-swiper-button-next',
					prevButtonIcon: 'eicon-chevron-left',
					nextButtonIcon: 'eicon-chevron-right',
					slide: 'swiper-slide'
				}
			},
			selectors: {
				links: 'a, [data-embroidery-lightbox]',
				slideshow: {
					activeSlide: '.swiper-slide-active',
					prevSlide: '.swiper-slide-prev',
					nextSlide: '.swiper-slide-next'
				}
			},
			modalOptions: {
				id: 'embroidery-lightbox',
				entranceAnimation: 'zoomIn',
				videoAspectRatio: 169,
				position: {
					enable: false
				}
			}
		};
	},

	getModal: function() {
		if ( ! LightboxModule.modal ) {
			this.initModal();
		}

		return LightboxModule.modal;
	},

	initModal: function() {
		var modal = LightboxModule.modal = embroideryFrontend.getDialogsManager().createWidget( 'lightbox', {
			className: 'embroidery-lightbox',
			closeButton: true,
			closeButtonClass: 'eicon-close',
			selectors: {
				preventClose: '.' + this.getSettings( 'classes.preventClose' )
			},
			hide: {
				onClick: true
			}
		} );

		modal.on( 'hide', function() {
			modal.setMessage( '' );
		} );
	},

	showModal: function( options ) {
		var self = this,
			defaultOptions = self.getDefaultSettings().modalOptions;

		self.setSettings( 'modalOptions', jQuery.extend( defaultOptions, options.modalOptions ) );

		var modal = self.getModal();

		modal.setID( self.getSettings( 'modalOptions.id' ) );

		modal.onShow = function() {
			DialogsManager.getWidgetType( 'lightbox' ).prototype.onShow.apply( modal, arguments );

			setTimeout( function() {
				self.setEntranceAnimation();
			}, 10 );
		};

		modal.onHide = function() {
			DialogsManager.getWidgetType( 'lightbox' ).prototype.onHide.apply( modal, arguments );

			modal.getElements( 'widgetContent' ).removeClass( 'animated' );
		};

		switch ( options.type ) {
			case 'image':
				self.setImageContent( options.url );

				break;
			case 'video':
				self.setVideoContent( options.url );

				break;
			case 'slideshow':
				self.setSlideshowContent( options.slideshow );

				break;
			default:
				self.setHTMLContent( options.html );
		}

		modal.show();
	},

	setHTMLContent: function( html ) {
		this.getModal().setMessage( html );
	},

	setImageContent: function( imageURL ) {
		var self = this,
			classes = self.getSettings( 'classes' ),
			$item = jQuery( '<div>', { 'class': classes.item } ),
			$image = jQuery( '<img>', { src: imageURL, 'class': classes.image + ' ' + classes.preventClose } );

		$item.append( $image );

		self.getModal().setMessage( $item );
	},

	setVideoContent: function( videoEmbedURL ) {
		videoEmbedURL = videoEmbedURL.replace( '&autoplay=0', '' ) + '&autoplay=1';

		var classes = this.getSettings( 'classes' ),
			$videoContainer = jQuery( '<div>', { 'class': classes.videoContainer } ),
			$videoWrapper = jQuery( '<div>', { 'class': classes.videoWrapper } ),
			$videoFrame = jQuery( '<iframe>', { src: videoEmbedURL, allowfullscreen: 1 } ),
			modal = this.getModal();

		$videoContainer.append( $videoWrapper );

		$videoWrapper.append( $videoFrame );

		modal.setMessage( $videoContainer );

		this.setVideoAspectRatio();

		var onHideMethod = modal.onHide;

		modal.onHide = function() {
			onHideMethod();

			modal.getElements( 'message' ).removeClass( 'embroidery-fit-aspect-ratio' );
		};
	},

	setSlideshowContent: function( options ) {
		var $ = jQuery,
			self = this,
			classes = self.getSettings( 'classes' ),
			slideshowClasses = classes.slideshow,
			$container = $( '<div>', { 'class': slideshowClasses.container } ),
			$slidesWrapper = $( '<div>', { 'class': slideshowClasses.slidesWrapper } ),
			$prevButton = $( '<div>', { 'class': slideshowClasses.prevButton + ' ' + classes.preventClose } ).html( $( '<i>', { 'class': slideshowClasses.prevButtonIcon } ) ),
			$nextButton = $( '<div>', { 'class': slideshowClasses.nextButton + ' ' + classes.preventClose } ).html( $( '<i>', { 'class': slideshowClasses.nextButtonIcon } ) );

		options.slides.forEach( function( slide ) {
			var slideClass =  slideshowClasses.slide + ' ' + classes.item;

			if ( slide.video ) {
				slideClass += ' ' + classes.video;
			}

			var $slide = $( '<div>', { 'class': slideClass } );

			if ( slide.video ) {
				$slide.attr( 'data-embroidery-slideshow-video', slide.video );

				var $playIcon = $( '<div>', { 'class': classes.playButton } ).html( $( '<i>', { 'class': classes.playButtonIcon } ) );

				$slide.append( $playIcon );
			} else {
				var $zoomContainer = $( '<div>', { 'class': 'swiper-zoom-container' } ),
					$slideImage = $( '<img>', { 'class': classes.image + ' ' + classes.preventClose } ).attr( 'src', slide.image );

				$zoomContainer.append( $slideImage );

				$slide.append( $zoomContainer );
			}

			$slidesWrapper.append( $slide );
		} );

		$container.append(
			$slidesWrapper,
			$prevButton,
			$nextButton
		);

		var modal = self.getModal();

		modal.setMessage( $container );

		var onShowMethod = modal.onShow;

		modal.onShow = function() {
			onShowMethod();

			var swiperOptions = {
				prevButton: $prevButton,
				nextButton: $nextButton,
				paginationClickable: true,
				grabCursor: true,
				onSlideChangeEnd: self.onSlideChange,
				runCallbacksOnInit: false,
				loop: true,
				keyboardControl: true
			};

			if ( options.swiper ) {
				$.extend( swiperOptions, options.swiper );
			}

			self.swiper = new Swiper( $container, swiperOptions );

			self.setVideoAspectRatio();

			self.playSlideVideo();
		};
	},

	setVideoAspectRatio: function( aspectRatio ) {
		aspectRatio = aspectRatio || this.getSettings( 'modalOptions.videoAspectRatio' );

		var $widgetContent = this.getModal().getElements( 'widgetContent' ),
			oldAspectRatio = this.oldAspectRatio,
			aspectRatioClass = this.getSettings( 'classes.aspectRatio' );

		this.oldAspectRatio = aspectRatio;

		if ( oldAspectRatio ) {
			$widgetContent.removeClass( aspectRatioClass.replace( '%s', oldAspectRatio ) );
		}

		if ( aspectRatio ) {
			$widgetContent.addClass( aspectRatioClass.replace( '%s', aspectRatio ) );
		}
	},

	getSlide: function( slideState ) {
		return this.swiper.slides.filter( this.getSettings( 'selectors.slideshow.' + slideState + 'Slide' ) );
	},

	playSlideVideo: function() {
		var $activeSlide = this.getSlide( 'active' ),
			videoURL = $activeSlide.data( 'embroidery-slideshow-video' );

		if ( ! videoURL ) {
			return;
		}

		var classes = this.getSettings( 'classes' );

		var $videoContainer = jQuery( '<div>', { 'class': classes.videoContainer + ' ' + classes.invisible } ),
			$videoWrapper = jQuery( '<div>', { 'class': classes.videoWrapper } ),
			$videoFrame = jQuery( '<iframe>', { src: videoURL } ),
			$playIcon = $activeSlide.children( '.' + classes.playButton );

		$videoContainer.append( $videoWrapper );

		$videoWrapper.append( $videoFrame );

		$activeSlide.append( $videoContainer );

		$playIcon.addClass( classes.playing ).removeClass( classes.hidden );

		$videoFrame.on( 'load', function() {
			$playIcon.addClass( classes.hidden );

			$videoContainer.removeClass( classes.invisible );
		} );
	},

	setEntranceAnimation: function( animation ) {
		animation = animation || this.getSettings( 'modalOptions.entranceAnimation' );

		var $widgetMessage = this.getModal().getElements( 'message' );

		if ( this.oldAnimation ) {
			$widgetMessage.removeClass( this.oldAnimation );
		}

		this.oldAnimation = animation;

		if ( animation ) {
			$widgetMessage.addClass( 'animated ' + animation );
		}
	},

	isLightboxLink: function( element ) {
		if ( 'A' === element.tagName && ! /\.(png|jpe?g|gif|svg)$/i.test( element.href ) ) {
			return false;
		}

		var generalOpenInLightbox = embroideryFrontend.getGeneralSettings( 'embroidery_global_image_lightbox' ),
			currentLinkOpenInLightbox = element.dataset.embroideryOpenLightbox;

		return 'yes' === currentLinkOpenInLightbox || generalOpenInLightbox && 'no' !== currentLinkOpenInLightbox;
	},

	openLink: function( event ) {
		var element = event.currentTarget,
			$target = jQuery( event.target ),
			editMode = embroideryFrontend.isEditMode(),
			isClickInsideEmbroidery = !! $target.closest( '#embroidery' ).length;

		if ( ! this.isLightboxLink( element ) ) {

			if ( editMode && isClickInsideEmbroidery ) {
				event.preventDefault();
			}

			return;
		}

		event.preventDefault();

		if ( embroideryFrontend.isEditMode() && ! embroideryFrontend.getGeneralSettings( 'embroidery_enable_lightbox_in_editor' ) ) {
			return;
		}

		var lightboxData = {};

		if ( element.dataset.embroideryLightbox ) {
			lightboxData = JSON.parse( element.dataset.embroideryLightbox );
		}

		if ( lightboxData.type && 'slideshow' !== lightboxData.type ) {
			this.showModal( lightboxData );

			return;
		}

		if ( ! element.dataset.embroideryLightboxSlideshow ) {
			this.showModal( {
				type: 'image',
				url: element.href
			} );

			return;
		}

		var slideshowID = element.dataset.embroideryLightboxSlideshow;

		var $allSlideshowLinks = jQuery( this.getSettings( 'selectors.links' ) ).filter( function() {
			return slideshowID === this.dataset.embroideryLightboxSlideshow;
		} );

		var slides = [],
			uniqueLinks = {};

		$allSlideshowLinks.each( function() {
			if ( uniqueLinks[ this.href ] ) {
				return;
			}

			uniqueLinks[ this.href ] = true;

			var slideIndex = this.dataset.embroideryLightboxIndex;

			if ( undefined === slideIndex ) {
				slideIndex = $allSlideshowLinks.index( this );
			}

			var slideData = {
				image: this.href,
				index: slideIndex
			};

			if ( this.dataset.embroideryLightboxVideo ) {
				slideData.video = this.dataset.embroideryLightboxVideo;
			}

			slides.push( slideData );
		} );

		slides.sort( function( a, b ) {
			return a.index - b.index;
		} );

		var initialSlide = element.dataset.embroideryLightboxIndex;

		if ( undefined === initialSlide ) {
			initialSlide = $allSlideshowLinks.index( element );
		}

		this.showModal( {
			type: 'slideshow',
			modalOptions: {
				id: 'embroidery-lightbox-slideshow-' + slideshowID
			},
			slideshow: {
				slides: slides,
				swiper: {
					initialSlide: +initialSlide
				}
			}
		} );
	},

	bindEvents: function() {
		embroideryFrontend.getElements( '$document' ).on( 'click', this.getSettings( 'selectors.links' ), this.openLink );
	},

	onInit: function() {
		ViewModule.prototype.onInit.apply( this, arguments );

		if ( embroideryFrontend.isEditMode() ) {
			embroidery.settings.general.model.on( 'change', this.onGeneralSettingsChange );
		}
	},

	onGeneralSettingsChange: function( model ) {
		if ( 'embroidery_lightbox_content_animation' in model.changed ) {
			this.setSettings( 'modalOptions.entranceAnimation', model.changed.embroidery_lightbox_content_animation );

			this.setEntranceAnimation();
		}
	},

	onSlideChange: function() {
		this
			.getSlide( 'prev' )
			.add( this.getSlide( 'next' ) )
			.add( this.getSlide( 'active' ) )
			.find( '.' + this.getSettings( 'classes.videoWrapper' ) )
			.remove();

		this.playSlideVideo();
	}
} );

module.exports = LightboxModule;
