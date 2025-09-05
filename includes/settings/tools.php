<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Tools extends Settings_Page {

	const PAGE_ID = 'embroidery-tools';

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function register_admin_menu() {
		add_submenu_page(
			Settings::PAGE_ID,
			__( 'Tools', 'embroidery' ),
			__( 'Tools', 'embroidery' ),
			'manage_options',
			self::PAGE_ID,
			[ $this, 'display_settings_page' ]
		);
	}

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function ajax_embroidery_clear_cache() {
		check_ajax_referer( 'embroidery_clear_cache', '_nonce' );

		Plugin::$instance->posts_css_manager->clear_cache();

		wp_send_json_success();
	}

	/**
	 * @since 1.1.0
	 * @access public
	*/
	public function ajax_embroidery_replace_url() {
		check_ajax_referer( 'embroidery_replace_url', '_nonce' );

		$from = ! empty( $_POST['from'] ) ? trim( $_POST['from'] ) : '';
		$to = ! empty( $_POST['to'] ) ? trim( $_POST['to'] ) : '';

		$is_valid_urls = ( filter_var( $from, FILTER_VALIDATE_URL ) && filter_var( $to, FILTER_VALIDATE_URL ) );
		if ( ! $is_valid_urls ) {
			wp_send_json_error( __( 'The `from` and `to` URL\'s must be a valid URL', 'embroidery' ) );
		}

		if ( $from === $to ) {
			wp_send_json_error( __( 'The `from` and `to` URL\'s must be different', 'embroidery' ) );
		}

		global $wpdb;

		// @codingStandardsIgnoreStart cannot use `$wpdb->prepare` because it remove's the backslashes
		$rows_affected = $wpdb->query(
			"UPDATE {$wpdb->postmeta} " .
			"SET `meta_value` = REPLACE(`meta_value`, '" . str_replace( '/', '\\\/', $from ) . "', '" . str_replace( '/', '\\\/', $to ) . "') " .
			"WHERE `meta_key` = '_embroidery_data' AND `meta_value` LIKE '[%' ;" ); // meta_value LIKE '[%' are json formatted
		// @codingStandardsIgnoreEnd

		if ( false === $rows_affected ) {
			wp_send_json_error( __( 'An error occurred', 'embroidery' ) );
		} else {
			Plugin::$instance->posts_css_manager->clear_cache();
			wp_send_json_success( sprintf(
				/* translators: %s: Number of rows */
				__( '%d Rows Affected', 'embroidery' ),
				$rows_affected
			) );
		}
	}

	/**
	 * @since 1.5.0
	 * @access public
	*/
	public function post_embroidery_rollback() {
		check_admin_referer( 'embroidery_rollback' );

		$plugin_slug = basename( EMBROIDERY__FILE__, '.php' );

		$rollback = new Rollback(
			[
				'version' => EMBROIDERY_PREVIOUS_STABLE_VERSION,
				'plugin_name' => EMBROIDERY_PLUGIN_BASE,
				'plugin_slug' => $plugin_slug,
				'package_url' => sprintf( 'https://downloads.wordpress.org/plugin/%s.%s.zip', $plugin_slug, EMBROIDERY_PREVIOUS_STABLE_VERSION ),
			]
		);

		$rollback->run();

		wp_die(
			'', __( 'Rollback to Previous Version', 'embroidery' ), [
				'response' => 200,
			]
		);
	}

	/**
	 * @since 1.0.0
	 * @access public
	*/
	public function __construct() {
		parent::__construct();

		add_action( 'admin_menu', [ $this, 'register_admin_menu' ], 205 );

		if ( ! empty( $_POST ) ) {
			add_action( 'wp_ajax_embroidery_clear_cache', [ $this, 'ajax_embroidery_clear_cache' ] );
			add_action( 'wp_ajax_embroidery_replace_url', [ $this, 'ajax_embroidery_replace_url' ] );
		}

		add_action( 'admin_post_embroidery_rollback', [ $this, 'post_embroidery_rollback' ] );
	}

	/**
	 * @since 1.5.0
	 * @access protected
	*/
	protected function create_tabs() {
		return [
			'general' => [
				'label' => __( 'General', 'embroidery' ),
				'sections' => [
					'tools' => [
						'fields' => [
							'clear_cache' => [
								'label' => __( 'Regenerate CSS', 'embroidery' ),
								'field_args' => [
									'type' => 'raw_html',
									'html' => sprintf( '<button data-nonce="%s" class="button embroidery-button-spinner" id="embroidery-clear-cache-button">%s</button>', wp_create_nonce( 'embroidery_clear_cache' ), __( 'Regenerate Files', 'embroidery' ) ),
									'desc' => __( 'Styles set in Embroidery are saved in CSS files in the uploads folder. Recreate those files, according to the most recent settings.', 'embroidery' ),
								],
							],
							'reset_api_data' => [
								'label' => __( 'Sync Library', 'embroidery' ),
								'field_args' => [
									'type' => 'raw_html',
									'html' => sprintf( '<button data-nonce="%s" class="button embroidery-button-spinner" id="embroidery-library-sync-button">%s</button>', wp_create_nonce( 'embroidery_reset_library' ), __( 'Sync Library', 'embroidery' ) ),
									'desc' => __( 'Embroidery Library automatically updates on a daily basis. You can also manually update it by clicking on the sync button.', 'embroidery' ),
								],
							],
						],
					],
				],
			],
			'replace_url' => [
				'label' => __( 'Replace URL', 'embroidery' ),
				'sections' => [
					'replace_url' => [
						'callback' => function() {
							$intro_text = sprintf(
								/* translators: %s: Codex URL */
								__( '<strong>Important:</strong> It is strongly recommended that you <a target="_blank" href="%s">backup your database</a> before using Replace URL.', 'embroidery' ),
								'https://codex.wordpress.org/WordPress_Backups'
							);
							$intro_text = '<div>' . $intro_text . '</div>';

							echo $intro_text;
						},
						'fields' => [
							'replace_url' => [
								'label' => __( 'Update Site Address (URL)', 'embroidery' ),
								'field_args' => [
									'type' => 'raw_html',
									'html' => sprintf( '<input type="text" name="from" placeholder="http://old-url.com" class="medium-text"><input type="text" name="to" placeholder="http://new-url.com" class="medium-text"><button data-nonce="%s" class="button embroidery-button-spinner" id="embroidery-replace-url-button">%s</button>', wp_create_nonce( 'embroidery_replace_url' ), __( 'Replace URL', 'embroidery' ) ),
									'desc' => __( 'Enter your old and new URLs for your WordPress installation, to update all Embroidery data (Relevant for domain transfers or move to \'HTTPS\').', 'embroidery' ),
								],
							],
						],
					],
				],
			],
			'versions' => [
				'label' => __( 'Version Control', 'embroidery' ),
				'sections' => [
					'rollback' => [
						'label' => __( 'Rollback to Previous Version', 'embroidery' ),
						'callback' => function() {
							$intro_text = sprintf(
								/* translators: %s: Embroidery version */
								__( 'Experiencing an issue with Embroidery version %s? Rollback to a previous version before the issue appeared.', 'embroidery' ),
								EMBROIDERY_VERSION
							);
							$intro_text = '<p>' . $intro_text . '</p>';

							echo $intro_text;
						},
						'fields' => [
							'rollback' => [
								'label' => __( 'Rollback Version', 'embroidery' ),
								'field_args' => [
									'type' => 'raw_html',
									'html' => sprintf(
										'<a href="%s" class="button embroidery-button-spinner embroidery-rollback-button">%s</a>',
										wp_nonce_url( admin_url( 'admin-post.php?action=embroidery_rollback' ), 'embroidery_rollback' ),
										sprintf(
											/* translators: %s: Embroidery previous stable version */
											__( 'Reinstall v%s', 'embroidery' ),
											EMBROIDERY_PREVIOUS_STABLE_VERSION
										)
									),
									'desc' => '<span style="color: red;">' . __( 'Warning: Please backup your database before making the rollback.', 'embroidery' ) . '</span>',
								],
							],
						],
					],
					'beta' => [
						'label' => __( 'Become a Beta Tester', 'embroidery' ),
						'callback' => function() {
							$intro_text = sprintf(
								/* translators: %s: Embroidery version */
								__( 'Turn-on Beta Tester, to get notified when a new beta version of Embroidery or E-Pro is available. The Beta version will not install automatically. You always have the option to ignore it.', 'embroidery' ),
								EMBROIDERY_VERSION
							);
							$intro_text = '<p>' . $intro_text . '</p>';

							echo $intro_text;
						},
						'fields' => [
							'beta' => [
								'label' => __( 'Beta Tester', 'embroidery' ),
								'field_args' => [
									'type' => 'select',
									'default' => 'no',
									'options' => [
										'no' => __( 'Disable', 'embroidery' ),
										'yes' => __( 'Enable', 'embroidery' ),
									],
									'desc' => __( 'Please Note: We do not recommend updating to a beta version on production sites.', 'embroidery' ),
								],
							],
						],
					],
				],
			],
		];
	}

	/**
	 * @since 1.5.2
	 * @access public
	*/
	public function display_settings_page() {
		wp_enqueue_script( 'embroidery-dialog' );

		parent::display_settings_page();
	}

	/**
	 * @since 1.5.0
	 * @access protected
	*/
	protected function get_page_title() {
		return __( 'Tools', 'embroidery' );
	}
}
