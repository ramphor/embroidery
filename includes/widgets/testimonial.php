<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery testimonial widget.
 *
 * Embroidery widget that displays customer testimonials that show social proof.
 *
 * @since 1.0.0
 */
class Widget_Testimonial extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve testimonial widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'testimonial';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve testimonial widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Testimonial', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve testimonial widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-testimonial';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the testimonial widget belongs to.
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
	 * Register testimonial widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_testimonial',
			[
				'label' => __( 'Testimonial', 'embroidery' ),
			]
		);

		$this->add_control(
			'testimonial_content',
			[
				'label' => __( 'Content', 'embroidery' ),
				'type' => Controls_Manager::TEXTAREA,
				'rows' => '10',
				'default' => 'Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.',
			]
		);

		$this->add_control(
			'testimonial_image',
			[
				'label' => __( 'Add Image', 'embroidery' ),
				'type' => Controls_Manager::MEDIA,
				'default' => [
					'url' => Utils::get_placeholder_image_src(),
				],
			]
		);

		$this->add_control(
			'testimonial_name',
			[
				'label' => __( 'Name', 'embroidery' ),
				'type' => Controls_Manager::TEXT,
				'default' => 'John Doe',
			]
		);

		$this->add_control(
			'testimonial_job',
			[
				'label' => __( 'Job', 'embroidery' ),
				'type' => Controls_Manager::TEXT,
				'default' => 'Designer',
			]
		);

		$this->add_control(
			'testimonial_image_position',
			[
				'label' => __( 'Image Position', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'aside',
				'options' => [
					'aside' => __( 'Aside', 'embroidery' ),
					'top' => __( 'Top', 'embroidery' ),
				],
				'condition' => [
					'testimonial_image[url]!' => '',
				],
				'separator' => 'before',
			]
		);

		$this->add_control(
			'testimonial_alignment',
			[
				'label' => __( 'Alignment', 'embroidery' ),
				'type' => Controls_Manager::CHOOSE,
				'default' => 'center',
				'options' => [
					'left'    => [
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

		// Content.
		$this->start_controls_section(
			'section_style_testimonial_content',
			[
				'label' => __( 'Content', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'content_content_color',
			[
				'label' => __( 'Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_3,
				],
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-testimonial-content' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'content_typography',
				'scheme' => Scheme_Typography::TYPOGRAPHY_3,
				'selector' => '{{WRAPPER}} .embroidery-testimonial-content',
			]
		);

		$this->end_controls_section();

		// Image.
		$this->start_controls_section(
			'section_style_testimonial_image',
			[
				'label' => __( 'Image', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'testimonial_image[url]!' => '',
				],
			]
		);

		$this->add_control(
			'image_size',
			[
				'label' => __( 'Image Size', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'size_units' => [ 'px' ],
				'range' => [
					'px' => [
						'min' => 20,
						'max' => 200,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-testimonial-wrapper .embroidery-testimonial-image img' => 'width: {{SIZE}}{{UNIT}};height: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'image_border',
				'selector' => '{{WRAPPER}} .embroidery-testimonial-wrapper .embroidery-testimonial-image img',
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
					'{{WRAPPER}} .embroidery-testimonial-wrapper .embroidery-testimonial-image img' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();

		// Name.
		$this->start_controls_section(
			'section_style_testimonial_name',
			[
				'label' => __( 'Name', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'name_text_color',
			[
				'label' => __( 'Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_1,
				],
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-testimonial-name' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'name_typography',
				'scheme' => Scheme_Typography::TYPOGRAPHY_1,
				'selector' => '{{WRAPPER}} .embroidery-testimonial-name',
			]
		);

		$this->end_controls_section();

		// Job.
		$this->start_controls_section(
			'section_style_testimonial_job',
			[
				'label' => __( 'Job', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'job_text_color',
			[
				'label' => __( 'Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_2,
				],
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-testimonial-job' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'job_typography',
				'scheme' => Scheme_Typography::TYPOGRAPHY_2,
				'selector' => '{{WRAPPER}} .embroidery-testimonial-job',
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render testimonial widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();

		$this->add_render_attribute( 'wrapper', 'class', 'embroidery-testimonial-wrapper' );

		if ( $settings['testimonial_alignment'] ) {
			$this->add_render_attribute( 'wrapper', 'class', 'embroidery-testimonial-text-align-' . $settings['testimonial_alignment'] );
		}

		$this->add_render_attribute( 'meta', 'class', 'embroidery-testimonial-meta' );

		if ( $settings['testimonial_image']['url'] ) {
			$this->add_render_attribute( 'meta', 'class', 'embroidery-has-image' );
		}

		if ( $settings['testimonial_image_position'] ) {
			$this->add_render_attribute( 'meta', 'class', 'embroidery-testimonial-image-position-' . $settings['testimonial_image_position'] );
		}

		$has_content = ! ! $settings['testimonial_content'];

		$has_image = ! ! $settings['testimonial_image']['url'];

		$has_name = ! ! $settings['testimonial_name'];

		$has_job = ! ! $settings['testimonial_job'];

		if ( ! $has_content && ! $has_image && ! $has_name && ! $has_job ) {
			return;
		}
		?>
		<div <?php echo $this->get_render_attribute_string( 'wrapper' ); ?>>

			<?php if ( $has_content ) :
				$this->add_render_attribute( 'testimonial_content', 'class', 'embroidery-testimonial-content' );

				$this->add_inline_editing_attributes( 'testimonial_content' );
				?>
				<div <?php echo $this->get_render_attribute_string( 'testimonial_content' );  ?>><?php echo $settings['testimonial_content']; ?></div>
			<?php endif; ?>

			<?php if ( $has_image || $has_name || $has_job ) : ?>
			<div <?php echo $this->get_render_attribute_string( 'meta' ); ?>>
				<div class="embroidery-testimonial-meta-inner">
					<?php if ( $has_image ) : ?>
						<div class="embroidery-testimonial-image">
							<img src="<?php echo esc_attr( $settings['testimonial_image']['url'] ); ?>" alt="<?php echo esc_attr( Control_Media::get_image_alt( $settings['testimonial_image'] ) ); ?>" />
						</div>
					<?php endif; ?>

					<?php if ( $has_name || $has_job ) : ?>
					<div class="embroidery-testimonial-details">
						<?php if ( $has_name ) :
							$this->add_render_attribute( 'testimonial_name', 'class', 'embroidery-testimonial-name' );

							$this->add_inline_editing_attributes( 'testimonial_name', 'none' );
							?>
							<div <?php echo $this->get_render_attribute_string( 'testimonial_name' );  ?>><?php echo $settings['testimonial_name']; ?></div>
						<?php endif; ?>

						<?php if ( $has_job ) :
							$this->add_render_attribute( 'testimonial_job', 'class', 'embroidery-testimonial-job' );

							$this->add_inline_editing_attributes( 'testimonial_job', 'none' );
							?>
							<div <?php echo $this->get_render_attribute_string( 'testimonial_job' );  ?>><?php echo $settings['testimonial_job']; ?></div>
						<?php endif; ?>
					</div>
					<?php endif; ?>
				</div>
			</div>
			<?php endif; ?>
		</div>
	<?php
	}

	/**
	 * Render testimonial widget output in the editor.
	 *
	 * Written as a Backbone JavaScript template and used to generate the live preview.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<#
		var imageUrl = false, hasImage = '';
		if ( '' !== settings.testimonial_image.url ) {
			imageUrl = settings.testimonial_image.url;
			hasImage = ' embroidery-has-image';
		}

		var testimonial_alignment = settings.testimonial_alignment ? ' embroidery-testimonial-text-align-' + settings.testimonial_alignment : '';
		var testimonial_image_position = settings.testimonial_image_position ? ' embroidery-testimonial-image-position-' + settings.testimonial_image_position : '';
		#>
		<div class="embroidery-testimonial-wrapper{{ testimonial_alignment }}">
			<# if ( '' !== settings.testimonial_content ) {
				view.addRenderAttribute( 'testimonial_content', 'class', 'embroidery-testimonial-content' );

				view.addInlineEditingAttributes( 'testimonial_content' );
				#>
				<div {{{ view.getRenderAttributeString( 'testimonial_content' ) }}}>{{{ settings.testimonial_content }}}</div>
			<# } #>
			<div class="embroidery-testimonial-meta{{ hasImage }}{{ testimonial_image_position }}">
				<div class="embroidery-testimonial-meta-inner">
					<# if ( imageUrl ) { #>
					<div class="embroidery-testimonial-image">
						<img src="{{ imageUrl }}" alt="testimonial" />
					</div>
					<# } #>

					<div class="embroidery-testimonial-details">
						<# if ( '' !== settings.testimonial_name ) {
							view.addRenderAttribute( 'testimonial_name', 'class', 'embroidery-testimonial-name' );

							view.addInlineEditingAttributes( 'testimonial_name', 'none' );
							#>
							<div {{{ view.getRenderAttributeString( 'testimonial_name' ) }}}>{{{ settings.testimonial_name }}}</div>
						<# } #>

						<# if ( '' !== settings.testimonial_job ) {
							view.addRenderAttribute( 'testimonial_job', 'class', 'embroidery-testimonial-job' );

							view.addInlineEditingAttributes( 'testimonial_job', 'none' );
							#>
							<div {{{ view.getRenderAttributeString( 'testimonial_job' ) }}}>{{{ settings.testimonial_job }}}</div>
						<# } #>
					</div>
				</div>
			</div>
		</div>
	<?php
	}
}
