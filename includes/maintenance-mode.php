<?php
namespace Embroidery;

use Embroidery\TemplateLibrary\Source_Local;

/**
 * Embroidery maintenance mode class.
 *
 * Embroidery maintenance mode handler class is responsible for the Embroidery
 * "Maintenance Mode" and the "Coming Soon" features.
 *
 * @since 1.4.0
 */
class Maintenance_Mode {

	/**
	 * The options prefix.
	 */
	const OPTION_PREFIX = 'embroidery_maintenance_mode_';

	/**
	 * The maintenance mode.
	 */
	const MODE_MAINTENANCE = 'maintenance';

	/**
	 * The coming soon mode.
	 */
	const MODE_COMING_SOON = 'coming_soon';

	/**
	 * Get embroidery option.
	 *
	 * Retrieve embroidery option from the database.
	 *
	 * @since 1.4.0
	 * @access public
	 * @static
	 *
	 * @param string $option  Option name. Expected to not be SQL-escaped.
	 * @param mixed  $default Optional. Default value to return if the option
	 *                        does not exist. Default is false.
	 *
	 * @return bool False if value was not updated and true if value was updated.
	 */
	public static function get( $option, $default = false ) {
		return get_option( self::OPTION_PREFIX . $option, $default );
	}

	/**
	 * Set embroidery option.
	 *
	 * Update embroidery option in the database.
	 *
	 * @since 1.4.0
	 * @access public
	 * @static
	 *
	 * @param string $option Option name. Expected to not be SQL-escaped.
	 * @param mixed  $value  Option value. Must be serializable if non-scalar.
	 *                       Expected to not be SQL-escaped.
	 *
	 * @return bool False if value was not updated and true if value was updated.
	 */
	public static function set( $option, $value ) {
		return update_option( self::OPTION_PREFIX . $option, $value );
	}

	/**
	 * Body class.
	 *
	 * Add "Maintenance Mode" CSS classes to the body tag.
	 *
	 * Fired by `body_class` filter.
	 *
	 * @since 1.4.0
	 * @access public
	 *
	 * @param array $classes An array of body classes.
	 *
	 * @return array An array of body classes.
	 */
	public function body_class( $classes ) {
		$classes[] = 'embroidery-maintenance-mode';

		return $classes;
	}

	/**
	 * Template redirect.
	 *
	 * Redirect to the "Maintenance Mode" template.
	 *
	 * Fired by `template_redirect` action.
	 *
	 * @since 1.4.0
	 * @access public
	 */
	public function template_redirect() {
		if ( Plugin::$instance->preview->is_preview_mode() ) {
			return;
		}

		// Setup global post for Embroidery\frontend so `_has_embroidery_in_page = true`.
		$GLOBALS['post'] = get_post( self::get( 'template_id' ) );

		add_filter( 'template_include', [ $this, 'template_include' ], 1 );
	}

	/**
	 * Template include.
	 *
	 * Update the path of the current template before including it. Used to
	 * change the "Maintenance Mode" path and the HTTP header data.
	 *
	 * Fired by `template_include` filter.
	 *
	 * @since 1.4.0
	 * @access public
	 *
	 * @param string $template The path of the template to include.
	 *
	 * @return string Updated path of the template to include.
	 */
	public function template_include( $template ) {
		// Set the template as `$wp_query->current_object` for `wp_title` and etc.
		query_posts( [
			'p' => self::get( 'template_id' ),
			'post_type' => Source_Local::CPT,
		] );

		if ( 'maintenance' === self::get( 'mode' ) ) {
			$protocol = wp_get_server_protocol();
			header( "$protocol 503 Service Unavailable", true, 503 );
			header( 'Content-Type: text/html; charset=utf-8' );
			header( 'Retry-After: 600' );
		}

		return $template;
	}

	/**
	 * Register settings fields.
	 *
	 * Adds new "Maintenance Mode" settings fields to Embroidery admin page.
	 *
	 * Fired by `embroidery/admin/after_create_settings/{$page_id}` action.
	 *
	 * @since 1.4.0
	 * @access public
	 */
	public function register_settings_fields( Tools $tools ) {
		$templates = Plugin::$instance->templates_manager->get_source( 'local' )->get_items( [ 'type' => 'page' ] );

		$templates_options = [];

		foreach ( $templates as $template ) {
			$templates_options[ $template['template_id'] ] = $template['title'];
		}

		$template_description = sprintf( ' <a target="_blank" class="embroidery-edit-template" style="display: none" href="%s">%s</a>', Utils::get_edit_link( self::get( 'template_id' ) ), __( 'Edit Template', 'embroidery' ) );

		$template_description .= '<span class="embroidery-maintenance-mode-error" style="display: none">' .
								 __( 'To enable maintenance mode you have to set a template for the maintenance mode page.', 'embroidery' ) .
								 '<br>' .
								 sprintf( __( 'Select one or go ahead and <a target="_blank" href="%s">create one</a> now.', 'embroidery' ), admin_url( 'post-new.php?post_type=' . Source_Local::CPT ) ) .
								 '</span>';

		$tools->add_tab(
			'maintenance_mode', [
				'label' => __( 'Maintenance Mode', 'embroidery' ),
				'sections' => [
					'maintenance_mode' => [
						'callback' => function() {
							echo '<div>' . __( 'Set your entire website as MAINTENANCE MODE, meaning the site is offline temporarily for maintenance, or set it as COMING SOON mode, meaning the site is offline until it is ready to be launched.', 'embroidery' ) . '</div>';
						},
						'fields' => [
							'maintenance_mode_mode' => [
								'label' => __( 'Choose Mode', 'embroidery' ),
								'field_args' => [
									'type' => 'select',
									'options' => [
										'' => __( 'Disabled', 'embroidery' ),
										self::MODE_COMING_SOON => __( 'Coming Soon', 'embroidery' ),
										self::MODE_MAINTENANCE => __( 'Maintenance', 'embroidery' ),
									],
									'desc' => '<div class="embroidery-maintenance-mode-description" data-value="" style="display: none">' .
											  __( 'Choose between Coming Soon mode (returning HTTP 200 code) or Maintenance Mode (returning HTTP 503 code).', 'embroidery' ) .
											  '</div>' .
											  '<div class="embroidery-maintenance-mode-description" data-value="maintenance" style="display: none">' .
											  __( 'Maintenance Mode returns HTTP 503 code, so search engines know to come back a short time later. It is not recommended to use this mode for more than a couple of days.', 'embroidery' ) .
											  '</div>' .
											  '<div class="embroidery-maintenance-mode-description" data-value="coming_soon" style="display: none">' .
											  __( 'Coming Soon returns HTTP 200 code, meaning the site is ready to be indexed.', 'embroidery' ) .
											  '</div>',
								],
							],
							'maintenance_mode_exclude_mode' => [
								'label' => __( 'Who Can Access', 'embroidery' ),
								'field_args' => [
									'class' => 'embroidery-default-hide',
									'type' => 'select',
									'std' => 'logged_in',
									'options' => [
										'logged_in' => __( 'Logged In', 'embroidery' ),
										'custom' => __( 'Custom', 'embroidery' ),
									],
								],
							],
							'maintenance_mode_exclude_roles' => [
								'label' => __( 'Roles', 'embroidery' ),
								'field_args' => [
									'class' => 'embroidery-default-hide',
									'type' => 'checkbox_list_roles',
								],
								'setting_args' => [ __NAMESPACE__ . '\Settings_Validations', 'checkbox_list' ],
							],
							'maintenance_mode_template_id' => [
								'label' => __( 'Choose Template', 'embroidery' ),
								'field_args' => [
									'class' => 'embroidery-default-hide',
									'type' => 'select',
									'show_select' => true,
									'options' => $templates_options,
									'desc' => $template_description,
								],
							],
						],
					],
				],
			]
		);
	}

	/**
	 * Add menu in admin bar.
	 *
	 * Adds "Maintenance Mode" items to the WordPress admin bar.
	 *
	 * Fired by `admin_bar_menu` filter.
	 *
	 * @since 1.4.0
	 * @access public
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar WP_Admin_Bar instance, passed by reference.
	 */
	public function add_menu_in_admin_bar( \WP_Admin_Bar $wp_admin_bar ) {
		$wp_admin_bar->add_node( [
			'id' => 'embroidery-maintenance-on',
			'title' => __( 'Maintenance Mode ON', 'embroidery' ),
			'href' => Tools::get_url() . '#tab-maintenance_mode',
		] );

		$wp_admin_bar->add_node( [
			'id' => 'embroidery-maintenance-edit',
			'parent' => 'embroidery-maintenance-on',
			'title' => __( 'Edit Template', 'embroidery' ),
			'href' => Utils::get_edit_link( self::get( 'template_id' ) ),
		] );
	}

	/**
	 * Print style.
	 *
	 * Adds custom CSS to the HEAD html tag. The CSS that emphasise the maintenance
	 * mode with red colors.
	 *
	 * Fired by `admin_head` and `wp_head` filters.
	 *
	 * @since 1.4.0
	 * @access public
	 */
	public function print_style() {
		?>
		<style>#wp-admin-bar-embroidery-maintenance-on > a { background-color: #dc3232; }
			#wp-admin-bar-embroidery-maintenance-on > .ab-item:before { content: "\f160"; top: 2px; }</style>
		<?php
	}

	/**
	 * Maintenance mode constructor.
	 *
	 * Initializing Embroidery maintenance mode.
	 *
	 * @since 1.4.0
	 * @access public
	 */
	public function __construct() {
		$is_enabled = (bool) self::get( 'mode' ) && (bool) self::get( 'template_id' );

		if ( is_admin() ) {
			$page_id = Tools::PAGE_ID;
			add_action( "embroidery/admin/after_create_settings/{$page_id}", [ $this, 'register_settings_fields' ] );
		}

		if ( ! $is_enabled ) {
			return;
		}

		add_action( 'admin_bar_menu', [ $this, 'add_menu_in_admin_bar' ], 300 );
		add_action( 'admin_head', [ $this, 'print_style' ] );
		add_action( 'wp_head', [ $this, 'print_style' ] );

		$user = wp_get_current_user();

		$exclude_mode = self::get( 'exclude_mode', [] );

		if ( 'logged_in' === $exclude_mode && is_user_logged_in() ) {
			return;
		}

		if ( 'custom' === $exclude_mode ) {
			$exclude_roles = self::get( 'exclude_roles', [] );

			$compare_roles = array_intersect( $user->roles, $exclude_roles );

			if ( ! empty( $compare_roles ) ) {
				return;
			}
		}

		add_filter( 'body_class', [ $this, 'body_class' ] );
		add_action( 'template_redirect', [ $this, 'template_redirect' ], 1 );
	}
}
