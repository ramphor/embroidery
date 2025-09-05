<?php
namespace Embroidery;

use Embroidery\Core\Settings\Manager as SettingsManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery editor class.
 *
 * Embroidery editor handler class is responsible for initializing Embroidery
 * editor and register all the actions needed to display the editor.
 *
 * @since 1.0.0
 */
class Editor {

	/**
	 * The nonce key for Embroidery editor.
	 */
	const EDITING_NONCE_KEY = 'embroidery-editing';

	/**
	 * User capability required to access Embroidery editor.
	 */
	const EDITING_CAPABILITY = 'edit_posts';

	/**
	 * Post ID.
	 *
	 * Holds the ID of the current post being edited.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @var int Post ID.
	 */
	private $_post_id;

	/**
	 * Whether the edit mode is active.
	 *
	 * Used to determine whether we are in edit mode.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @var bool Whether the edit mode is active.
	 */
	private $_is_edit_mode;

	/**
	 * Editor templates.
	 *
	 * Holds the editor templates used by Marionette.js.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @var array Editor templates.
	 */
	private $_editor_templates = [];

	/**
	 * Init.
	 *
	 * Initialize Embroidery editor. Registers all needed actions to run Embroidery,
	 * removes conflicting actions etc.
	 *
	 * Fired by `admin_action_embroidery` action.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param bool $die Optional. Whether to die at the end. Default is `true`.
	 */
	public function init( $die = true ) {
		if ( empty( $_REQUEST['post'] ) ) { // WPCS: CSRF ok.
			return;
		}

		$this->_post_id = absint( $_REQUEST['post'] );

		if ( ! $this->is_edit_mode( $this->_post_id ) ) {
			return;
		}

		// Send MIME Type header like WP admin-header.
		@header( 'Content-Type: ' . get_option( 'html_type' ) . '; charset=' . get_option( 'blog_charset' ) );

		query_posts( [ 'p' => $this->_post_id, 'post_type' => get_post_type( $this->_post_id ) ] );

		Plugin::$instance->db->switch_to_post( $this->_post_id );

		add_filter( 'show_admin_bar', '__return_false' );

		// Remove all WordPress actions
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_print_styles' );
		remove_all_actions( 'wp_print_head_scripts' );
		remove_all_actions( 'wp_footer' );

		// Handle `wp_head`
		add_action( 'wp_head', 'wp_enqueue_scripts', 1 );
		add_action( 'wp_head', 'wp_print_styles', 8 );
		add_action( 'wp_head', 'wp_print_head_scripts', 9 );
		add_action( 'wp_head', 'wp_site_icon' );
		add_action( 'wp_head', [ $this, 'editor_head_trigger' ], 30 );

		// Handle `wp_footer`
		add_action( 'wp_footer', 'wp_print_footer_scripts', 20 );
		add_action( 'wp_footer', 'wp_auth_check_html', 30 );
		add_action( 'wp_footer', [ $this, 'wp_footer' ] );

		// Handle `wp_enqueue_scripts`
		remove_all_actions( 'wp_enqueue_scripts' );

		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_scripts' ], 999999 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_styles' ], 999999 );

		// Change mode to Builder
		Plugin::$instance->db->set_is_embroidery_page( $this->_post_id );

		// Post Lock
		if ( ! $this->get_locked_user( $this->_post_id ) ) {
			$this->lock_post( $this->_post_id );
		}

		// Setup default heartbeat options
		add_filter( 'heartbeat_settings', function( $settings ) {
			$settings['interval'] = 15;
			return $settings;
		} );

		// Tell to WP Cache plugins do not cache this request.
		Utils::do_not_cache();

		// Print the panel
		$this->print_panel_html();

		// From the action it's an empty string, from tests its `false`
		if ( false !== $die ) {
			die;
		}
	}

	/**
	 * Retrieve post ID.
	 *
	 * Get the ID of the current post.
	 *
	 * @since 1.8.0
	 * @access public
	 *
	 * @return int Post ID.
	 */
	public function get_post_id() {
		return $this->_post_id;
	}

	/**
	 * Redirect to new URL.
	 *
	 * Used as a fallback function for the old URL structure of Embroidery
	 * page edit URL.
	 *
	 * Fired by `template_redirect` action.
	 *
	 * @since 1.6.0
	 * @access public
	 */
	public function redirect_to_new_url() {
		if ( ! isset( $_GET['embroidery'] ) ) {
			return;
		}

		$post_id = get_the_ID();

		if ( ! User::is_current_user_can_edit( $post_id ) || ! Plugin::$instance->db->is_built_with_embroidery( $post_id ) ) {
			return;
		}

		wp_redirect( Utils::get_edit_link( $post_id ) );
		die;
	}

	/**
	 * Whether the edit mode is active.
	 *
	 * Used to determine whether we are in the edit mode.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param int $post_id Optional. Post ID. Default is `null`, the current post ID.
	 *
	 * @return bool Whether the edit mode is active.
	 */
	public function is_edit_mode( $post_id = null ) {
		if ( null !== $this->_is_edit_mode ) {
			return $this->_is_edit_mode;
		}

		if ( ! User::is_current_user_can_edit( $post_id ) ) {
			return false;
		}

		// Ajax request as Editor mode
		$actions = [
			'embroidery',
			'embroidery_render_widget',

			// Templates
			'embroidery_get_templates',
			'embroidery_save_template',
			'embroidery_get_template',
			'embroidery_delete_template',
			'embroidery_export_template',
			'embroidery_import_template',
		];

		if ( isset( $_REQUEST['action'] ) && in_array( $_REQUEST['action'], $actions ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Lock post.
	 *
	 * Mark the post as currently being edited by the current user.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param int $post_id The ID of the post being edited.
	 */
	public function lock_post( $post_id ) {
		if ( ! function_exists( 'wp_set_post_lock' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}

		wp_set_post_lock( $post_id );
	}

	/**
	 * Get locked user.
	 *
	 * Check what user is currently editing the post.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param int $post_id The ID of the post being edited.
	 *
	 * @return \WP_User|false User information or false if the post is not locked.
	 */
	public function get_locked_user( $post_id ) {
		if ( ! function_exists( 'wp_check_post_lock' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/post.php' );
		}

		$locked_user = wp_check_post_lock( $post_id );
		if ( ! $locked_user ) {
			return false;
		}

		return get_user_by( 'id', $locked_user );
	}

	/**
	 * Print panel HTML.
	 *
	 * Include the wrapper template of the editor.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function print_panel_html() {
		include( 'editor-templates/editor-wrapper.php' );
	}

	/**
	 * Enqueue scripts.
	 *
	 * Registers all the editor scripts and enqueues them.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function enqueue_scripts() {
		remove_action( 'wp_enqueue_scripts', [ $this, __FUNCTION__ ], 999999 );

		global $wp_styles, $wp_scripts;

		// Set the global data like $authordata and etc
		setup_postdata( $this->_post_id );

		$plugin = Plugin::$instance;

		// Reset global variable
		$wp_styles = new \WP_Styles();
		$wp_scripts = new \WP_Scripts();

		$suffix = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG || defined( 'EMBROIDERY_TESTS' ) && EMBROIDERY_TESTS ) ? '' : '.min';

		// Hack for waypoint with editor mode.
		wp_register_script(
			'embroidery-waypoints',
			EMBROIDERY_ASSETS_URL . 'lib/waypoints/waypoints-for-editor.js',
			[
				'jquery',
			],
			'4.0.2',
			true
		);

		wp_register_script(
			'backbone-marionette',
			EMBROIDERY_ASSETS_URL . 'lib/backbone/backbone.marionette' . $suffix . '.js',
			[
				'backbone',
			],
			'2.4.5',
			true
		);

		wp_register_script(
			'backbone-radio',
			EMBROIDERY_ASSETS_URL . 'lib/backbone/backbone.radio' . $suffix . '.js',
			[
				'backbone',
			],
			'1.0.4',
			true
		);

		wp_register_script(
			'perfect-scrollbar',
			EMBROIDERY_ASSETS_URL . 'lib/perfect-scrollbar/perfect-scrollbar.jquery' . $suffix . '.js',
			[
				'jquery',
			],
			'0.6.12',
			true
		);

		wp_register_script(
			'jquery-easing',
			EMBROIDERY_ASSETS_URL . 'lib/jquery-easing/jquery-easing' . $suffix . '.js',
			[
				'jquery',
			],
			'1.3.2',
			true
		);

		wp_register_script(
			'nprogress',
			EMBROIDERY_ASSETS_URL . 'lib/nprogress/nprogress' . $suffix . '.js',
			[],
			'0.2.0',
			true
		);

		wp_register_script(
			'tipsy',
			EMBROIDERY_ASSETS_URL . 'lib/tipsy/tipsy' . $suffix . '.js',
			[
				'jquery',
			],
			'1.0.0',
			true
		);

		wp_register_script(
			'jquery-select2',
			EMBROIDERY_ASSETS_URL . 'lib/select2/js/select2' . $suffix . '.js',
			[
				'jquery',
			],
			'4.0.2',
			true
		);

		wp_register_script(
			'flatpickr',
			EMBROIDERY_ASSETS_URL . 'lib/flatpickr/flatpickr' . $suffix . '.js',
			[
				'jquery',
			],
			'1.12.0',
			true
		);

		wp_register_script(
			'ace',
			'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.5/ace.js',
			[],
			'1.2.5',
			true
		);

		wp_register_script(
			'ace-language-tools',
			'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.5/ext-language_tools.js',
			[
				'ace',
			],
			'1.2.5',
			true
		);

		wp_register_script(
			'jquery-hover-intent',
			EMBROIDERY_ASSETS_URL . 'lib/jquery-hover-intent/jquery-hover-intent' . $suffix . '.js',
			[],
			'1.0.0',
			true
		);

		wp_register_script(
			'embroidery-dialog',
			EMBROIDERY_ASSETS_URL . 'lib/dialog/dialog' . $suffix . '.js',
			[
				'jquery-ui-position',
			],
			'4.1.0',
			true
		);

		wp_register_script(
			'embroidery-editor',
			EMBROIDERY_ASSETS_URL . 'js/editor' . $suffix . '.js',
			[
				'wp-auth-check',
				'jquery-ui-sortable',
				'jquery-ui-resizable',
				'backbone-marionette',
				'backbone-radio',
				'perfect-scrollbar',
				'nprogress',
				'tipsy',
				'imagesloaded',
				'heartbeat',
				'jquery-select2',
				'flatpickr',
				'embroidery-dialog',
				'ace',
				'ace-language-tools',
				'jquery-hover-intent',
			],
			EMBROIDERY_VERSION,
			true
		);

		/**
		 * Before editor enqueue scripts.
		 *
		 * Fires before Embroidery editor scripts are enqueued.
		 *
		 * @since 1.0.0
		 */
		do_action( 'embroidery/editor/before_enqueue_scripts' );

		$editor_data = $plugin->db->get_builder( $this->_post_id, DB::STATUS_DRAFT );

		wp_enqueue_script( 'embroidery-editor' );

		// Tweak for WP Admin menu icons
		wp_print_styles( 'editor-buttons' );

		$locked_user = $this->get_locked_user( $this->_post_id );

		if ( $locked_user ) {
			$locked_user = $locked_user->display_name;
		}

		$page_title_selector = get_option( 'embroidery_page_title_selector' );

		if ( empty( $page_title_selector ) ) {
			$page_title_selector = 'h1.entry-title';
		}

		$post_type_object = get_post_type_object( get_post_type() );

		$current_user_can_publish = current_user_can( $post_type_object->cap->publish_posts );

		$config = [
			'version' => EMBROIDERY_VERSION,
			'ajaxurl' => admin_url( 'admin-ajax.php' ),
			'home_url' => home_url(),
			'nonce' => $this->create_nonce( get_post_type() ),
			'preview_link' => Utils::get_preview_url( $this->_post_id ),
			'post_link' => get_permalink( $this->_post_id ),
			'last_edited' => Utils::get_last_edited( $this->_post_id ),
			'autosave_interval' => AUTOSAVE_INTERVAL,
			'wp_preview' => [
				'url' => Utils::get_wp_preview_url( $this->_post_id ),
				'target' => 'wp-preview-' . $this->_post_id,
			],
			'elements_categories' => $plugin->elements_manager->get_categories(),
			'controls' => $plugin->controls_manager->get_controls_data(),
			'elements' => $plugin->elements_manager->get_element_types_config(),
			'widgets' => $plugin->widgets_manager->get_widget_types_config(),
			'schemes' => [
				'items' => $plugin->schemes_manager->get_registered_schemes_data(),
				'enabled_schemes' => Schemes_Manager::get_enabled_schemes(),
			],
			'default_schemes' => $plugin->schemes_manager->get_schemes_defaults(),
			'settings' => SettingsManager::get_settings_managers_config(),
			'system_schemes' => $plugin->schemes_manager->get_system_schemes(),
			'wp_editor' => $this->get_wp_editor_config(),
			'post_id' => $this->_post_id,
			'settings_page_link' => Settings::get_url(),
			'embroidery_site' => 'https://go.embroidery.com/about-embroidery/',
			'docs_embroidery_site' => 'https://go.embroidery.com/docs/',
			'help_the_content_url' => 'https://go.embroidery.com/the-content-missing/',
			'help_preview_error_url' => 'https://go.embroidery.com/preview-not-loaded/',
			'assets_url' => EMBROIDERY_ASSETS_URL,
			'data' => $editor_data,
			'locked_user' => $locked_user,
			'is_rtl' => is_rtl(),
			'locale' => get_locale(),
			'viewportBreakpoints' => Responsive::get_breakpoints(),
			'rich_editing_enabled' => filter_var( get_user_meta( get_current_user_id(), 'rich_editing', true ), FILTER_VALIDATE_BOOLEAN ),
			'page_title_selector' => $page_title_selector,
			'tinymceHasCustomConfig' => class_exists( 'Tinymce_Advanced' ),
			'inlineEditing' => Plugin::$instance->widgets_manager->get_inline_editing_config(),
			'current_user_can_publish' => $current_user_can_publish,
			'exit_to_dashboard_url' => Utils::get_exit_to_dashboard_url( $this->_post_id ),
			'i18n' => [
				'embroidery' => __( 'Embroidery', 'embroidery' ),
				'delete' => __( 'Delete', 'embroidery' ),
				'cancel' => __( 'Cancel', 'embroidery' ),
				'edit_element' => __( 'Edit {0}', 'embroidery' ),

				// Menu.
				'about_embroidery' => __( 'About Embroidery', 'embroidery' ),
				'color_picker' => __( 'Color Picker', 'embroidery' ),
				'embroidery_settings' => __( 'Dashboard Settings', 'embroidery' ),
				'global_colors' => __( 'Default Colors', 'embroidery' ),
				'global_fonts' => __( 'Default Fonts', 'embroidery' ),
				'global_style' => __( 'Style', 'embroidery' ),
				'settings' => __( 'Settings', 'embroidery' ),

				// Elements.
				'inner_section' => __( 'Columns', 'embroidery' ),

				// Control Order.
				'asc' => __( 'Ascending order', 'embroidery' ),
				'desc' => __( 'Descending order', 'embroidery' ),

				// Clear Page.
				'clear_page' => __( 'Delete All Content', 'embroidery' ),
				'dialog_confirm_clear_page' => __( 'Attention: We are going to DELETE ALL CONTENT from this page. Are you sure you want to do that?', 'embroidery' ),

				// Panel Preview Mode.
				'back_to_editor' => __( 'Show Panel', 'embroidery' ),
				'preview' => __( 'Hide Panel', 'embroidery' ),

				// Inline Editing.
				'type_here' => __( 'Type Here', 'embroidery' ),

				// Library.
				'an_error_occurred' => __( 'An error occurred', 'embroidery' ),
				'delete_template' => __( 'Delete Template', 'embroidery' ),
				'delete_template_confirm' => __( 'Are you sure you want to delete this template?', 'embroidery' ),
				'import_template_dialog_header' => __( 'Import Document Settings', 'embroidery' ),
				'import_template_dialog_message' => __( 'Do you want to also import the document settings of the template?', 'embroidery' ),
				'import_template_dialog_message_attention' => __( 'Attention: Importing may override previous settings.', 'embroidery' ),
				'no' => __( 'No', 'embroidery' ),
				'page' => __( 'Page', 'embroidery' ),
				'save_your_template' => __( 'Save Your {0} to Library', 'embroidery' ),
				'save_your_template_description' => __( 'Your designs will be available for export and reuse on any page or website', 'embroidery' ),
				'section' => __( 'Section', 'embroidery' ),
				'templates_empty_message' => __( 'This is where your templates should be. Design it. Save it. Reuse it.', 'embroidery' ),
				'templates_empty_title' => __( 'Haven’t Saved Templates Yet?', 'embroidery' ),
				'templates_no_favorites_message' => __( 'You can mark any pre-designed template as a favorite.', 'embroidery' ),
				'templates_no_favorites_title' => __( 'No Favorite Templates', 'embroidery' ),
				'templates_no_results_message' => __( 'Please make sure your search is spelled correctly or try a different words.', 'embroidery' ),
				'templates_no_results_title' => __( 'No Results Found', 'embroidery' ),
				'templates_request_error' => __( 'The following error(s) occurred while processing the request:', 'embroidery' ),
				'yes' => __( 'Yes', 'embroidery' ),

				// Incompatible Device.
				'device_incompatible_header' => __( 'Your browser isn\'t compatible', 'embroidery' ),
				'device_incompatible_message' => __( 'Your browser isn\'t compatible with all of Embroidery\'s editing features. We recommend you switch to another browser like Chrome or Firefox.', 'embroidery' ),
				'proceed_anyway' => __( 'Proceed Anyway', 'embroidery' ),

				// Preview not loaded.
				'learn_more' => __( 'Learn More', 'embroidery' ),
				'preview_el_not_found_header' => __( 'Sorry, the content area was not found in your page.', 'embroidery' ),
				'preview_el_not_found_message' => __( 'You must call \'the_content\' function in the current template, in order for Embroidery to work on this page.', 'embroidery' ),
				'preview_not_loading_header' => __( 'The preview could not be loaded', 'embroidery' ),
				'preview_not_loading_message' => __( 'We\'re sorry, but something went wrong. Click on \'Learn more\' and follow each of the steps to quickly solve it.', 'embroidery' ),

				// Gallery.
				'delete_gallery' => __( 'Reset Gallery', 'embroidery' ),
				'dialog_confirm_gallery_delete' => __( 'Are you sure you want to reset this gallery?', 'embroidery' ),
				'gallery_images_selected' => __( '{0} Images Selected', 'embroidery' ),
				'insert_media' => __( 'Insert Media', 'embroidery' ),

				// Take Over.
				'dialog_user_taken_over' => __( '{0} has taken over and is currently editing. Do you want to take over this page editing?', 'embroidery' ),
				'go_back' => __( 'Go Back', 'embroidery' ),
				'take_over' => __( 'Take Over', 'embroidery' ),

				// Revisions.
				'delete_element' => __( 'Delete {0}', 'embroidery' ),
				'dialog_confirm_delete' => __( 'Are you sure you want to remove this {0}?', 'embroidery' ),

				// Saver.
				'before_unload_alert' => __( 'Please note: All unsaved changes will be lost.', 'embroidery' ),
				'publish_changes' => __( 'Publish Changes', 'embroidery' ),
				'published' => __( 'Published', 'embroidery' ),
				'save' => __( 'Save', 'embroidery' ),
				'saved' => __( 'Saved', 'embroidery' ),
				'update' => __( 'Update', 'embroidery' ),
				'submit' => __( 'Submit', 'embroidery' ),
				'publish_notification' => __( 'Hurray! Your page is live.', 'embroidery' ),
				'working_on_draft_notification' => __( 'This is just a draft. Play around and when you\'re done - click update.', 'embroidery' ),
				'keep_editing' => __( 'Keep Editing', 'embroidery' ),
				'have_a_look' => __( 'Have a look', 'embroidery' ),
				'view_all_revisions' => __( 'View All Revisions', 'embroidery' ),
				'dismiss' => __( 'Dismiss', 'embroidery' ),
				'saving_disabled' => __( 'Saving has been disabled until you’re reconnected.', 'embroidery' ),

				// Ajax
				'server_error' => __( 'Server Error', 'embroidery' ),
				'server_connection_lost' => __( 'Connection Lost', 'embroidery' ),
				'unknown_error' => __( 'Unknown Error', 'embroidery' ),

				// TODO: Remove.
				'autosave' => __( 'Autosave', 'embroidery' ),
				'embroidery_docs' => __( 'Documentation', 'embroidery' ),
				'reload_page' => __( 'Reload Page', 'embroidery' ),
				'session_expired_header' => __( 'Timeout', 'embroidery' ),
				'session_expired_message' => __( 'Your session has expired. Please reload the page to continue editing.', 'embroidery' ),
				'soon' => __( 'Soon', 'embroidery' ),
				'unknown_value' => __( 'Unknown Value', 'embroidery' ),
			],
		];

		$localized_settings = [];

		/**
		 * Localize editor settings.
		 *
		 * Filters the editor localized settings.
		 *
		 * @since 1.0.0
		 *
		 * @param string $localized_settings Localized settings.
		 * @param int    $post_id            The ID of the current post being edited.
		 */
		$localized_settings = apply_filters( 'embroidery/editor/localize_settings', $localized_settings, $this->_post_id );

		if ( ! empty( $localized_settings ) ) {
			$config = array_replace_recursive( $config, $localized_settings );
		}

		echo '<script type="text/javascript">' . PHP_EOL;
		echo '/* <![CDATA[ */' . PHP_EOL;
		$config_json = wp_json_encode( $config );
		unset( $config );

		if ( get_option( 'embroidery_editor_break_lines' ) ) {
			// Add new lines to avoid memory limits in some hosting servers that handles the buffer output according to new line characters
			$config_json = str_replace( '}},"', '}},' . PHP_EOL . '"', $config_json );
		}

		echo 'var EmbroideryConfig = ' . $config_json . ';' . PHP_EOL;
		echo '/* ]]> */' . PHP_EOL;
		echo '</script>';

		$plugin->controls_manager->enqueue_control_scripts();

		/**
		 * After editor enqueue scripts.
		 *
		 * Fires after Embroidery editor scripts are enqueued.
		 *
		 * @since 1.0.0
		 */
		do_action( 'embroidery/editor/after_enqueue_scripts' );
	}

	/**
	 * Enqueue styles.
	 *
	 * Registers all the editor styles and enqueues them.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function enqueue_styles() {
		/**
		 * Before editor enqueue styles.
		 *
		 * Fires before Embroidery editor styles are enqueued.
		 *
		 * @since 1.0.0
		 */
		do_action( 'embroidery/editor/before_enqueue_styles' );

		$suffix = Utils::is_script_debug() ? '' : '.min';

		$direction_suffix = is_rtl() ? '-rtl' : '';

		wp_register_style(
			'font-awesome',
			EMBROIDERY_ASSETS_URL . 'lib/font-awesome/css/font-awesome' . $suffix . '.css',
			[],
			'4.7.0'
		);

		wp_register_style(
			'select2',
			EMBROIDERY_ASSETS_URL . 'lib/select2/css/select2' . $suffix . '.css',
			[],
			'4.0.2'
		);

		wp_register_style(
			'embroidery-icons',
			EMBROIDERY_ASSETS_URL . 'lib/eicons/css/embroidery-icons' . $suffix . '.css',
			[],
			EMBROIDERY_VERSION
		);

		wp_register_style(
			'google-font-roboto',
			'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
			[],
			EMBROIDERY_VERSION
		);

		wp_register_style(
			'flatpickr',
			EMBROIDERY_ASSETS_URL . 'lib/flatpickr/flatpickr' . $suffix . '.css',
			[],
			'1.12.0'
		);

		wp_register_style(
			'embroidery-editor',
			EMBROIDERY_ASSETS_URL . 'css/editor' . $direction_suffix . $suffix . '.css',
			[
				'font-awesome',
				'select2',
				'embroidery-icons',
				'wp-auth-check',
				'google-font-roboto',
				'flatpickr',
			],
			EMBROIDERY_VERSION
		);

		wp_enqueue_style( 'embroidery-editor' );

		/**
		 * After editor enqueue styles.
		 *
		 * Fires after Embroidery editor styles are enqueued.
		 *
		 * @since 1.0.0
		 */
		do_action( 'embroidery/editor/after_enqueue_styles' );
	}

	/**
	 * Get WordPress editor config.
	 *
	 * Config the default WordPress editor with custom settings for Embroidery use.
	 *
	 * @since 1.9.0
	 * @access private
	 */
	private function get_wp_editor_config() {
		// Remove all TinyMCE plugins.
		remove_all_filters( 'mce_buttons', 10 );
		remove_all_filters( 'mce_external_plugins', 10 );

		if ( ! class_exists( '\_WP_Editors', false ) ) {
			require( ABSPATH . WPINC . '/class-wp-editor.php' );
		}

		// WordPress 4.8 and higher
		if ( method_exists( '\_WP_Editors', 'print_tinymce_scripts' ) ) {
			\_WP_Editors::print_default_editor_scripts();
			\_WP_Editors::print_tinymce_scripts();
		}
		ob_start();

		wp_editor(
			'%%EDITORCONTENT%%',
			'embroiderywpeditor',
			[
				'editor_class' => 'embroidery-wp-editor',
				'editor_height' => 250,
				'drag_drop_upload' => true,
			]
		);

		$config = ob_get_clean();

		// Don't call \_WP_Editors methods again
		remove_action( 'admin_print_footer_scripts', [ '_WP_Editors', 'editor_js' ], 50 );
		remove_action( 'admin_print_footer_scripts', [ '_WP_Editors', 'print_default_editor_scripts' ], 45 );

		\_WP_Editors::editor_js();

		return $config;
	}

	/**
	 * Editor head trigger.
	 *
	 * Fires the 'embroidery/editor/wp_head' action in the head tag in Embroidery editor.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function editor_head_trigger() {
		/**
		 * Embroidery editor head.
		 *
		 * Fires on Embroidery editor head tag.
		 *
		 * Used to prints scripts or any other data in the head tag.
		 *
		 * @since 1.0.0
		 */
		do_action( 'embroidery/editor/wp_head' );
	}

	/**
	 * Add editor template.
	 *
	 * Registers new editor templates.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $template Can be either a link to template file or template HTML
	 *                         content.
	 * @param string $type     Optional. Whether to handle the template as path or text.
	 *                         Default is `path`.
	 */
	public function add_editor_template( $template, $type = 'path' ) {
		if ( 'path' === $type ) {
			ob_start();

			include $template;

			$template = ob_get_clean();
		}

		$this->_editor_templates[] = $template;
	}

	/**
	 * WP footer.
	 *
	 * Prints Embroidery editor with all the editor templates, and render controls,
	 * widgets and content elements.
	 *
	 * Fired by `wp_footer` action.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function wp_footer() {
		$plugin = Plugin::$instance;

		$plugin->controls_manager->render_controls();
		$plugin->widgets_manager->render_widgets_content();
		$plugin->elements_manager->render_elements_content();

		$plugin->schemes_manager->print_schemes_templates();

		$this->init_editor_templates();

		foreach ( $this->_editor_templates as $editor_template ) {
			echo $editor_template;
		}

		/**
		 * Embroidery editor footer.
		 *
		 * Fires on Embroidery editor before closing the body tag.
		 *
		 * Used to prints scripts or any other HTML before closing the body tag.
		 *
		 * @since 1.0.0
		 */
		do_action( 'embroidery/editor/footer' );
	}

	/**
	 * Set edit mode.
	 *
	 * Used to update the edit mode.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param bool $edit_mode Whether the edit mode is active.
	 */
	public function set_edit_mode( $edit_mode ) {
		$this->_is_edit_mode = $edit_mode;
	}

	/**
	 * Editor constructor.
	 *
	 * Initializing Embroidery editor and redirect from old URL structure of Embroidery editor.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function __construct() {
		add_action( 'admin_action_embroidery', [ $this, 'init' ] );
		add_action( 'template_redirect', [ $this, 'redirect_to_new_url' ] );
	}

	/**
	 * Create nonce.
	 *
	 * If the user has edit capabilities, it creates a cryptographic token to give him
	 * access to Embroidery editor.
	 *
	 * @since 1.8.1
	 * @access public
	 *
	 * @param string $post_type The post type to check capabilities. @since  1.8.7
	 *
	 * @return null|string The nonce token, or `null` if the user has no edit capabilities.
	 */
	public function create_nonce( $post_type ) {
		$post_type_object = get_post_type_object( $post_type );
		$capability = $post_type_object->cap->{self::EDITING_CAPABILITY};

		if ( ! current_user_can( $capability ) ) {
			return null;
		}

		return wp_create_nonce( self::EDITING_NONCE_KEY );
	}

	/**
	 * Verify nonce.
	 *
	 * The user is given an amount of time to use the token, so therefore, since the user ID
	 * and `$action` remain the same, the independent variable is the time.
	 *
	 * @since 1.8.1
	 * @access public
	 *
	 * @param string $nonce Nonce that was used in the form to verify.
	 *
	 * @return false|int If the nonce is invalid it returns `false`. If the nonce is valid
	 *                   and generated between 0-12 hours ago it returns `1`. If the nonce is
	 *                   valid and generated between 12-24 hours ago it returns `2`.
	 */
	public function verify_nonce( $nonce ) {
		return wp_verify_nonce( $nonce, self::EDITING_NONCE_KEY );
	}

	/**
	 * Verify request nonce.
	 *
	 * Whether the request nonce verified or not.
	 *
	 * @since 1.8.1
	 * @access public
	 *
	 * @return bool True if request nonce verified, False otherwise.
	 */
	public function verify_request_nonce() {
		return ! empty( $_REQUEST['_nonce'] ) && $this->verify_nonce( $_REQUEST['_nonce'] );
	}

	/**
	 * Verify ajax nonce.
	 *
	 * Verify request nonce and send a JSON request, if not verified returns an
	 * error.
	 *
	 * @since 1.9.0
	 * @access public
	 */
	public function verify_ajax_nonce() {
		if ( ! $this->verify_request_nonce() ) {
			wp_send_json_error( new \WP_Error( 'token_expired' ) );
		}
	}

	/**
	 * Init editor templates.
	 *
	 * Initialize default embroidery templates used in the editor panel.
	 *
	 * @since 1.7.0
	 * @access private
	 */
	private function init_editor_templates() {
		$template_names = [
			'global',
			'panel',
			'panel-elements',
			'repeater',
			'templates',
		];

		foreach ( $template_names as $template_name ) {
			$this->add_editor_template( __DIR__ . "/editor-templates/$template_name.php" );
		}
	}
}
