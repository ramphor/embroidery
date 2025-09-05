<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery image gallery widget.
 *
 * Embroidery widget that displays a set of images in an aligned grid.
 *
 * @since 1.0.0
 */
class Widget_Image_Gallery extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve image gallery widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'image-gallery';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve image gallery widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Image Gallery', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve image gallery widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-gallery-grid';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the image gallery widget belongs to.
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
	 * Add lightbox data to image link.
	 *
	 * Used to add lightbox data attributes to image link HTML.
	 *
	 * @since 1.6.0
	 * @access public
	 *
	 * @param string $link_html Image link HTML.
	 *
	 * @return string Image link HTML with lightbox data attributes.
	 */
	public function add_lightbox_data_to_image_link( $link_html ) {
		return preg_replace( '/^<a/', '<a ' . $this->get_render_attribute_string( 'link' ), $link_html );
	}

	/**
	 * Register image gallery widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_gallery',
			[
				'label' => __( 'Image Gallery', 'embroidery' ),
			]
		);

		$this->add_control(
			'wp_gallery',
			[
				'label' => __( 'Add Images', 'embroidery' ),
				'type' => Controls_Manager::GALLERY,
			]
		);

		$this->add_group_control(
			Group_Control_Image_Size::get_type(),
			[
				'name' => 'thumbnail',
				'exclude' => [ 'custom' ],
			]
		);

		$gallery_columns = range( 1, 10 );
		$gallery_columns = array_combine( $gallery_columns, $gallery_columns );

		$this->add_control(
			'gallery_columns',
			[
				'label' => __( 'Columns', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 4,
				'options' => $gallery_columns,
			]
		);

		$this->add_control(
			'gallery_link',
			[
				'label' => __( 'Link to', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'file',
				'options' => [
					'file' => __( 'Media File', 'embroidery' ),
					'attachment' => __( 'Attachment Page', 'embroidery' ),
					'none' => __( 'None', 'embroidery' ),
				],
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
					'gallery_link' => 'file',
				],
			]
		);

		$this->add_control(
			'gallery_rand',
			[
				'label' => __( 'Ordering', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'' => __( 'Default', 'embroidery' ),
					'rand' => __( 'Random', 'embroidery' ),
				],
				'default' => '',
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
			'section_gallery_images',
			[
				'label' => __( 'Images', 'embroidery' ),
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
				'prefix_class' => 'gallery-spacing-',
				'default' => '',
			]
		);

		$columns_margin = is_rtl() ? '0 0 -{{SIZE}}{{UNIT}} -{{SIZE}}{{UNIT}};' : '0 -{{SIZE}}{{UNIT}} -{{SIZE}}{{UNIT}} 0;';
		$columns_padding = is_rtl() ? '0 0 {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}};' : '0 {{SIZE}}{{UNIT}} {{SIZE}}{{UNIT}} 0;';

		$this->add_control(
			'image_spacing_custom',
			[
				'label' => __( 'Image Spacing', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'show_label' => false,
				'range' => [
					'px' => [
						'max' => 100,
					],
				],
				'default' => [
					'size' => 15,
				],
				'selectors' => [
					'{{WRAPPER}} .gallery-item' => 'padding:' . $columns_padding,
					'{{WRAPPER}} .gallery' => 'margin: ' . $columns_margin,
				],
				'condition' => [
					'image_spacing' => 'custom',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'image_border',
				'selector' => '{{WRAPPER}} .gallery-item img',
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
					'{{WRAPPER}} .gallery-item img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_caption',
			[
				'label' => __( 'Caption', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'gallery_display_caption',
			[
				'label' => __( 'Display', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => '',
				'options' => [
					'' => __( 'Show', 'embroidery' ),
					'none' => __( 'Hide', 'embroidery' ),
				],
				'selectors' => [
					'{{WRAPPER}} .gallery-item .gallery-caption' => 'display: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'align',
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
					'{{WRAPPER}} .gallery-item .gallery-caption' => 'text-align: {{VALUE}};',
				],
				'condition' => [
					'gallery_display_caption' => '',
				],
			]
		);

		$this->add_control(
			'text_color',
			[
				'label' => __( 'Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .gallery-item .gallery-caption' => 'color: {{VALUE}};',
				],
				'condition' => [
					'gallery_display_caption' => '',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'typography',
				'scheme' => Scheme_Typography::TYPOGRAPHY_4,
				'selector' => '{{WRAPPER}} .gallery-item .gallery-caption',
				'condition' => [
					'gallery_display_caption' => '',
				],
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render image gallery widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();

		if ( ! $settings['wp_gallery'] ) {
			return;
		}

		$ids = wp_list_pluck( $settings['wp_gallery'], 'id' );

		$this->add_render_attribute( 'shortcode', 'ids', implode( ',', $ids ) );
		$this->add_render_attribute( 'shortcode', 'size', $settings['thumbnail_size'] );

		if ( $settings['gallery_columns'] ) {
			$this->add_render_attribute( 'shortcode', 'columns', $settings['gallery_columns'] );
		}

		if ( $settings['gallery_link'] ) {
			$this->add_render_attribute( 'shortcode', 'link', $settings['gallery_link'] );
		}

		if ( ! empty( $settings['gallery_rand'] ) ) {
			$this->add_render_attribute( 'shortcode', 'orderby', $settings['gallery_rand'] );
		}
		?>
		<div class="embroidery-image-gallery">
			<?php
			$this->add_render_attribute( 'link', [
				'class' => 'embroidery-clickable',
				'data-embroidery-open-lightbox' => $settings['open_lightbox'],
				'data-embroidery-lightbox-slideshow' => $this->get_id(),
			] );

			add_filter( 'wp_get_attachment_link', [ $this, 'add_lightbox_data_to_image_link' ] );

			echo do_shortcode( '[gallery ' . $this->get_render_attribute_string( 'shortcode' ) . ']' );

			remove_filter( 'wp_get_attachment_link', [ $this, 'add_lightbox_data_to_image_link' ] );
			?>
		</div>
		<?php
	}
}
