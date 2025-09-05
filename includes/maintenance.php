<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery maintenance class.
 *
 * Embroidery maintenance handler class is responsible for setting up Embroidery
 * activation and uninstallation hooks.
 *
 * @since 1.0.0
 */
class Maintenance {

	/**
	 * Activate Embroidery.
	 *
	 * Set Embroidery activation hook.
	 *
	 * Fired by `register_activation_hook` when the plugin is activated.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 */
	public static function activation() {
		wp_clear_scheduled_hook( 'embroidery/tracker/send_event' );

		wp_schedule_event( time(), 'daily', 'embroidery/tracker/send_event' );
		flush_rewrite_rules();
	}

	/**
	 * Uninstall Embroidery.
	 *
	 * Set Embroidery uninstallation hook.
	 *
	 * Fired by `register_uninstall_hook` when the plugin is uninstalled.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 */
	public static function uninstall() {
		wp_clear_scheduled_hook( 'embroidery/tracker/send_event' );
	}

	/**
	 * Init.
	 *
	 * Initialize Embroidery Maintenance.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 */
	public static function init() {
		register_activation_hook( EMBROIDERY_PLUGIN_BASE, [ __CLASS__, 'activation' ] );
		register_uninstall_hook( EMBROIDERY_PLUGIN_BASE, [ __CLASS__, 'uninstall' ] );
	}
}

Maintenance::init();
