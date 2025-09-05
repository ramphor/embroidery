<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery column element class.
 *
 * Embroidery repeater handler class is responsible for initializing the column
 * element.
 *
 * @since 1.0.0
 */
class Element_Column extends Element_Base {

	/**
	 * Column edit tools.
	 *
	 * Holds the column edit tools.
	 *
	 * @since 1.0.0
	 * @access protected
	 * @static
	 *
	 * @var array Column edit tools.
	 */
	protected static $_edit_tools;

	/**
	 * Get default edit tools.
	 *
	 * Retrieve the column default edit tools. Used to set initial tools.
	 *
	 * @since 1.0.0
	 * @access protected
	 * @static
	 *
	 * @return array Default column edit tools.
	 */
	protected static function get_default_edit_tools() {
		$column_label = __( 'Column', 'embroidery' );

		return [
			'duplicate' => [
				'title' => sprintf( __( 'Duplicate %s', 'embroidery' ), $column_label ),
				'icon' => 'clone',
			],
			'add' => [
				'title' => sprintf( __( 'Add %s', 'embroidery' ), $column_label ),
				'icon' => 'plus',
			],
			'remove' => [
				'title' => sprintf( __( 'Remove %s', 'embroidery' ), $column_label ),
				'icon' => 'close',
			],
		];
	}

	/**
	 * Get column name.
	 *
	 * Retrieve the column name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Column name.
	 */
	public function get_name() {
		return 'column';
	}

	/**
	 * Get column title.
	 *
	 * Retrieve the column title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Column title.
	 */
	public function get_title() {
		return __( 'Column', 'embroidery' );
	}

	/**
	 * Get column icon.
	 *
	 * Retrieve the column icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Column icon.
	 */
	public function get_icon() {
		return 'eicon-column';
	}

	/**
	 * Register column controls.
	 *
	 * Used to add new controls to the column element.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		// Section Layout.
		$this->start_controls_section(
			'layout',
			[
				'label' => __( 'Layout', 'embroidery' ),
				'tab' => Controls_Manager::TAB_LAYOUT,
			]
		);

		$this->add_responsive_control(
			'_inline_size',
			[
				'label' => __( 'Column Width', 'embroidery' ) . ' (%)',
				'type' => Controls_Manager::NUMBER,
				'min' => 10,
				'max' => 90,
				'required' => true,
				'device_args' => [
					Controls_Stack::RESPONSIVE_TABLET => [
						'max' => 100,
						'required' => false,
					],
					Controls_Stack::RESPONSIVE_MOBILE => [
						'max' => 100,
						'required' => false,
					],
				],
				'min_affected_device' => [
					Controls_Stack::RESPONSIVE_DESKTOP => Controls_Stack::RESPONSIVE_TABLET,
					Controls_Stack::RESPONSIVE_TABLET => Controls_Stack::RESPONSIVE_TABLET,
				],
				'selectors' => [
					'{{WRAPPER}}' => 'width: {{VALUE}}%',
				],
			]
		);

		$this->add_control(
			'content_position',
			[
				'label' => __( 'Content Position', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => '',
				'options' => [
					'' => __( 'Default', 'embroidery' ),
					'top' => __( 'Top', 'embroidery' ),
					'center' => __( 'Middle', 'embroidery' ),
					'bottom' => __( 'Bottom', 'embroidery' ),
				],
				'selectors_dictionary' => [
					'top' => 'flex-start',
					'bottom' => 'flex-end',
				],
				'selectors' => [
					'{{WRAPPER}}.embroidery-column .embroidery-column-wrap' => 'align-items: {{VALUE}}',
				],
			]
		);

		$this->add_control(
			'space_between_widgets',
			[
				'label' => __( 'Widgets Space', 'embroidery' ) . ' (px)',
				'type' => Controls_Manager::NUMBER,
				'placeholder' => 20,
				'selectors' => [
					'{{WRAPPER}} > .embroidery-column-wrap > .embroidery-widget-wrap > .embroidery-widget:not(:last-child)' => 'margin-bottom: {{VALUE}}px',//Need the full path for exclude the inner section
				],
			]
		);

		$possible_tags = [
			'div',
			'article',
			'aside',
			'nav',
		];

		$options = [
			'' => __( 'Default', 'embroidery' ),
		] + array_combine( $possible_tags, $possible_tags );

		$this->add_control(
			'html_tag',
			[
				'label' => __( 'HTML Tag', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => $options,
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_style',
			[
				'label' => __( 'Background', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->start_controls_tabs( 'tabs_background' );

		$this->start_controls_tab(
			'tab_background_normal',
			[
				'label' => __( 'Normal', 'embroidery' ),
			]
		);

		$this->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name' => 'background',
				'selector' => '{{WRAPPER}} > .embroidery-element-populated',
			]
		);

		$this->end_controls_tab();

		$this->start_controls_tab(
			'tab_background_hover',
			[
				'label' => __( 'Hover', 'embroidery' ),
			]
		);

		$this->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name' => 'background_hover',
				'selector' => '{{WRAPPER}}:hover > .embroidery-element-populated',
			]
		);

		$this->add_control(
			'background_hover_transition',
			[
				'label' => __( 'Transition Duration', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 0.3,
				],
				'range' => [
					'px' => [
						'max' => 3,
						'step' => 0.1,
					],
				],
				'render_type' => 'ui',
			]
		);

		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->end_controls_section();

		// Section Column Background Overlay.
		$this->start_controls_section(
			'section_background_overlay',
			[
				'label' => __( 'Background Overlay', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'background_background' => [ 'classic', 'gradient' ],
				],
			]
		);

		$this->start_controls_tabs( 'tabs_background_overlay' );

		$this->start_controls_tab(
			'tab_background_overlay_normal',
			[
				'label' => __( 'Normal', 'embroidery' ),
			]
		);

		$this->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name' => 'background_overlay',
				'selector' => '{{WRAPPER}} > .embroidery-element-populated >  .embroidery-background-overlay',
			]
		);

		$this->add_control(
			'background_overlay_opacity',
			[
				'label' => __( 'Opacity (%)', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => .5,
				],
				'range' => [
					'px' => [
						'max' => 1,
						'step' => 0.01,
					],
				],
				'selectors' => [
					'{{WRAPPER}} > .embroidery-element-populated >  .embroidery-background-overlay' => 'opacity: {{SIZE}};',
				],
				'condition' => [
					'background_overlay_background' => [ 'classic', 'gradient' ],
				],
			]
		);

		$this->end_controls_tab();

		$this->start_controls_tab(
			'tab_background_overlay_hover',
			[
				'label' => __( 'Hover', 'embroidery' ),
			]
		);

		$this->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name' => 'background_overlay_hover',
				'selector' => '{{WRAPPER}}:hover > .embroidery-element-populated >  .embroidery-background-overlay',
			]
		);

		$this->add_control(
			'background_overlay_hover_opacity',
			[
				'label' => __( 'Opacity (%)', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => .5,
				],
				'range' => [
					'px' => [
						'max' => 1,
						'step' => 0.01,
					],
				],
				'selectors' => [
					'{{WRAPPER}}:hover > .embroidery-element-populated >  .embroidery-background-overlay' => 'opacity: {{SIZE}};',
				],
				'condition' => [
					'background_overlay_hover_background' => [ 'classic', 'gradient' ],
				],
			]
		);

		$this->add_control(
			'background_overlay_hover_transition',
			[
				'label' => __( 'Transition Duration', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 0.3,
				],
				'range' => [
					'px' => [
						'max' => 3,
						'step' => 0.1,
					],
				],
				'render_type' => 'ui',
			]
		);

		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->end_controls_section();

		$this->start_controls_section(
			'section_border',
			[
				'label' => __( 'Border', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->start_controls_tabs( 'tabs_border' );

		$this->start_controls_tab(
			'tab_border_normal',
			[
				'label' => __( 'Normal', 'embroidery' ),
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'border',
				'selector' => '{{WRAPPER}} > .embroidery-element-populated',
			]
		);

		$this->add_control(
			'border_radius',
			[
				'label' => __( 'Border Radius', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%' ],
				'selectors' => [
					'{{WRAPPER}} > .embroidery-element-populated, {{WRAPPER}} > .embroidery-element-populated > .embroidery-background-overlay' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'box_shadow',
				'selector' => '{{WRAPPER}} > .embroidery-element-populated',
			]
		);

		$this->end_controls_tab();

		$this->start_controls_tab(
			'tab_border_hover',
			[
				'label' => __( 'Hover', 'embroidery' ),
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'border_hover',
				'selector' => '{{WRAPPER}}:hover > .embroidery-element-populated',
			]
		);

		$this->add_control(
			'border_radius_hover',
			[
				'label' => __( 'Border Radius', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%' ],
				'selectors' => [
					'{{WRAPPER}}:hover > .embroidery-element-populated, {{WRAPPER}}:hover > .embroidery-element-populated > .embroidery-background-overlay' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'box_shadow_hover',
				'selector' => '{{WRAPPER}}:hover > .embroidery-element-populated',
			]
		);

		$this->add_control(
			'border_hover_transition',
			[
				'label' => __( 'Transition Duration', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 0.3,
				],
				'range' => [
					'px' => [
						'max' => 3,
						'step' => 0.1,
					],
				],
				'selectors' => [
					'{{WRAPPER}} > .embroidery-element-populated' => 'transition: background {{background_hover_transition.SIZE}}s, border {{SIZE}}s, border-radius {{SIZE}}s, box-shadow {{SIZE}}s',
					'{{WRAPPER}} > .embroidery-element-populated > .embroidery-background-overlay' => 'transition: background {{background_overlay_hover_transition.SIZE}}s, border-radius {{SIZE}}s, opacity {{background_overlay_hover_transition.SIZE}}s',
				],
			]
		);

		$this->end_controls_tab();

		$this->end_controls_tabs();

		$this->end_controls_section();

		// Section Typography.
		$this->start_controls_section(
			'section_typo',
			[
				'label' => __( 'Typography', 'embroidery' ),
				'type' => Controls_Manager::SECTION,
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		if ( in_array( Scheme_Color::get_type(), Schemes_Manager::get_enabled_schemes() ) ) {
			$this->add_control(
				'colors_warning',
				[
					'type' => Controls_Manager::RAW_HTML,
					'raw' => __( 'Note: The following colors won\'t work if Default Colors are enabled.', 'embroidery' ),
					'content_classes' => 'embroidery-panel-alert embroidery-panel-alert-warning',
				]
			);
		}

		$this->add_control(
			'heading_color',
			[
				'label' => __( 'Heading Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-element-populated .embroidery-heading-title' => 'color: {{VALUE}};',
				],
				'separator' => 'none',
			]
		);

		$this->add_control(
			'color_text',
			[
				'label' => __( 'Text Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} > .embroidery-element-populated' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'color_link',
			[
				'label' => __( 'Link Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-element-populated a' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'color_link_hover',
			[
				'label' => __( 'Link Hover Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-element-populated a:hover' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'text_align',
			[
				'label' => __( 'Text Align', 'embroidery' ),
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
				'selectors' => [
					'{{WRAPPER}} > .embroidery-element-populated' => 'text-align: {{VALUE}};',
				],
			]
		);

		$this->end_controls_section();

		// Section Advanced.
		$this->start_controls_section(
			'section_advanced',
			[
				'label' => __( 'Element Style', 'embroidery' ),
				'type' => Controls_Manager::SECTION,
				'tab' => Controls_Manager::TAB_ADVANCED,
			]
		);

		$this->add_responsive_control(
			'margin',
			[
				'label' => __( 'Margin', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%' ],
				'selectors' => [
					'{{WRAPPER}} > .embroidery-element-populated' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
			'padding',
			[
				'label' => __( 'Padding', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'selectors' => [
					'{{WRAPPER}} > .embroidery-element-populated' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_control(
			'z_index',
			[
				'label' => __( 'Z-Index', 'embroidery' ),
				'type' => Controls_Manager::NUMBER,
				'min' => 0,
				'placeholder' => 0,
				'selectors' => [
					'{{WRAPPER}}' => 'z-index: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'animation',
			[
				'label' => __( 'Entrance Animation', 'embroidery' ),
				'type' => Controls_Manager::ANIMATION,
				'default' => '',
				'prefix_class' => 'animated ',
				'label_block' => true,
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'animation_duration',
			[
				'label' => __( 'Animation Duration', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => '',
				'options' => [
					'slow' => __( 'Slow', 'embroidery' ),
					'' => __( 'Normal', 'embroidery' ),
					'fast' => __( 'Fast', 'embroidery' ),
				],
				'prefix_class' => 'animated-',
				'condition' => [
					'animation!' => '',
				],
			]
		);

		$this->add_control(
			'animation_delay',
			[
				'label' => __( 'Animation Delay', 'embroidery' ) . ' (ms)',
				'type' => Controls_Manager::NUMBER,
				'default' => '',
				'min' => 0,
				'step' => 100,
				'condition' => [
					'animation!' => '',
				],
				'render_type' => 'none',
				'frontend_available' => true,
			]
		);

		$this->add_control(
			'_element_id',
			[
				'label' => __( 'CSS ID', 'embroidery' ),
				'type' => Controls_Manager::TEXT,
				'default' => '',
				'label_block' => true,
				'title' => __( 'Add your custom id WITHOUT the Pound key. e.g: my-id', 'embroidery' ),
			]
		);

		$this->add_control(
			'css_classes',
			[
				'label' => __( 'CSS Classes', 'embroidery' ),
				'type' => Controls_Manager::TEXT,
				'default' => '',
				'prefix_class' => '',
				'label_block' => true,
				'title' => __( 'Add your custom class WITHOUT the dot. e.g: my-class', 'embroidery' ),
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_responsive',
			[
				'label' => __( 'Responsive', 'embroidery' ),
				'tab' => Controls_Manager::TAB_ADVANCED,
			]
		);

		$this->add_control(
			'screen_sm',
			[
				'label' => __( 'Mobile Width', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'default',
				'options' => [
					'default' => __( 'Default', 'embroidery' ),
					'custom' => __( 'Custom', 'embroidery' ),
				],
				'classes' => 'embroidery-control-deprecated',
				'description' => __( 'Deprecated: Mobile Width control is no longer supported. Please use the Column Width control in the Layout tab instead.', 'embroidery' ),
			]
		);

		$this->add_control(
			'screen_sm_width',
			[
				'label' => __( 'Column Width', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'10' => '10%',
					'11' => '11%',
					'12' => '12%',
					'14' => '14%',
					'16' => '16%',
					'20' => '20%',
					'25' => '25%',
					'30' => '30%',
					'33' => '33%',
					'40' => '40%',
					'50' => '50%',
					'60' => '60%',
					'66' => '66%',
					'70' => '70%',
					'75' => '75%',
					'80' => '80%',
					'83' => '83%',
					'90' => '90%',
					'100' => '100%',
				],
				'default' => '100',
				'condition' => [
					'screen_sm' => [ 'custom' ],
				],
				'prefix_class' => 'embroidery-sm-',
			]
		);

		$this->end_controls_section();

		Plugin::$instance->controls_manager->add_custom_css_controls( $this );
	}

	/**
	 * Render column edit tools.
	 *
	 * Used to generate the edit tools HTML.
	 *
	 * @since 1.8.0
	 * @access protected
	 */
	protected function render_edit_tools() {
		?>
		<div class="embroidery-element-overlay">
			<ul class="embroidery-editor-element-settings embroidery-editor-column-settings">
				<li class="embroidery-editor-element-setting embroidery-editor-element-trigger" title="<?php printf( __( 'Edit %s', 'embroidery' ), __( 'Column', 'embroidery' ) ); ?>">
					<i class="eicon-column" aria-hidden="true"></i>
					<span class="embroidery-screen-only"><?php printf( __( 'Edit %s', 'embroidery' ), __( 'Column', 'embroidery' ) ); ?></span>
				</li>
				<?php foreach ( self::get_edit_tools() as $edit_tool_name => $edit_tool ) : ?>
					<li class="embroidery-editor-element-setting embroidery-editor-element-<?php echo $edit_tool_name; ?>" title="<?php echo $edit_tool['title']; ?>">
						<i class="eicon-<?php echo $edit_tool['icon']; ?>" aria-hidden="true"></i>
						<span class="embroidery-screen-only"><?php echo $edit_tool['title']; ?></span>
					</li>
				<?php endforeach; ?>
			</ul>
			<div class="embroidery-column-percents-tooltip"></div>
		</div>
		<?php
	}

	/**
	 * Render column output in the editor.
	 *
	 * Used to generate the live preview, using a Backbone JavaScript template.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<div class="embroidery-column-wrap">
			<div class="embroidery-background-overlay"></div>
			<div class="embroidery-widget-wrap"></div>
		</div>
		<?php
	}

	/**
	 * Before column rendering.
	 *
	 * Used to add stuff before the column element.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function before_render() {
		$settings = $this->get_settings();

		$has_background_overlay = in_array( $settings['background_overlay_background'], [ 'classic', 'gradient' ] ) ||
								  in_array( $settings['background_overlay_hover_background'], [ 'classic', 'gradient' ] );

		$column_wrap_class = 'embroidery-column-wrap';
		if ( $this->get_children() ) {
			$column_wrap_class .= ' embroidery-element-populated';
		}
		?>
		<<?php echo $this->get_html_tag() . ' ' . $this->get_render_attribute_string( '_wrapper' ); ?>>
			<div class="<?php echo $column_wrap_class; ?>">
			<?php if ( $has_background_overlay ) : ?>
				<div class="embroidery-background-overlay"></div>
			<?php endif; ?>
		<div class="embroidery-widget-wrap">
		<?php
	}

	/**
	 * After column rendering.
	 *
	 * Used to add stuff after the column element.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function after_render() {
		?>
				</div>
			</div>
		</<?php echo $this->get_html_tag(); ?>>
		<?php
	}

	/**
	 * Add column render attributes.
	 *
	 * Used to add render attributes to the column element.
	 *
	 * @since 1.3.0
	 * @access protected
	 */
	protected function _add_render_attributes() {
		parent::_add_render_attributes();

		$is_inner = $this->get_data( 'isInner' );

		$column_type = ! empty( $is_inner ) ? 'inner' : 'top';

		$settings = $this->get_settings();

		$this->add_render_attribute(
			'_wrapper', 'class', [
				'embroidery-column',
				'embroidery-col-' . $settings['_column_size'],
				'embroidery-' . $column_type . '-column',
			]
		);

		$this->add_render_attribute( '_wrapper', 'data-element_type', $this->get_name() );
	}

	/**
	 * Get default child type.
	 *
	 * Retrieve the column child type based on element data.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @param array $element_data Element ID.
	 *
	 * @return Element_Base Column default child type.
	 */
	protected function _get_default_child_type( array $element_data ) {
		if ( 'section' === $element_data['elType'] ) {
			return Plugin::$instance->elements_manager->get_element_types( 'section' );
		}

		return Plugin::$instance->widgets_manager->get_widget_types( $element_data['widgetType'] );
	}

	/**
	 * Get HTML tag.
	 *
	 * Retrieve the column element HTML tag.
	 *
	 * @since 1.5.3
	 * @access private
	 *
	 * @return string Column HTML tag.
	 */
	private function get_html_tag() {
		$html_tag = $this->get_settings( 'html_tag' );

		if ( empty( $html_tag ) ) {
			$html_tag = 'div';
		}

		return $html_tag;
	}
}
