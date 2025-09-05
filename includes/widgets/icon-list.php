<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery icon list widget.
 *
 * Embroidery widget that displays a bullet list with any chosen icons and texts.
 *
 * @since 1.0.0
 */
class Widget_Icon_List extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve icon list widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'icon-list';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve icon list widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Icon List', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve icon list widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-bullet-list';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the icon list widget belongs to.
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
	 * Register icon list widget controls.
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
				'label' => __( 'Icon List', 'embroidery' ),
			]
		);

		$this->add_control(
			'icon_list',
			[
				'label' => '',
				'type' => Controls_Manager::REPEATER,
				'default' => [
					[
						'text' => __( 'List Item #1', 'embroidery' ),
						'icon' => 'fa fa-check',
					],
					[
						'text' => __( 'List Item #2', 'embroidery' ),
						'icon' => 'fa fa-times',
					],
					[
						'text' => __( 'List Item #3', 'embroidery' ),
						'icon' => 'fa fa-dot-circle-o',
					],
				],
				'fields' => [
					[
						'name' => 'text',
						'label' => __( 'Text', 'embroidery' ),
						'type' => Controls_Manager::TEXT,
						'label_block' => true,
						'placeholder' => __( 'List Item', 'embroidery' ),
						'default' => __( 'List Item', 'embroidery' ),
					],
					[
						'name' => 'icon',
						'label' => __( 'Icon', 'embroidery' ),
						'type' => Controls_Manager::ICON,
						'label_block' => true,
						'default' => 'fa fa-check',
					],
					[
						'name' => 'link',
						'label' => __( 'Link', 'embroidery' ),
						'type' => Controls_Manager::URL,
						'label_block' => true,
						'placeholder' => __( 'https://your-link.com', 'embroidery' ),
					],
				],
				'title_field' => '<i class="{{ icon }}" aria-hidden="true"></i> {{{ text }}}',
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
			'section_icon_list',
			[
				'label' => __( 'List', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_responsive_control(
			'space_between',
			[
				'label' => __( 'Space Between', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'max' => 50,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-item:not(:last-child)' => 'padding-bottom: calc({{SIZE}}{{UNIT}}/2)',
					'{{WRAPPER}} .embroidery-icon-list-item:not(:first-child)' => 'margin-top: calc({{SIZE}}{{UNIT}}/2)',
				],
			]
		);

		$this->add_responsive_control(
			'icon_align',
			[
				'label' => __( 'Alignment', 'embroidery' ),
				'type' => Controls_Manager::CHOOSE,
				'options' => [
					'left' => [
						'title' => __( 'Start', 'embroidery' ),
						'icon' => 'eicon-h-align-left',
					],
					'center' => [
						'title' => __( 'Center', 'embroidery' ),
						'icon' => 'eicon-h-align-center',
					],
					'right' => [
						'title' => __( 'End', 'embroidery' ),
						'icon' => 'eicon-h-align-right',
					],
				],
				'prefix_class' => 'embroidery%s-align-',
				'classes' => 'embroidery-control-start-end',
			]
		);

		$this->add_control(
			'divider',
			[
				'label' => __( 'Divider', 'embroidery' ),
				'type' => Controls_Manager::SWITCHER,
				'label_off' => __( 'Off', 'embroidery' ),
				'label_on' => __( 'On', 'embroidery' ),
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-item:not(:last-child):after' => 'content: ""',
				],
				'separator' => 'before',
			]
		);

		$this->add_control(
			'divider_style',
			[
				'label' => __( 'Style', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'options' => [
					'solid' => __( 'Solid', 'embroidery' ),
					'double' => __( 'Double', 'embroidery' ),
					'dotted' => __( 'Dotted', 'embroidery' ),
					'dashed' => __( 'Dashed', 'embroidery' ),
				],
				'default' => 'solid',
				'condition' => [
					'divider' => 'yes',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-item:not(:last-child):after' => 'border-top-style: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'divider_weight',
			[
				'label' => __( 'Weight', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 1,
				],
				'range' => [
					'px' => [
						'min' => 1,
						'max' => 10,
					],
				],
				'condition' => [
					'divider' => 'yes',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-item:not(:last-child):after' => 'border-top-width: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_control(
			'divider_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '#ddd',
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_3,
				],
				'condition' => [
					'divider' => 'yes',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-item:not(:last-child):after' => 'border-top-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'divider_width',
			[
				'label' => __( 'Width', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'units' => [ '%' ],
				'default' => [
					'unit' => '%',
				],
				'condition' => [
					'divider' => 'yes',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-item:not(:last-child):after' => 'width: {{SIZE}}{{UNIT}}',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_icon_style',
			[
				'label' => __( 'Icon', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'icon_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-icon i' => 'color: {{VALUE}};',
				],
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_1,
				],
			]
		);

		$this->add_responsive_control(
			'icon_size',
			[
				'label' => __( 'Size', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'default' => [
					'size' => 14,
				],
				'range' => [
					'px' => [
						'min' => 6,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-icon' => 'width: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .embroidery-icon-list-icon i' => 'font-size: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_text_style',
			[
				'label' => __( 'Text', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'text_indent',
			[
				'label' => __( 'Text Indent', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'range' => [
					'px' => [
						'max' => 50,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-icon-list-text' => is_rtl() ? 'padding-right: {{SIZE}}{{UNIT}};' : 'padding-left: {{SIZE}}{{UNIT}};',
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
					'{{WRAPPER}} .embroidery-icon-list-text' => 'color: {{VALUE}};',
				],
				'scheme' => [
					'type' => Scheme_Color::get_type(),
					'value' => Scheme_Color::COLOR_2,
				],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'icon_typography',
				'selector' => '{{WRAPPER}} .embroidery-icon-list-item',
				'scheme' => Scheme_Typography::TYPOGRAPHY_3,
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Render icon list widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();
		?>
		<ul class="embroidery-icon-list-items">
			<?php foreach ( $settings['icon_list'] as $index => $item ) :
				$repeater_setting_key = $this->get_repeater_setting_key( 'text', 'icon_list', $index );

				$this->add_render_attribute( $repeater_setting_key, 'class', 'embroidery-icon-list-text' );

				$this->add_inline_editing_attributes( $repeater_setting_key );
				?>
				<li class="embroidery-icon-list-item" >
					<?php
					if ( ! empty( $item['link']['url'] ) ) {
						$link_key = 'link_' . $index;

						$this->add_render_attribute( $link_key, 'href', $item['link']['url'] );

						if ( $item['link']['is_external'] ) {
							$this->add_render_attribute( $link_key, 'target', '_blank' );
						}

						if ( $item['link']['nofollow'] ) {
							$this->add_render_attribute( $link_key, 'rel', 'nofollow' );
						}

						echo '<a ' . $this->get_render_attribute_string( $link_key ) . '>';
					}

					if ( $item['icon'] ) :
					?>
						<span class="embroidery-icon-list-icon">
							<i class="<?php echo esc_attr( $item['icon'] ); ?>" aria-hidden="true"></i>
						</span>
					<?php endif; ?>
					<span <?php echo $this->get_render_attribute_string( $repeater_setting_key ); ?>><?php echo $item['text']; ?></span>
					<?php
					if ( ! empty( $item['link']['url'] ) ) {
						echo '</a>';
					}
					?>
				</li>
				<?php
			endforeach;
			?>
		</ul>
		<?php
	}

	/**
	 * Render icon list widget output in the editor.
	 *
	 * Written as a Backbone JavaScript template and used to generate the live preview.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<ul class="embroidery-icon-list-items">
			<#
			if ( settings.icon_list ) {
				_.each( settings.icon_list, function( item, index ) {
					var iconTextKey = view.getRepeaterSettingKey( 'text', 'icon_list', index );

					view.addRenderAttribute( iconTextKey, 'class', 'embroidery-icon-list-text' );

					view.addInlineEditingAttributes( iconTextKey );
					#>
					<li class="embroidery-icon-list-item">
						<# if ( item.link && item.link.url ) { #>
							<a href="{{ item.link.url }}">
						<# } #>
						<span class="embroidery-icon-list-icon">
							<i class="{{ item.icon }}" aria-hidden="true"></i>
						</span>
						<span {{{ view.getRenderAttributeString( iconTextKey ) }}}>{{{ item.text }}}</span>
						<# if ( item.link && item.link.url ) { #>
							</a>
						<# } #>
					</li>
				<#
				} );
			} #>
		</ul>
		<?php
	}
}
