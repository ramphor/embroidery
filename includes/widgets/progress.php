<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery progress widget.
 *
 * Embroidery widget that displays an escalating progress bar.
 *
 * @since 1.0.0
 */
class Widget_Progress extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve progress widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'progress';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve progress widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Progress Bar', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve progress widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-skill-bar';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the progress widget belongs to.
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
	 * Register progress widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_progress',
			[
				'label' => __( 'Progress Bar', 'embroidery' ),
			]
		);

		$this->add_control(
			'title',
			[
				'label' => __( 'Title', 'embroidery' ),
				'type' => Controls_Manager::TEXT,
				'placeholder' => __( 'Enter your title', 'embroidery' ),
				'default' => __( 'My Skill', 'embroidery' ),
				'label_block' => true,
			]
		);

		$this->add_control(
			'progress_type',
			[
				'label' => __( 'Type', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => '',
				'options' => [
					'' => __( 'Default', 'embroidery' ),
					'info' => __( 'Info', 'embroidery' ),
					'success' => __( 'Success', 'embroidery' ),
					'warning' => __( 'Warning', 'embroidery' ),
					'danger' => __( 'Danger', 'embroidery' ),
				],
			]
		);

		$this->add_control(
			'percent',
			[
				'label' => __( 'Percentage', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 50,
					'unit' => '%',
				],
				'label_block' => true,
			]
		);

		$this->add_control( 'display_percentage', [
			'label' => __( 'Display Percentage', 'embroidery' ),
			'type' => Controls_Manager::SELECT,
			'default' => 'show',
			'options' => [
				'show' => __( 'Show', 'embroidery' ),
				'hide' => __( 'Hide', 'embroidery' ),
			],
		] );

		$this->add_control(
			'inner_text',
			[
				'label' => __( 'Inner Text', 'embroidery' ),
				'type' => Controls_Manager::TEXT,
				'placeholder' => __( 'e.g. Web Designer', 'embroidery' ),
				'default' => __( 'Web Designer', 'embroidery' ),
				'label_block' => true,
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
			'section_progress_style',
			[
				'label' => __( 'Progress Bar', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'bar_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_1,
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-progress-wrapper .embroidery-progress-bar' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'bar_bg_color',
			[
				'label' => __( 'Background Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-progress-wrapper' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'bar_inline_color',
			[
				'label' => __( 'Inner Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-progress-bar' => 'color: {{VALUE}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_title',
			[
				'label' => __( 'Title Style', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'title_color',
			[
				'label' => __( 'Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-title' => 'color: {{VALUE}};',
				],
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_1,
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'typography',
				'selector' => '{{WRAPPER}} .embroidery-title',
				'scheme' => Scheme_Typography::TYPOGRAPHY_3,
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render progress widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();

		$this->add_render_attribute( 'wrapper', [
			'class' => 'embroidery-progress-wrapper',
			'role' => 'progressbar',
			'aria-valuemin' => '0',
			'aria-valuemax' => '100',
			'aria-valuenow' => $settings['percent']['size'],
			'aria-valuetext' => $settings['inner_text']
		] );

		if ( ! empty( $settings['progress_type'] ) ) {
			$this->add_render_attribute( 'wrapper', 'class', 'progress-' . $settings['progress_type'] );
		}

		$this->add_render_attribute( 'progress-bar', [
			'class' => 'embroidery-progress-bar',
			'data-max' => $settings['percent']['size'],
		] );

		if ( ! empty( $settings['title'] ) ) { ?>
			<span class="embroidery-title"><?php echo $settings['title']; ?></span>
		<?php } ?>

		<div <?php echo $this->get_render_attribute_string( 'wrapper' ); ?>>
			<div <?php echo $this->get_render_attribute_string( 'progress-bar' ); ?>>
				<span class="embroidery-progress-text"><?php echo $settings['inner_text']; ?></span>
				<?php if ( 'hide' !== $settings['display_percentage'] ) { ?>
					<span class="embroidery-progress-percentage"><?php echo $settings['percent']['size']; ?>%</span>
				<?php } ?>
			</div>
		</div>
	<?php
	}

	/**
	 * Render progress widget output in the editor.
	 *
	 * Written as a Backbone JavaScript template and used to generate the live preview.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<#
		view.addRenderAttribute( 'progressWrapper', {
			'class': [ 'embroidery-progress-wrapper', 'progress-' + settings.progress_type ],
			'role': 'progressbar',
			'aria-valuemin': '0',
			'aria-valuemax': '100',
			'aria-valuenow': settings.percent.size,
			'aria-valuetext': settings.inner_text
		} );
		view.addInlineEditingAttributes( 'progressWrapper' );
		#>
		<# if ( settings.title ) { #>
		<span class="embroidery-title">{{{ settings.title }}}</span><#
		} #>
		<div {{{ view.getRenderAttributeString( 'progressWrapper' ) }}}>
			<div class="embroidery-progress-bar" data-max="{{ settings.percent.size }}">
				<span class="embroidery-progress-text">{{{ settings.inner_text }}}</span>
			<# if ( 'hide' !== settings.display_percentage ) { #>
				<span class="embroidery-progress-percentage">{{{ settings.percent.size }}}%</span>
			<# } #>
			</div>
		</div>
		<?php
	}
}
