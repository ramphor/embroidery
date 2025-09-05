<?php
/**
 * Plugin Name: Embroidery
 * Description: Lightweight, performance-first page builder. Build blazing-fast websites with Core Web Vitals optimization. Minimal footprint, maximum impact.
 * Plugin URI: https://embroidery.com/?utm_source=wp-plugins&utm_campaign=plugin-uri&utm_medium=wp-dash
 * Author: Embroidery Team
 * Version: 1.0.0
 * Author URI: https://embroidery.com/?utm_source=wp-plugins&utm_campaign=author-uri&utm_medium=wp-dash
 *
 * Text Domain: embroidery
 *
 * @package Embroidery
 * @category Core
 *
 * Embroidery is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Embroidery is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'EMBROIDERY_VERSION', '1.0.0' );
define( 'EMBROIDERY_PREVIOUS_STABLE_VERSION', '1.0.0' );

define( 'EMBROIDERY__FILE__', __FILE__ );
define( 'EMBROIDERY_PLUGIN_BASE', plugin_basename( EMBROIDERY__FILE__ ) );
define( 'EMBROIDERY_PATH', plugin_dir_path( EMBROIDERY__FILE__ ) );

if ( defined( 'EMBROIDERY_TESTS' ) && EMBROIDERY_TESTS ) {
	define( 'EMBROIDERY_URL', 'file://' . EMBROIDERY_PATH );
} else {
	define( 'EMBROIDERY_URL', plugins_url( '/', EMBROIDERY__FILE__ ) );
}

define( 'EMBROIDERY_MODULES_PATH', plugin_dir_path( EMBROIDERY__FILE__ ) . '/modules' );
define( 'EMBROIDERY_ASSETS_URL', EMBROIDERY_URL . 'assets/' );

add_action( 'plugins_loaded', 'embroidery_load_plugin_textdomain' );

if ( ! version_compare( PHP_VERSION, '5.4', '>=' ) ) {
	add_action( 'admin_notices', 'embroidery_fail_php_version' );
} elseif ( ! version_compare( get_bloginfo( 'version' ), '4.5', '>=' ) ) {
	add_action( 'admin_notices', 'embroidery_fail_wp_version' );
} else {
	// Fix language if the `get_user_locale` is difference from the `get_locale
	if ( isset( $_REQUEST['action'] ) && 0 === strpos( $_REQUEST['action'], 'embroidery' ) ) {
		add_action( 'set_current_user', function() {
			global $current_user;
			$current_user->locale = get_locale();
		} );

		// Fix for Polylang
		define( 'PLL_AJAX_ON_FRONT', true );

		add_action( 'pll_pre_init', function( $polylang ) {
			$post_language = $polylang->model->post->get_language( $_REQUEST['post'], 'locale' );
			$_REQUEST['lang'] = $post_language->locale;
		} );
	}

	require( EMBROIDERY_PATH . 'includes/plugin.php' );
}

/**
 * Load Embroidery textdomain.
 *
 * Load gettext translate for Embroidery text domain.
 *
 * @since 1.0.0
 *
 * @return void
 */
function embroidery_load_plugin_textdomain() {
	load_plugin_textdomain( 'embroidery' );
}

/**
 * Embroidery admin notice for minimum PHP version.
 *
 * Warning when the site doesn't have the minimum required PHP version.
 *
 * @since 1.0.0
 *
 * @return void
 */
function embroidery_fail_php_version() {
	/* translators: %s: PHP version */
	$message = sprintf( esc_html__( 'Embroidery requires PHP version %s+, plugin is currently NOT ACTIVE.', 'embroidery' ), '5.4' );
	$html_message = sprintf( '<div class="error">%s</div>', wpautop( $message ) );
	echo wp_kses_post( $html_message );
}

/**
 * Embroidery admin notice for minimum WordPress version.
 *
 * Warning when the site doesn't have the minimum required WordPress version.
 *
 * @since 1.5.0
 *
 * @return void
 */
function embroidery_fail_wp_version() {
	/* translators: %s: WordPress version */
	$message = sprintf( esc_html__( 'Embroidery requires WordPress version %s+. Because you are using an earlier version, the plugin is currently NOT ACTIVE.', 'embroidery' ), '4.5' );
	$html_message = sprintf( '<div class="error">%s</div>', wpautop( $message ) );
	echo wp_kses_post( $html_message );
}
