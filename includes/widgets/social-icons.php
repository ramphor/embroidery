<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery social icons widget.
 *
 * Embroidery widget that displays icons to social pages like Facebook and Twitter.
 *
 * @since 1.0.0
 */
class Widget_Social_Icons extends Widget_Base {

	/**
	 * Get widget name.
	 *
	 * Retrieve social icons widget name.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget name.
	 */
	public function get_name() {
		return 'social-icons';
	}

	/**
	 * Get widget title.
	 *
	 * Retrieve social icons widget title.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget title.
	 */
	public function get_title() {
		return __( 'Social Icons', 'embroidery' );
	}

	/**
	 * Get widget icon.
	 *
	 * Retrieve social icons widget icon.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Widget icon.
	 */
	public function get_icon() {
		return 'eicon-social-icons';
	}

	/**
	 * Get widget categories.
	 *
	 * Retrieve the list of categories the social icons widget belongs to.
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
	 * Register social icons widget controls.
	 *
	 * Adds different input fields to allow the user to change and customize the widget settings.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _register_controls() {
		$this->start_controls_section(
			'section_social_icon',
			[
				'label' => __( 'Social Icons', 'embroidery' ),
			]
		);

		$this->add_control(
			'social_icon_list',
			[
				'label' => __( 'Social Icons', 'embroidery' ),
				'type' => Controls_Manager::REPEATER,
				'default' => [
					[
						'social' => 'fa fa-facebook',
					],
					[
						'social' => 'fa fa-twitter',
					],
					[
						'social' => 'fa fa-google-plus',
					],
				],
				'fields' => [
					[
						'name' => 'social',
						'label' => __( 'Icon', 'embroidery' ),
						'type' => Controls_Manager::ICON,
						'label_block' => true,
						'default' => 'fa fa-wordpress',
						'include' => [
							'fa fa-apple',
							'fa fa-behance',
							'fa fa-bitbucket',
							'fa fa-codepen',
							'fa fa-delicious',
							'fa fa-digg',
							'fa fa-dribbble',
							'fa fa-envelope',
							'fa fa-facebook',
							'fa fa-flickr',
							'fa fa-foursquare',
							'fa fa-github',
							'fa fa-google-plus',
							'fa fa-houzz',
							'fa fa-instagram',
							'fa fa-jsfiddle',
							'fa fa-linkedin',
							'fa fa-medium',
							'fa fa-odnoklassniki',
							'fa fa-meetup',
							'fa fa-pinterest',
							'fa fa-product-hunt',
							'fa fa-reddit',
							'fa fa-rss',
							'fa fa-shopping-cart',
							'fa fa-skype',
							'fa fa-slideshare',
							'fa fa-snapchat',
							'fa fa-soundcloud',
							'fa fa-spotify',
							'fa fa-stack-overflow',
							'fa fa-telegram',
							'fa fa-tripadvisor',
							'fa fa-tumblr',
							'fa fa-twitch',
							'fa fa-twitter',
							'fa fa-vimeo',
							'fa fa-vk',
							'fa fa-weibo',
							'fa fa-weixin',
							'fa fa-whatsapp',
							'fa fa-wordpress',
							'fa fa-xing',
							'fa fa-yelp',
							'fa fa-youtube',
						],
					],
					[
						'name' => 'link',
						'label' => __( 'Link', 'embroidery' ),
						'type' => Controls_Manager::URL,
						'label_block' => true,
						'default' => [
							'is_external' => 'true',
						],
						'placeholder' => __( 'https://your-link.com', 'embroidery' ),
					],
				],
				'title_field' => '<i class="{{ social }}"></i> {{{ social.replace( \'fa fa-\', \'\' ).replace( \'-\', \' \' ).replace( /\b\w/g, function( letter ){ return letter.toUpperCase() } ) }}}',
			]
		);

		$this->add_control(
			'shape',
			[
				'label' => __( 'Shape', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'rounded',
				'options' => [
					'rounded' => __( 'Rounded', 'embroidery' ),
					'square' => __( 'Square', 'embroidery' ),
					'circle' => __( 'Circle', 'embroidery' ),
				],
				'prefix_class' => 'embroidery-shape-',
			]
		);

		$this->add_responsive_control(
			'align',
			[
				'label' => __( 'Alignment', 'embroidery' ),
				'type' => Controls_Manager::CHOOSE,
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
				'default' => 'center',
				'selectors' => [
					'{{WRAPPER}}' => 'text-align: {{VALUE}};',
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
			'section_social_style',
			[
				'label' => __( 'Icon', 'embroidery' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'icon_color',
			[
				'label' => __( 'Color', 'embroidery' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'default',
				'options' => [
					'default' => __( 'Official Color', 'embroidery' ),
					'custom' => __( 'Custom', 'embroidery' ),
				],
			]
		);

		$this->add_control(
			'icon_primary_color',
			[
				'label' => __( 'Primary Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'condition' => [
					'icon_color' => 'custom',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-social-icon' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'icon_secondary_color',
			[
				'label' => __( 'Secondary Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'condition' => [
					'icon_color' => 'custom',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-social-icon i' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_responsive_control(
			'icon_size',
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
					'{{WRAPPER}} .embroidery-social-icon' => 'font-size: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
			'icon_padding',
			[
				'label' => __( 'Padding', 'embroidery' ),
				'type' => Controls_Manager::SLIDER,
				'selectors' => [
					'{{WRAPPER}} .embroidery-social-icon' => 'padding: {{SIZE}}{{UNIT}};',
				],
				'default' => [
					'unit' => 'em',
				],
				'tablet_default' => [
					'unit' => 'em',
				],
				'mobile_default' => [
					'unit' => 'em',
				],
				'range' => [
					'em' => [
						'min' => 0,
						'max' => 5,
					],
				],
			]
		);

		$icon_spacing = is_rtl() ? 'margin-left: {{SIZE}}{{UNIT}};' : 'margin-right: {{SIZE}}{{UNIT}};';

		$this->add_responsive_control(
			'icon_spacing',
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
					'{{WRAPPER}} .embroidery-social-icon:not(:last-child)' => $icon_spacing,
				],
			]
		);

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'image_border', // We know this mistake - TODO: 'icon_border' (for hover control condition also)
				'selector' => '{{WRAPPER}} .embroidery-social-icon',
				'separator' => 'before',
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
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_social_hover',
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
				'condition' => [
					'icon_color' => 'custom',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-social-icon:hover' => 'background-color: {{VALUE}};',
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
					'icon_color' => 'custom',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-social-icon:hover i' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'hover_border_color',
			[
				'label' => __( 'Border Color', 'embroidery' ),
				'type' => Controls_Manager::COLOR,
				'default' => '',
				'condition' => [
					'image_border_border!' => '',
				],
				'selectors' => [
					'{{WRAPPER}} .embroidery-social-icon:hover' => 'border-color: {{VALUE}};',
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
	 * Render social icons widget output on the frontend.
	 *
	 * Written in PHP and used to generate the final HTML.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function render() {
		$settings = $this->get_settings();

		$class_animation = '';
		if ( ! empty( $settings['hover_animation'] ) ) {
			$class_animation = ' embroidery-animation-' . $settings['hover_animation'];
		}

		?>
		<div class="embroidery-social-icons-wrapper">
			<?php
			foreach ( $settings['social_icon_list'] as $index => $item ) {
				$social = str_replace( 'fa fa-', '', $item['social'] );

				$link_key = 'link_' . $index;

				$this->add_render_attribute( $link_key, 'href', $item['link']['url'] );

				if ( $item['link']['is_external'] ) {
					$this->add_render_attribute( $link_key, 'target', '_blank' );
				}

				if ( $item['link']['nofollow'] ) {
					$this->add_render_attribute( $link_key, 'rel', 'nofollow' );
				}
				?>
				<a class="embroidery-icon embroidery-social-icon embroidery-social-icon-<?php echo $social . $class_animation; ?>" <?php echo $this->get_render_attribute_string( $link_key ); ?>>
					<span class="embroidery-screen-only"><?php echo ucwords( $social ); ?></span>
					<i class="<?php echo $item['social']; ?>"></i>
				</a>
			<?php } ?>
		</div>
		<?php
	}

	/**
	 * Render social icons widget output in the editor.
	 *
	 * Written as a Backbone JavaScript template and used to generate the live preview.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function _content_template() {
		?>
		<div class="embroidery-social-icons-wrapper">
			<# _.each( settings.social_icon_list, function( item ) {
				var link = item.link ? item.link.url : '',
					social = item.social.replace( 'fa fa-', '' ); #>
				<a class="embroidery-icon embroidery-social-icon embroidery-social-icon-{{ social }} embroidery-animation-{{ settings.hover_animation }}" href="{{ link }}">
					<span class="embroidery-screen-only">{{{ social }}}</span>
					<i class="{{ item.social }}"></i>
				</a>
			<# } ); #>
		</div>
		<?php
	}
}
