<?php
namespace Embroidery\Core\Settings\General;

use Embroidery\Controls_Manager;
use Embroidery\Core\Settings\Base\Model as BaseModel;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Model extends BaseModel {

	/**
	 * @since 1.6.0
	 * @access public
	 */
	public function get_name() {
		return 'global-settings';
	}

	/**
	 * @since 1.6.0
	 * @access public
	 */
	public function get_css_wrapper_selector() {
		return '';
	}

	/**
	 * @since 1.6.0
	 * @access public
	 */
	public function get_panel_page_settings() {
		return [
			'title' => __( 'Global Settings', 'embroidery' ),
			'menu' => [
				'icon' => 'fa fa-cogs',
				'beforeItem' => 'embroidery-settings',
			],
		];
	}

	/**
	 * @since 1.6.0
	 * @access public
	 * @static
	 */
	public static function get_controls_list() {

		return [
			Controls_Manager::TAB_STYLE => [
				'style' => [
					'label' => __( 'Style', 'embroidery' ),
					'controls' => [
						'embroidery_default_generic_fonts' => [
							'label' => __( 'Default Generic Fonts', 'embroidery' ),
							'type' => Controls_Manager::TEXT,
							'default' => 'Sans-serif',
							'description' => __( 'The list of fonts used if the chosen font is not available.', 'embroidery' ),
							'label_block' => true,
						],
						'embroidery_container_width' => [
							'label' => __( 'Content Width', 'embroidery' ) . ' (px)',
							'type' => Controls_Manager::NUMBER,
							'min' => 0,
							'description' => __( 'Sets the default width of the content area (Default: 1140)', 'embroidery' ),
							'selectors' => [
								'.embroidery-section.embroidery-section-boxed > .embroidery-container' => 'max-width: {{VALUE}}px',
							],
						],
						'embroidery_space_between_widgets' => [
							'label' => __( 'Widgets Space', 'embroidery' ) . ' (px)',
							'type' => Controls_Manager::NUMBER,
							'min' => 0,
							'placeholder' => '20',
							'description' => __( 'Sets the default space between widgets (Default: 20)', 'embroidery' ),
							'selectors' => [
								'.embroidery-widget:not(:last-child)' => 'margin-bottom: {{VALUE}}px',
							],
						],
						'embroidery_stretched_section_container' => [
							'label' => __( 'Stretched Section Fit To', 'embroidery' ),
							'type' => Controls_Manager::TEXT,
							'placeholder' => 'body',
							'description' => __( 'Enter parent element selector to which stretched sections will fit to (e.g. #primary / .wrapper / main etc). Leave blank to fit to page width.', 'embroidery' ),
							'label_block' => true,
							'frontend_available' => true,
						],
						'embroidery_page_title_selector' => [
							'label' => __( 'Page Title Selector', 'embroidery' ),
							'type' => Controls_Manager::TEXT,
							'placeholder' => 'h1.entry-title',
							'description' => __( 'Embroidery lets you hide the page title. This works for themes that have "h1.entry-title" selector. If your theme\'s selector is different, please enter it above.', 'embroidery' ),
							'label_block' => true,
						],
					],
				],
			],
			Manager::PANEL_TAB_LIGHTBOX => [
				'lightbox' => [
					'label' => __( 'Lightbox', 'embroidery' ),
					'controls' => [
						'embroidery_global_image_lightbox' => [
							'label' => __( 'Image Lightbox', 'embroidery' ),
							'type' => Controls_Manager::SWITCHER,
							'default' => 'yes',
							'description' => __( 'Open all image links in a lightbox popup window. The lightbox will automatically work on any link that leads to an image file.', 'embroidery' ),
							'frontend_available' => true,
						],
						'embroidery_enable_lightbox_in_editor' => [
							'label' => __( 'Enable In Editor', 'embroidery' ),
							'type' => Controls_Manager::SWITCHER,
							'default' => 'yes',
							'description' => __( '', 'embroidery' ),
							'frontend_available' => true,
						],
						'embroidery_lightbox_color' => [
							'label' => __( 'Background Color', 'embroidery' ),
							'type' => Controls_Manager::COLOR,
							'selectors' => [
								'.embroidery-lightbox' => 'background-color: {{VALUE}}',
							],
						],
						'embroidery_lightbox_ui_color' => [
							'label' => __( 'UI Color', 'embroidery' ),
							'type' => Controls_Manager::COLOR,
							'selectors' => [
								'.embroidery-lightbox .dialog-lightbox-close-button, .embroidery-lightbox .embroidery-swiper-button' => 'color: {{VALUE}}',
							],
						],
						'embroidery_lightbox_ui_color_hover' => [
							'label' => __( 'UI Hover Color', 'embroidery' ),
							'type' => Controls_Manager::COLOR,
							'selectors' => [
								'.embroidery-lightbox .dialog-lightbox-close-button:hover, .embroidery-lightbox .embroidery-swiper-button:hover' => 'color: {{VALUE}}',
							],
						],
					],
				],
			],
		];
	}

	/**
	 * @since 1.6.0
	 * @access protected
	 */
	protected function _register_controls() {
		$controls_list = self::get_controls_list();

		foreach ( $controls_list as $tab_name => $sections ) {

			foreach ( $sections as $section_name => $section_data ) {

				$this->start_controls_section(
					$section_name, [
						'label' => $section_data['label'],
						'tab' => $tab_name,
					]
				);

				foreach ( $section_data['controls'] as $control_name => $control_data ) {
					$this->add_control( $control_name, $control_data );
				}

				$this->end_controls_section();
			}
		}
	}
}
