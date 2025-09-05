<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Settings extends Settings_Page {

	const PAGE_ID = 'embroidery';

	const MENU_PRIORITY_GO_PRO = 502;

	const UPDATE_TIME_FIELD = '_embroidery_settings_update_time';

	const TAB_GENERAL = 'general';
	const TAB_STYLE = 'style';
	const TAB_INTEGRATIONS = 'integrations';
	const TAB_ADVANCED = 'advanced';

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function register_admin_menu() {
		add_menu_page(
			__( 'Embroidery', 'embroidery' ),
			__( 'Embroidery', 'embroidery' ),
			'manage_options',
			self::PAGE_ID,
			[ $this, 'display_settings_page' ],
			'',
			99
		);
	}

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function register_pro_menu() {
		add_submenu_page(
			self::PAGE_ID,
			'',
			'<span class="dashicons dashicons-star-filled" style="font-size: 17px"></span> ' . __( 'Go Pro', 'embroidery' ),
			'manage_options',
			'go_embroidery_pro',
			[ $this, 'go_embroidery_pro' ]
		);
	}

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function go_embroidery_pro() {
		if ( isset( $_GET['page'] ) && 'go_embroidery_pro' === $_GET['page'] ) {
			wp_redirect( Utils::get_pro_link( 'https://embroidery.com/pro/?utm_source=wp-menu&utm_campaign=gopro&utm_medium=wp-dash' ) );
			die;
		}
	}

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function admin_menu_change_name() {
		global $submenu;

		if ( isset( $submenu['embroidery'] ) ) {
			$submenu['embroidery'][0][0] = __( 'Settings', 'embroidery' );

			$hold_menu_data = $submenu['embroidery'][0];
			$submenu['embroidery'][0] = $submenu['embroidery'][1];
			$submenu['embroidery'][1] = $hold_menu_data;
		}
	}

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function __construct() {
		parent::__construct();

		add_action( 'admin_init', [ $this, 'go_embroidery_pro' ] );
		add_action( 'admin_menu', [ $this, 'register_admin_menu' ], 20 );
		add_action( 'admin_menu', [ $this, 'admin_menu_change_name' ], 200 );
		add_action( 'admin_menu', [ $this, 'register_pro_menu' ], self::MENU_PRIORITY_GO_PRO );

		// Clear CSS Meta after change print method.
		add_action( 'add_option_embroidery_css_print_method', [ $this, 'update_css_print_method' ] );
		add_action( 'update_option_embroidery_css_print_method', [ $this, 'update_css_print_method' ] );
	}

	/**
	 * @since 1.7.5
	 * @access public
	*/
	public function update_css_print_method() {
		Plugin::$instance->posts_css_manager->clear_cache();
	}

	/**
	 * @since 1.5.0
	 * @access protected
	*/
	protected function create_tabs() {
		$validations_class_name = __NAMESPACE__ . '\Settings_Validations';

		return [
			self::TAB_GENERAL => [
				'label' => __( 'General', 'embroidery' ),
				'sections' => [
					'general' => [
						'fields' => [
							self::UPDATE_TIME_FIELD => [
								'full_field_id' => self::UPDATE_TIME_FIELD,
								'field_args' => [
									'type' => 'hidden',
								],
								'setting_args' => [
									'sanitize_callback' => 'time',
								],
							],
							'cpt_support' => [
								'label' => __( 'Post Types', 'embroidery' ),
								'field_args' => [
									'type' => 'checkbox_list_cpt',
									'std' => [ 'page', 'post' ],
									'exclude' => [ 'attachment', 'embroidery_library' ],
								],
								'setting_args' => [ $validations_class_name, 'checkbox_list' ],
							],
							'exclude_user_roles' => [
								'label' => __( 'Exclude Roles', 'embroidery' ),
								'field_args' => [
									'type' => 'checkbox_list_roles',
									'exclude' => [ 'administrator' ],
								],
								'setting_args' => [ $validations_class_name, 'checkbox_list' ],
							],
							'disable_color_schemes' => [
								'label' => __( 'Disable Default Colors', 'embroidery' ),
								'field_args' => [
									'type' => 'checkbox',
									'value' => 'yes',
									'sub_desc' => __( 'Checking this box will disable Embroidery\'s Default Colors, and make Embroidery inherit the colors from your theme.', 'embroidery' ),
								],
							],
							'disable_typography_schemes' => [
								'label' => __( 'Disable Default Fonts', 'embroidery' ),
								'field_args' => [
									'type' => 'checkbox',
									'value' => 'yes',
									'sub_desc' => __( 'Checking this box will disable Embroidery\'s Default Fonts, and make Embroidery inherit the fonts from your theme.', 'embroidery' ),
								],
							],
						],
					],
					'usage' => [
						'label' => __( 'Improve Embroidery', 'embroidery' ),
						'fields' => [
							'allow_tracking' => [
								'label' => __( 'Usage Data Tracking', 'embroidery' ),
								'field_args' => [
									'type' => 'checkbox',
									'value' => 'yes',
									'default' => '',
									'sub_desc' => __( 'Opt-in to our anonymous plugin data collection and to updates. We guarantee no sensitive data is collected.', 'embroidery' ) . sprintf( ' <a href="%s" target="_blank">%s</a>', 'https://go.embroidery.com/usage-data-tracking/', __( 'Learn more.', 'embroidery' ) ),
								],
								'setting_args' => [ __NAMESPACE__ . '\Tracker', 'check_for_settings_optin' ],
							],
						],
					],
				],
			],
			self::TAB_STYLE => [
				'label' => __( 'Style', 'embroidery' ),
				'sections' => [
					'style' => [
						'fields' => [
							'default_generic_fonts' => [
								'label' => __( 'Default Generic Fonts', 'embroidery' ),
								'field_args' => [
									'type' => 'text',
									'std' => 'Sans-serif',
									'class' => 'medium-text',
									'desc' => __( 'The list of fonts used if the chosen font is not available.', 'embroidery' ),
								],
							],
							'container_width' => [
								'label' => __( 'Content Width', 'embroidery' ),
								'field_args' => [
									'type' => 'text',
									'placeholder' => '1140',
									'sub_desc' => 'px',
									'class' => 'medium-text',
									'desc' => __( 'Sets the default width of the content area (Default: 1140)', 'embroidery' ),
								],
							],
							'space_between_widgets' => [
								'label' => __( 'Space Between Widgets', 'embroidery' ),
								'field_args' => [
									'type' => 'text',
									'placeholder' => '20',
									'sub_desc' => 'px',
									'class' => 'medium-text',
									'desc' => __( 'Sets the default space between widgets (Default: 20)', 'embroidery' ),
								],
							],
							'stretched_section_container' => [
								'label' => __( 'Stretched Section Fit To', 'embroidery' ),
								'field_args' => [
									'type' => 'text',
									'placeholder' => 'body',
									'class' => 'medium-text',
									'desc' => __( 'Enter parent element selector to which stretched sections will fit to (e.g. #primary / .wrapper / main etc). Leave blank to fit to page width.', 'embroidery' ),
								],
							],
							'page_title_selector' => [
								'label' => __( 'Page Title Selector', 'embroidery' ),
								'field_args' => [
									'type' => 'text',
									'placeholder' => 'h1.entry-title',
									'class' => 'medium-text',
									'desc' => __( 'Embroidery lets you hide the page title. This works for themes that have "h1.entry-title" selector. If your theme\'s selector is different, please enter it above.', 'embroidery' ),
								],
							],
							'global_image_lightbox' => [
								'label' => __( 'Image Lightbox', 'embroidery' ),
								'field_args' => [
									'type' => 'checkbox',
									'value' => 'yes',
									'std' => 'yes',
									'sub_desc' => __( 'Open all image links in a lightbox popup window. The lightbox will automatically work on any link that leads to an image file.', 'embroidery' ),
									'desc' => __( 'You can customize the lightbox design by going to: Top-left hamburger icon > Global Settings > Lightbox.', 'embroidery' ),
								],
							],
						],
					],
				],
			],
			self::TAB_INTEGRATIONS => [
				'label' => __( 'Integrations', 'embroidery' ),
				'sections' => [],
			],
			self::TAB_ADVANCED => [
				'label' => __( 'Advanced', 'embroidery' ),
				'sections' => [
					'advanced' => [
						'fields' => [
							'css_print_method' => [
								'label' => __( 'CSS Print Method', 'embroidery' ),
								'field_args' => [
									'class' => 'embroidery_css_print_method',
									'type' => 'select',
									'options' => [
										'external' => __( 'External File', 'embroidery' ),
										'internal' => __( 'Internal Embedding', 'embroidery' ),
									],
									'desc' => '<div class="embroidery-css-print-method-description" data-value="external" style="display: none">' .
											  __( 'Use external CSS files for all generated stylesheets. Choose this setting for better performance (recommended).', 'embroidery' ) .
											  '</div>' .
											  '<div class="embroidery-css-print-method-description" data-value="internal" style="display: none">' .
											  __( 'Use internal CSS that is embedded in the head of the page. For troubleshooting server configuration conflicts and managing development environments.', 'embroidery' ) .
											  '</div>',
								],
							],
							'editor_break_lines' => [
								'label' => __( 'Switch Editor Loader Method', 'embroidery' ),
								'field_args' => [
									'type' => 'select',
									'options' => [
										'' => __( 'Disable', 'embroidery' ),
										1 => __( 'Enable', 'embroidery' ),
									],
									'desc' => __( 'For troubleshooting server configuration conflicts.', 'embroidery' ),
								],
							],
						],
					],
				],
			],
		];
	}

	/**
	 * @since 1.5.0
	 * @access protected
	*/
	protected function get_page_title() {
		return __( 'Embroidery', 'embroidery' );
	}
}
