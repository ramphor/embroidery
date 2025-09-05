<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery accordion widget.
 *
 * Embroidery widget that displays a collapsible display of content in an
 * accordion style, showing only one item at a time.
 *
 * @since 1.0.0
 */
class Widget_Accordion extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve accordion widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'accordion';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve accordion widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Accordion', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve accordion widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-accordion';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the accordion widget belongs to.
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
	 * Register accordion widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_title',
			[
				'label' => __( 'Accordion', 'embroidery' ),
			]
		);

		$this->add_control(
			'tabs',
			[
				'label' => __( 'Accordion Items', 'embroidery' ),
				'type' => Controls_Manager::REPEATER,
				'default' => [
					[
						'tab_title' => __( 'Accordion #1', 'embroidery' ),
						'tab_content' => __( 'I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'embroidery' ),
					],
					[
						'tab_title' => __( 'Accordion #2', 'embroidery' ),
						'tab_content' => __( 'I am item content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'embroidery' ),
					],
				],
				'fields' => [
					[
						'name' => 'tab_title',
						'label' => __( 'Title & Content', 'embroidery' ),
						'type' => Controls_Manager::TEXT,
						'default' => __( 'Accordion Title' , 'embroidery' ),
						'label_block' => true,
					],
					[
						'name' => 'tab_content',
						'label' => __( 'Content', 'embroidery' ),
						'type' => Controls_Manager::WYSIWYG,
						'default' => __( 'Accordion Content', 'embroidery' ),
						'show_label' => false,
					],
				],
				'title_field' => '{{{ tab_title }}}',
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

		$this->add_control(
			'title_html_tag',
			[
				'label' => __( 'Title HTML Tag', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'h1' => 'H1',
					'h2' => 'H2',
					'h3' => 'H3',
					'h4' => 'H4',
					'h5' => 'H5',
					'h6' => 'H6',
					'div' => 'div',
				],
				'default' => 'div',
				'separator' => 'before',
			]
		);

		$this->add_control(
			'icon',
			[
				'label' => __( 'Icon', 'embroidery' ),
				'type' => Controls_Manager::ICON,
				'default' => 'fa fa-plus',
				'label_block' => true,
			]
		);

		$this->add_control(
			'icon_active',
			[
				'label' => __( 'Active Icon', 'embroidery' ),
				'type' => Controls_Manager::ICON,
				'default' => 'fa fa-minus',
				'label_block' => true,
				'condition' => [
					'icon!' => '',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_title_style',
			[
				'label' => __( 'Accordion', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'border_width',
			[
				'label' => __( 'Border Width', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 10,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-item' => 'border-width: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-item .embroidery-tab-content' => 'border-width: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-item .embroidery-tab-title.embroidery-active' => 'border-width: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_control(
			'border_color',
			[
				'label' => __( 'Border Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-item' => 'border-color: {{VALUE}};',
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-item .embroidery-tab-content' => 'border-top-color: {{VALUE}};',
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-item .embroidery-tab-title.embroidery-active' => 'border-bottom-color: {{VALUE}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_toggle_style_title',
			[
				'label' => __( 'Title', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'title_background',
			[
				'label' => __( 'Background', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-title' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'title_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-title' => 'color: {{VALUE}};',
				],
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_1,
				],
			]
		);

		$this->add_control(
			'tab_active_color',
			[
				'label' => __( 'Active Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-title.embroidery-active' => 'color: {{VALUE}};',
				],
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_4,
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'title_typography',
				'selector' => '{{WRAPPER}} .embroidery-accordion .embroidery-tab-title',
				'scheme' => Scheme_Typography::TYPOGRAPHY_1,
			]
		);

		$this->add_responsive_control(
			'title_padding',
			[
				'label' => __( 'Padding', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-title' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_toggle_style_icon',
			[
				'label' => __( 'Icon', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'icon!' => '',
				],
			]
		);

		$this->add_control(
			'icon_align',
			[
				'label' => __( 'Alignment', 'embroidery' ),
				'type' => Controls_Manager::CHOOSE,
				'options' => [
					'left' => [
						'title' => __( 'Start', 'embroidery' ),
						'icon' => 'eicon-h-align-left',
					],
					'right' => [
						'title' => __( 'End', 'embroidery' ),
						'icon' => 'eicon-h-align-right',
					],
				],
				'default' => is_rtl() ? 'right' : 'left',
				'toggle' => false,
				'label_block' => false,
				'condition' => [
					'icon!' => '',
				],
			]
		);

		$this->add_control(
			'icon_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-title .embroidery-accordion-icon .fa:before' => 'color: {{VALUE}};',
				],
				'condition' => [
					'icon!' => '',
				],
			]
		);

		$this->add_control(
			'icon_active_color',
			[
				'label' => __( 'Active Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-title.embroidery-active .embroidery-accordion-icon .fa:before' => 'color: {{VALUE}};',
				],
				'condition' => [
					'icon!' => '',
				],
			]
		);

		$this->add_responsive_control(
			'icon_space',
			[
				'label' => __( 'Spacing', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 100,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-icon.embroidery-accordion-icon-left' => 'margin-right: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .embroidery-accordion .embroidery-accordion-icon.embroidery-accordion-icon-right' => 'margin-left: {{SIZE}}{{UNIT}};',
				],
				'condition' => [
					'icon!' => '',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_toggle_style_content',
			[
				'label' => __( 'Content', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'icon!' => '',
				],
			]
		);

		$this->add_control(
			'content_background_color',
			[
				'label' => __( 'Background', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-content' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'content_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-content' => 'color: {{VALUE}};',
				],
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_3,
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'content_typography',
				'selector' => '{{WRAPPER}} .embroidery-accordion .embroidery-tab-content',
				'scheme' => Scheme_Typography::TYPOGRAPHY_3,
			]
		);

		$this->add_responsive_control(
			'content_padding',
			[
				'label' => __( 'Padding', 'embroidery' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'selectors' => [
					'{{WRAPPER}} .embroidery-accordion .embroidery-tab-content' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render accordion widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();

		$id_int = substr( $this->get_id_int(), 0, 3 );
		?>
		<div class="embroidery-accordion" role="tablist">
			<?php foreach ( $settings['tabs'] as $index => $item ) :
				$tab_count = $index + 1;

				$tab_title_setting_key = $this->get_repeater_setting_key( 'tab_title', 'tabs', $index );

				$tab_content_setting_key = $this->get_repeater_setting_key( 'tab_content', 'tabs', $index );

				$this->add_render_attribute( $tab_title_setting_key, [
					'id' => 'embroidery-tab-title-' . $id_int . $tab_count,
					'class' => [ 'embroidery-tab-title' ],
					'tabindex' => $id_int . $tab_count,
					'data-tab' => $tab_count,
					'role' => 'tab',
					'aria-controls' => 'embroidery-tab-content-' . $id_int . $tab_count,
				] );

				$this->add_render_attribute( $tab_content_setting_key, [
					'id' => 'embroidery-tab-content-' . $id_int . $tab_count,
					'class' => [ 'embroidery-tab-content', 'embroidery-clearfix' ],
					'data-tab' => $tab_count,
					'role' => 'tabpanel',
					'aria-labelledby' => 'embroidery-tab-title-' . $id_int . $tab_count,
				] );

				$this->add_inline_editing_attributes( $tab_content_setting_key, 'advanced' );
				?>
				<div class="embroidery-accordion-item">
					<<?php echo $settings['title_html_tag']; ?> <?php echo $this->get_render_attribute_string( $tab_title_setting_key ); ?>>
						<?php if ( $settings['icon'] ) : ?>
						<span class="embroidery-accordion-icon embroidery-accordion-icon-<?php echo esc_attr( $settings['icon_align'] ); ?>" aria-hidden="true">
							<i class="embroidery-accordion-icon-closed <?php echo esc_attr( $settings['icon'] ); ?>"></i>
							<i class="embroidery-accordion-icon-opened <?php echo esc_attr( $settings['icon_active'] ); ?>"></i>
						</span>
						<?php endif; ?>
						<?php echo $item['tab_title']; ?>
					</<?php echo $settings['title_html_tag']; ?>>
					<div <?php echo $this->get_render_attribute_string( $tab_content_setting_key ); ?>><?php echo $this->parse_text_editor( $item['tab_content'] ); ?></div>
				</div>
			<?php endforeach; ?>
		</div>
		<?php
	}

	/**
	 * Render accordion widget output in the editor.
	 *
	 * Written as a Backbone JavaScript template and used to generate the live preview.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<div class="embroidery-accordion" role="tablist">
			<#
			if ( settings.tabs ) {
				var tabindex = view.getIDInt().toString().substr( 0, 3 );

				_.each( settings.tabs, function( item, index ) {
					var tabCount = index + 1,
						tabTitleKey = view.getRepeaterSettingKey( 'tab_title', 'tabs', index ),
						tabContentKey = view.getRepeaterSettingKey( 'tab_content', 'tabs', index );

					view.addRenderAttribute( tabTitleKey, {
						'id': 'embroidery-tab-title-' + tabindex + tabCount,
						'class': [ 'embroidery-tab-title' ],
						'tabindex': tabindex + tabCount,
						'data-tab': tabCount,
						'role': 'tab',
						'aria-controls': 'embroidery-tab-content-' + tabindex + tabCount
					} );

					view.addRenderAttribute( tabContentKey, {
						'id': 'embroidery-tab-content-' + tabindex + tabCount,
						'class': [ 'embroidery-tab-content', 'embroidery-clearfix' ],
						'data-tab': tabCount,
						'role': 'tabpanel',
						'aria-labelledby': 'embroidery-tab-title-' + tabindex + tabCount
					} );

					view.addInlineEditingAttributes( tabContentKey, 'advanced' );
					#>
					<div class="embroidery-accordion-item">
						<{{{ settings.title_html_tag }}} {{{ view.getRenderAttributeString( tabTitleKey ) }}}>
							<# if ( settings.icon ) { #>
							<span class="embroidery-accordion-icon embroidery-accordion-icon-{{ settings.icon_align }}" aria-hidden="true">
								<i class="embroidery-accordion-icon-closed {{ settings.icon }}"></i>
								<i class="embroidery-accordion-icon-opened {{ settings.icon_active }}"></i>
							</span>
							<# } #>
							{{{ item.tab_title }}}
						</{{{ settings.title_html_tag }}}>
						<div {{{ view.getRenderAttributeString( tabContentKey ) }}}>{{{ item.tab_content }}}</div>
					</div>
					<#
				} );
			} #>
		</div>
		<?php
	}
}
