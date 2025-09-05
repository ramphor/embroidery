<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery image carousel widget.
 *
 * Embroidery widget that displays a set of images in a rotating carousel or
 * slider.
 *
 * @since 1.0.0
 */
class Widget_Image_Carousel extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve image carousel widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'image-carousel';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve image carousel widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Image Carousel', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve image carousel widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-slider-push';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the image carousel widget belongs to.
	 *
	 * Used to determine where to display the widget in the editor.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Widget categories.
	 */
	public function get_categories() {
		return [ 'general-elements' ];
	}

	/**
	 * Retrieve the list of scripts the image carousel widget depended on.
	 *
	 * Used to set scripts dependencies required to run the widget.
	 *
	 * @since 1.3.0
	 * @access public
	 *
	 * @return array Widget scripts dependencies.
	 */
	public function get_script_depends() {
		return [ 'jquery-slick' ];
	}

	/**
	 * Register image carousel widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_image_carousel',
			[
				'label' => __( 'Image Carousel', 'embroidery' ),
			]
		);

		$this->add_control(
			'carousel',
			[
				'label' => __( 'Add Images', 'embroidery' ),
				'type' => Controls_Manager::GALLERY,
				'default' => [],
			]
		);

		$this->add_group_control(
			Group_Control_Image_Size::get_type(),
			[
				'name' => 'thumbnail',
			]
		);

		$slides_to_show = range( 1, 10 );

		$slides_to_show = array_combine( $slides_to_show, $slides_to_show );

		$this->add_responsive_control(
			'slides_to_show',
			[
				'label' => __( 'Slides to Show', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'' => __( 'Default', 'embroidery' ),
				] + $slides_to_show,
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'slides_to_scroll',
			[
				'label' => __( 'Slides to Scroll', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => '2',
				'options' => $slides_to_show,
				'condition' => [
					'slides_to_show!' => '1',
				],
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'image_stretch',
			[
				'label' => __( 'Image Stretch', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'no',
				'options' => [
					'no' => __( 'No', 'embroidery' ),
					'yes' => __( 'Yes', 'embroidery' ),
				],
			]
		);

		$this->add_control(
			'navigation',
			[
				'label' => __( 'Navigation', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'both',
				'options' => [
					'both' => __( 'Arrows and Dots', 'embroidery' ),
					'arrows' => __( 'Arrows', 'embroidery' ),
					'dots' => __( 'Dots', 'embroidery' ),
					'none' => __( 'None', 'embroidery' ),
				],
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'link_to',
			[
				'label' => __( 'Link to', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'none',
				'options' => [
					'none' => __( 'None', 'embroidery' ),
					'file' => __( 'Media File', 'embroidery' ),
					'custom' => __( 'Custom URL', 'embroidery' ),
				],
			]
		);

		$this->add_control(
			'link',
			[
				'label' => 'Link to',
				'type' => Controls_Manager::URL,
				'placeholder' => __( 'https://your-link.com', 'embroidery' ),
				'condition' => [
					'link_to' => 'custom',
				],
				'show_label' => false,
			]
		);

		$this->add_control(
			'open_lightbox',
			[
				'label' => __( 'Lightbox', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'default',
				'options' => [
					'default' => __( 'Default', 'embroidery' ),
					'yes' => __( 'Yes', 'embroidery' ),
					'no' => __( 'No', 'embroidery' ),
				],
				'condition' => [
					'link_to' => 'file',
				],
			]
		);

		$this->add_control(
			'caption_type',
			[
				'label' => __( 'Caption', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => '',
				'options' => [
					'' => __( 'None', 'embroidery' ),
					'title' => __( 'Title', 'embroidery' ),
					'caption' => __( 'Caption', 'embroidery' ),
					'description' => __( 'Description', 'embroidery' ),
				],
			]
		);

		$this->add_control(
			'view',
			[
				'label' => __( 'View', 'embroidery' ),
				'type' => Controls_Manager::HIDDEN,
				'default' => 'traditional',
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_additional_options',
			[
				'label' => __( 'Additional Options', 'embroidery' ),
			]
		);

		$this->add_control(
			'pause_on_hover',
			[
				'label' => __( 'Pause on Hover', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'yes',
				'options' => [
					'yes' => __( 'Yes', 'embroidery' ),
					'no' => __( 'No', 'embroidery' ),
				],
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'autoplay',
			[
				'label' => __( 'Autoplay', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'yes',
				'options' => [
					'yes' => __( 'Yes', 'embroidery' ),
					'no' => __( 'No', 'embroidery' ),
				],
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'autoplay_speed',
			[
				'label' => __( 'Autoplay Speed', 'embroidery' ),
				'type' => Controls_Manager::NUMBER,
				'default' => 5000,
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'infinite',
			[
				'label' => __( 'Infinite Loop', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'yes',
				'options' => [
					'yes' => __( 'Yes', 'embroidery' ),
					'no' => __( 'No', 'embroidery' ),
				],
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'effect',
			[
				'label' => __( 'Effect', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'slide',
				'options' => [
					'slide' => __( 'Slide', 'embroidery' ),
					'fade' => __( 'Fade', 'embroidery' ),
				],
				'condition' => [
					'slides_to_show' => '1',
				],
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'speed',
			[
				'label' => __( 'Animation Speed', 'embroidery' ),
				'type' => Controls_Manager::NUMBER,
				'default' => 500,
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'direction',
			[
				'label' => __( 'Direction', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'ltr',
				'options' => [
					'ltr' => __( 'Left', 'embroidery' ),
					'rtl' => __( 'Right', 'embroidery' ),
				],
				'frontend_available' => true,
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_style_navigation',
			[
				'label' => __( 'Navigation', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'navigation' => [ 'arrows', 'dots', 'both' ],
				],
			]
		);

		$this->add_control(
			'heading_style_arrows',
			[
				'label' => __( 'Arrows', 'embroidery' ),
				'type' => Controls_Manager::HEADING,
				'separator' => 'before',
				'condition' => [
					'navigation' => [ 'arrows', 'both' ],
				],
			]
		);

		$this->add_control(
			'arrows_position',
			[
				'label' => __( 'Arrows Position', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'inside',
				'options' => [
					'inside' => __( 'Inside', 'embroidery' ),
					'outside' => __( 'Outside', 'embroidery' ),
				],
				'condition' => [
					'navigation' => [ 'arrows', 'both' ],
				],
			]
		);

		$this->add_control(
			'arrows_size',
			[
				'label' => __( 'Arrows Size', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'min' => 20,
						'max' => 60,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-image-carousel-wrapper .slick-slider .slick-prev:before, {{WRAPPER}} .embroidery-image-carousel-wrapper .slick-slider .slick-next:before' => 'font-size: {{SIZE}}{{UNIT}};',
				],
				'condition' => [
					'navigation' => [ 'arrows', 'both' ],
				],
			]
		);

		$this->add_control(
			'arrows_color',
			[
				'label' => __( 'Arrows Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-image-carousel-wrapper .slick-slider .slick-prev:before, {{WRAPPER}} .embroidery-image-carousel-wrapper .slick-slider .slick-next:before' => 'color: {{VALUE}};',
				],
				'condition' => [
					'navigation' => [ 'arrows', 'both' ],
				],
			]
		);

		$this->add_control(
			'heading_style_dots',
			[
				'label' => __( 'Dots', 'embroidery' ),
				'type' => Controls_Manager::HEADING,
				'separator' => 'before',
				'condition' => [
					'navigation' => [ 'dots', 'both' ],
				],
			]
		);

		$this->add_control(
			'dots_position',
			[
				'label' => __( 'Dots Position', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'outside',
				'options' => [
					'outside' => __( 'Outside', 'embroidery' ),
					'inside' => __( 'Inside', 'embroidery' ),
				],
				'condition' => [
					'navigation' => [ 'dots', 'both' ],
				],
			]
		);

		$this->add_control(
			'dots_size',
			[
				'label' => __( 'Dots Size', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'min' => 5,
						'max' => 10,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-image-carousel-wrapper .embroidery-image-carousel .slick-dots li button:before' => 'font-size: {{SIZE}}{{UNIT}};',
				],
				'condition' => [
					'navigation' => [ 'dots', 'both' ],
				],
			]
		);

		$this->add_control(
			'dots_color',
			[
				'label' => __( 'Dots Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-image-carousel-wrapper .embroidery-image-carousel .slick-dots li button:before' => 'color: {{VALUE}};',
				],
				'condition' => [
					'navigation' => [ 'dots', 'both' ],
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_style_image',
			[
				'label' => __( 'Image', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'image_spacing',
			[
				'label' => __( 'Spacing', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'' => __( 'Default', 'embroidery' ),
					'custom' => __( 'Custom', 'embroidery' ),
				],
				'default' => '',
				'condition' => [
					'slides_to_show!' => '1',
				],
			]
		);

		$this->add_control(
			'image_spacing_custom',
			[
				'label' => __( 'Image Spacing', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'max' => 100,
					],
				],
				'default' => [
					'size' => 20,
				],
				'show_label' => false,
				'selectors' => [
					'{{WRAPPER}} .slick-list' => 'margin-left: -{{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .slick-slide .slick-slide-inner' => 'padding-left: {{SIZE}}{{UNIT}};',
				],
				'condition' => [
					'image_spacing' => 'custom',
					'slides_to_show!' => '1',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'image_border',
				'selector' => '{{WRAPPER}} .embroidery-image-carousel-wrapper .embroidery-image-carousel .slick-slide-image',
				'separator' => 'before',
			]
		);

		$this->add_control(
			'image_border_radius',
			[
				'label' => __( 'Border Radius', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%' ],
				'selectors' => [
					'{{WRAPPER}} .embroidery-image-carousel-wrapper .embroidery-image-carousel .slick-slide-image' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_caption',
			[
				'label' => __( 'Caption', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'caption_type!' => '',
				],
			]
		);

		$this->add_control(
			'caption_align',
			[
				'label' => __( 'Alignment', 'embroidery' ),
				'type' => Controls_Manager::CHOOSE,
				'options' => [
					'left' => [
						'title' => __( 'Left', 'embroidery' ),
						'icon' => 'fa fa-align-left',
					],
					'center' => [
						'title' => __( 'Center', 'embroidery' ),
						'icon' => 'fa fa-align-center',
					],
					'right' => [
						'title' => __( 'Right', 'embroidery' ),
						'icon' => 'fa fa-align-right',
					],
					'justify' => [
						'title' => __( 'Justified', 'embroidery' ),
						'icon' => 'fa fa-align-justify',
					],
				],
				'default' => 'center',
				'selectors' => [
					'{{WRAPPER}} .embroidery-image-carousel-caption' => 'text-align: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'caption_text_color',
			[
				'label' => __( 'Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-image-carousel-caption' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'caption_typography',
				'scheme' => Scheme_Typography::TYPOGRAPHY_4,
				'selector' => '{{WRAPPER}} .embroidery-image-carousel-caption',
			]
		);

		$this->end_controls_section();

	}

	/**
	 * Render image carousel widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();

		if ( empty( $settings['carousel'] ) ) {
			return;
		}

		$slides = [];

		foreach ( $settings['carousel'] as $index => $attachment ) {
			$image_url = Group_Control_Image_Size::get_attachment_image_src( $attachment['id'], 'thumbnail', $settings );

			$image_html = '<img class="slick-slide-image" src="' . esc_attr( $image_url ) . '" alt="' . esc_attr( Control_Media::get_image_alt( $attachment ) ) . '" />';

			$link = $this->get_link_url( $attachment, $settings );

			if ( $link ) {
				$link_key = 'link_' . $index;

				$this->add_render_attribute( $link_key, [
					'href' => $link['url'],
					'class' => 'embroidery-clickable',
					'data-embroidery-open-lightbox' => $settings['open_lightbox'],
					'data-embroidery-lightbox-slideshow' => $this->get_id(),
					'data-embroidery-lightbox-index' => $index,
				] );

				if ( ! empty( $link['is_external'] ) ) {
					$this->add_render_attribute( $link_key, 'target', '_blank' );
				}

				if ( ! empty( $link['nofollow'] ) ) {
					$this->add_render_attribute( $link_key, 'rel', 'nofollow' );
				}

				$image_html = '<a ' . $this->get_render_attribute_string( $link_key ) . '>' . $image_html . '</a>';
			}

			$image_caption = $this->get_image_caption( $attachment );

			$slide_html = '<div class="slick-slide"><figure class="slick-slide-inner">' . $image_html;

			if ( ! empty( $image_caption ) ) {
				$slide_html .= '<figcaption class="embroidery-image-carousel-caption">' . $image_caption . '</figcaption>';
			}

			$slide_html .= '</figure></div>';

			$slides[] = $slide_html;

		}

		if ( empty( $slides ) ) {
			return;
		}

		$this->add_render_attribute( 'carousel', 'class', 'embroidery-image-carousel' );

		if ( 'none' !== $settings['navigation'] ) {
			if ( 'dots' !== $settings['navigation'] ) {
				$this->add_render_attribute( 'carousel', 'class', 'slick-arrows-' . $settings['arrows_position'] );
			}

			if ( 'arrows' !== $settings['navigation'] ) {
				$this->add_render_attribute( 'carousel', 'class', 'slick-dots-' . $settings['dots_position'] );
			}
		}

		if ( 'yes' === $settings['image_stretch'] ) {
			$this->add_render_attribute( 'carousel', 'class', 'slick-image-stretch' );
		}

		?>
		<div class="embroidery-image-carousel-wrapper embroidery-slick-slider" dir="<?php echo $settings['direction']; ?>">
			<div <?php echo $this->get_render_attribute_string( 'carousel' ); ?>>
				<?php echo implode( '', $slides ); ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Retrieve image carousel link URL.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @param array $attachment
	 * @param object $instance
	 *
	 * @return array|string|false An array/string containing the attachment URL, or false if no link.
	 */
	private function get_link_url( $attachment, $instance ) {
		if ( 'none' === $instance['link_to'] ) {
			return false;
		}

		if ( 'custom' === $instance['link_to'] ) {
			if ( empty( $instance['link']['url'] ) ) {
				return false;
			}

			return $instance['link'];
		}

		return [
			'url' => wp_get_attachment_url( $attachment['id'] ),
		];
	}

	/**
	 * Retrieve image carousel caption.
	 *
	 * @since 1.2.0
	 * @access private
	 *
	 * @param array $attachment
	 *
	 * @return string The caption of the image.
	 */
	private function get_image_caption( $attachment ) {
		$caption_type = $this->get_settings( 'caption_type' );

		if ( empty( $caption_type ) ) {
			return '';
		}

		$attachment_post = get_post( $attachment['id'] );

		if ( 'caption' === $caption_type ) {
			return $attachment_post->post_excerpt;
		}

		if ( 'title' === $caption_type ) {
			return $attachment_post->post_title;
		}

		return $attachment_post->post_content;
	}
}
