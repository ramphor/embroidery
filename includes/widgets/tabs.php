<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery tabs widget.
 *
 * Embroidery widget that displays vertical or horizontal tabs with different
 * pieces of content.
 *
 * @since 1.0.0
 */
class Widget_Tabs extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve tabs widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'tabs';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve tabs widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Tabs', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve tabs widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-tabs';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the tabs widget belongs to.
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
	 * Register tabs widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_tabs',
			[
				'label' => __( 'Tabs', 'embroidery' ),
			]
		);

		$this->add_control(
			'tabs',
			[
				'label' => __( 'Tabs Items', 'embroidery' ),
				'type' => Controls_Manager::REPEATER,
				'default' => [
					[
						'tab_title' => __( 'Tab #1', 'embroidery' ),
						'tab_content' => __( 'I am tab content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'embroidery' ),
					],
					[
						'tab_title' => __( 'Tab #2', 'embroidery' ),
						'tab_content' => __( 'I am tab content. Click edit button to change this text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.', 'embroidery' ),
					],
				],
				'fields' => [
					[
						'name' => 'tab_title',
						'label' => __( 'Title & Content', 'embroidery' ),
						'type' => Controls_Manager::TEXT,
						'default' => __( 'Tab Title', 'embroidery' ),
						'placeholder' => __( 'Tab Title', 'embroidery' ),
						'label_block' => true,
					],
					[
						'name' => 'tab_content',
						'label' => __( 'Content', 'embroidery' ),
						'default' => __( 'Tab Content', 'embroidery' ),
						'placeholder' => __( 'Tab Content', 'embroidery' ),
						'type' => Controls_Manager::WYSIWYG,
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
			'type',
			[
				'label' => __( 'Type', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'horizontal',
				'options' => [
					'horizontal' => __( 'Horizontal', 'embroidery' ),
					'vertical' => __( 'Vertical', 'embroidery' ),
				],
				'prefix_class' => 'embroidery-tabs-view-',
				'separator' => 'before',
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_tabs_style',
			[
				'label' => __( 'Tabs', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'navigation_width',
			[
				'label' => __( 'Navigation Width', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'unit' => '%',
				],
				'range' => [
					'%' => [
						'min' => 10,
						'max' => 50,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-tabs-wrapper' => 'width: {{SIZE}}{{UNIT}}',
				],
				'condition' => [
					'type' => 'vertical',
				],
			]
		);

		$this->add_control(
			'border_width',
			[
				'label' => __( 'Border Width', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 1,
				],
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 10,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-tab-title, {{WRAPPER}} .embroidery-tab-title:before, {{WRAPPER}} .embroidery-tab-title:after, {{WRAPPER}} .embroidery-tab-content, {{WRAPPER}} .embroidery-tabs-content-wrapper' => 'border-width: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_control(
			'border_color',
			[
				'label' => __( 'Border Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-tab-mobile-title, {{WRAPPER}} .embroidery-tab-desktop-title.embroidery-active, {{WRAPPER}} .embroidery-tab-title:before, {{WRAPPER}} .embroidery-tab-title:after, {{WRAPPER}} .embroidery-tab-content, {{WRAPPER}} .embroidery-tabs-content-wrapper' => 'border-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'background_color',
			[
				'label' => __( 'Background Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-tab-desktop-title.embroidery-active' => 'background-color: {{VALUE}};',
					'{{WRAPPER}} .embroidery-tabs-content-wrapper' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'heading_title',
			[
				'label' => __( 'Title', 'embroidery' ),
				'type' => Controls_Manager::HEADING,
				'separator' => 'before',
			]
		);

		$this->add_control(
			'tab_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-tab-title' => 'color: {{VALUE}};',
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
					'{{WRAPPER}} .embroidery-tab-title.embroidery-active' => 'color: {{VALUE}};',
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
				'name' => 'tab_typography',
				'selector' => '{{WRAPPER}} .embroidery-tab-title',
				'scheme' => Scheme_Typography::TYPOGRAPHY_1,
			]
		);

		$this->add_control(
			'heading_content',
			[
				'label' => __( 'Content', 'embroidery' ),
				'type' => Controls_Manager::HEADING,
				'separator' => 'before',
			]
		);

		$this->add_control(
			'content_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-tab-content' => 'color: {{VALUE}};',
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
				'selector' => '{{WRAPPER}} .embroidery-tab-content',
				'scheme' => Scheme_Typography::TYPOGRAPHY_3,
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render tabs widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$tabs = $this->get_settings( 'tabs' );

		$id_int = substr( $this->get_id_int(), 0, 3 );
		?>
		<div class="embroidery-tabs" role="tablist">
			<div class="embroidery-tabs-wrapper">
				<?php foreach ( $tabs as $index => $item ) :
					$tab_count = $index + 1;

					$tab_title_setting_key = $this->get_repeater_setting_key( 'tab_title', 'tabs', $index );

					$this->add_render_attribute( $tab_title_setting_key, [
						'id' => 'embroidery-tab-title-' . $id_int . $tab_count,
						'class' => [ 'embroidery-tab-title', 'embroidery-tab-desktop-title' ],
						'data-tab' => $tab_count,
						'tabindex' => $id_int . $tab_count,
						'role' => 'tab',
						'aria-controls' => 'embroidery-tab-content-' . $id_int . $tab_count,
					] );
					?>
					<div <?php echo $this->get_render_attribute_string( $tab_title_setting_key ); ?>><?php echo $item['tab_title']; ?></div>
				<?php endforeach; ?>
			</div>
			<div class="embroidery-tabs-content-wrapper">
				<?php foreach ( $tabs as $index => $item ) :
					$tab_count = $index + 1;

					$tab_content_setting_key = $this->get_repeater_setting_key( 'tab_content', 'tabs', $index );

					$tab_title_mobile_setting_key = $this->get_repeater_setting_key( 'tab_title_mobile', 'tabs', $tab_count );

					$this->add_render_attribute( $tab_content_setting_key, [
						'id' => 'embroidery-tab-content-' . $id_int . $tab_count,
						'class' => [ 'embroidery-tab-content', 'embroidery-clearfix' ],
						'data-tab' => $tab_count,
						'role' => 'tabpanel',
						'aria-labelledby' => 'embroidery-tab-title-' . $id_int . $tab_count,
					] );

					$this->add_render_attribute( $tab_title_mobile_setting_key, [
						'class' => [ 'embroidery-tab-title', 'embroidery-tab-mobile-title' ],
						'tabindex' => $id_int . $tab_count,
						'data-tab' => $tab_count,
						'role' => 'tab',
					] );

					$this->add_inline_editing_attributes( $tab_content_setting_key, 'advanced' );
					?>
					<div <?php echo $this->get_render_attribute_string( $tab_title_mobile_setting_key ); ?>><?php echo $item['tab_title']; ?></div>
					<div <?php echo $this->get_render_attribute_string( $tab_content_setting_key ); ?>><?php echo $this->parse_text_editor( $item['tab_content'] ); ?></div>
				<?php endforeach; ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Render tabs widget output in the editor.
	 *
	 * Written as a Backbone JavaScript template and used to generate the live preview.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<div class="embroidery-tabs" role="tablist">
			<#
			if ( settings.tabs ) {
				var tabindex = view.getIDInt().toString().substr( 0, 3 );
				#>
				<div class="embroidery-tabs-wrapper">
					<#
					_.each( settings.tabs, function( item, index ) {
						var tabCount = index + 1;
						#>
						<div id="embroidery-tab-title-{{ tabindex + tabCount }}" class="embroidery-tab-title embroidery-tab-desktop-title" tabindex="{{ tabindex + tabCount }}" data-tab="{{ tabCount }}" role="tab" aria-controls="embroidery-tab-content-{{ tabindex + tabCount }}">{{{ item.tab_title }}}</div>
					<# } ); #>
				</div>
				<div class="embroidery-tabs-content-wrapper">
					<#
					_.each( settings.tabs, function( item, index ) {
						var tabCount = index + 1,
							tabContentKey = view.getRepeaterSettingKey( 'tab_content', 'tabs',index );

						view.addRenderAttribute( tabContentKey, {
							'id': 'embroidery-tab-content-' + tabindex + tabCount,
							'class': [ 'embroidery-tab-content', 'embroidery-clearfix', 'embroidery-repeater-item-' + item._id ],
							'data-tab': tabCount,
							'role' : 'tabpanel',
							'aria-labelledby' : 'embroidery-tab-title-' + tabindex + tabCount
						} );

						view.addInlineEditingAttributes( tabContentKey, 'advanced' );
						#>
						<div class="embroidery-tab-title embroidery-tab-mobile-title" data-tab="{{ tabCount }}" role="tab">{{{ item.tab_title }}}</div>
						<div {{{ view.getRenderAttributeString( tabContentKey ) }}}>{{{ item.tab_content }}}</div>
					<# } ); #>
				</div>
			<# } #>
		</div>
		<?php
	}
}
