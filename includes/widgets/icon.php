<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery icon widget.
 *
 * Embroidery widget that displays an icon from over 600+ icons.
 *
 * @since 1.0.0
 */
class Widget_Icon extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve icon widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'icon';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve icon widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Icon', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve icon widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-favorite';
	}

	/**
	 * Register icon widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_icon',
			[
				'label' => __( 'Icon', 'embroidery' ),
			]
		);

		$this->add_control(
			'view',
			[
				'label' => __( 'View', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'default' => __( 'Default', 'embroidery' ),
					'stacked' => __( 'Stacked', 'embroidery' ),
					'framed' => __( 'Framed', 'embroidery' ),
				],
				'default' => 'default',
				'prefix_class' => 'embroidery-view-',
			]
		);

		$this->add_control(
			'icon',
			[
				'label' => __( 'Icon', 'embroidery' ),
				'type' => Controls_Manager::ICON,
				'label_block' => true,
				'default' => 'fa fa-star',
			]
		);

		$this->add_control(
			'shape',
			[
				'label' => __( 'Shape', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'circle' => __( 'Circle', 'embroidery' ),
					'square' => __( 'Square', 'embroidery' ),
				],
				'default' => 'circle',
				'condition' => [
					'view!' => 'default',
				],
				'prefix_class' => 'embroidery-shape-',
			]
		);

		$this->add_control(
			'link',
			[
				'label' => __( 'Link', 'embroidery' ),
				'type' => Controls_Manager::URL,
				'placeholder' => __( 'https://your-link.com', 'embroidery' ),
			]
		);

		$this->add_responsive_control(
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
				],
				'default' => 'center',
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-wrapper' => 'text-align: {{VALUE}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_style_icon',
			[
				'label' => __( 'Icon', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'primary_color',
			[
				'label' => __( 'Primary Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}}.embroidery-view-stacked .embroidery-icon' => 'background-color: {{VALUE}};',
					'{{WRAPPER}}.embroidery-view-framed .embroidery-icon, {{WRAPPER}}.embroidery-view-default .embroidery-icon' => 'color: {{VALUE}}; border-color: {{VALUE}};',
				],
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_1,
				],
			]
		);

		$this->add_control(
			'secondary_color',
			[
				'label' => __( 'Secondary Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'condition' => [
					'view!' => 'default',
				],
				'selectors' => [
					'{{WRAPPER}}.embroidery-view-framed .embroidery-icon' => 'background-color: {{VALUE}};',
					'{{WRAPPER}}.embroidery-view-stacked .embroidery-icon' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'size',
			[
				'label' => __( 'Size', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'min' => 6,
						'max' => 300,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon' => 'font-size: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_control(
			'icon_padding',
			[
				'label' => __( 'Padding', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon' => 'padding: {{SIZE}}{{UNIT}};',
				],
				'range' => [
					'em' => [
						'min' => 0,
						'max' => 5,
					],
				],
				'condition' => [
					'view!' => 'default',
				],
			]
		);

		$this->add_control(
			'rotate',
			[
				'label' => __( 'Rotate', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 0,
					'unit' => 'deg',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon i' => 'transform: rotate({{SIZE}}{{UNIT}});',
				],
			]
		);

		$this->add_control(
			'border_width',
			[
				'label' => __( 'Border Width', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon' => 'border-width: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
				'condition' => [
					'view' => 'framed',
				],
			]
		);

		$this->add_control(
			'border_radius',
			[
				'label' => __( 'Border Radius', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%' ],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
				'condition' => [
					'view!' => 'default',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_hover',
			[
				'label' => __( 'Icon Hover', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'hover_primary_color',
			[
				'label' => __( 'Primary Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}}.embroidery-view-stacked .embroidery-icon:hover' => 'background-color: {{VALUE}};',
					'{{WRAPPER}}.embroidery-view-framed .embroidery-icon:hover, {{WRAPPER}}.embroidery-view-default .embroidery-icon:hover' => 'color: {{VALUE}}; border-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'hover_secondary_color',
			[
				'label' => __( 'Secondary Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'condition' => [
					'view!' => 'default',
				],
				'selectors' => [
					'{{WRAPPER}}.embroidery-view-framed .embroidery-icon:hover' => 'background-color: {{VALUE}};',
					'{{WRAPPER}}.embroidery-view-stacked .embroidery-icon:hover' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'hover_animation',
			[
				'label' => __( 'Hover Animation', 'embroidery' ),
				'type' => Controls_Manager::HOVER_ANIMATION,
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render icon widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();

		$this->add_render_attribute( 'wrapper', 'class', 'embroidery-icon-wrapper' );

		$this->add_render_attribute( 'icon-wrapper', 'class', 'embroidery-icon' );

		if ( ! empty( $settings['hover_animation'] ) ) {
			$this->add_render_attribute( 'icon-wrapper', 'class', 'embroidery-animation-' . $settings['hover_animation'] );
		}

		$icon_tag = 'div';

		if ( ! empty( $settings['link']['url'] ) ) {
			$this->add_render_attribute( 'icon-wrapper', 'href', $settings['link']['url'] );
			$icon_tag = 'a';

			if ( ! empty( $settings['link']['is_external'] ) ) {
				$this->add_render_attribute( 'icon-wrapper', 'target', '_blank' );
			}

			if ( $settings['link']['nofollow'] ) {
				$this->add_render_attribute( 'icon-wrapper', 'rel', 'nofollow' );
			}
		}

		if ( ! empty( $settings['icon'] ) ) {
			$this->add_render_attribute( 'icon', 'class', $settings['icon'] );
		}

		?>
		<div <?php echo $this->get_render_attribute_string( 'wrapper' ); ?>>
			<<?php echo $icon_tag . ' ' . $this->get_render_attribute_string( 'icon-wrapper' ); ?>>
				<i <?php echo $this->get_render_attribute_string( 'icon' ); ?>></i>
			</<?php echo $icon_tag; ?>>
		</div>
		<?php
	}

	/**
	 * Render icon widget output in the editor.
	 *
	 * Written as a Backbone JavaScript template and used to generate the live preview.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<# var link = settings.link.url ? 'href="' + settings.link.url + '"' : '',
				iconTag = link ? 'a' : 'div'; #>
		<div class="embroidery-icon-wrapper">
			<{{{ iconTag }}} class="embroidery-icon embroidery-animation-{{ settings.hover_animation }}" {{{ link }}}>
				<i class="{{ settings.icon }}"></i>
			</{{{ iconTag }}}>
		</div>
		<?php
	}
}
