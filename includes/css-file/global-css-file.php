<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

class Global_CSS_File extends CSS_File {

	const META_KEY = '_embroidery_global_css';

	const FILE_HANDLER_ID = 'embroidery-global';

	/**
	 * @since 1.6.0
	 * @access public
	*/
	public function get_name() {
		return 'global';
	}

	/**
	 * @since 1.2.0
	 * @access protected
	 * @return array
	 */
	protected function load_meta() {
		return get_option( self::META_KEY );
	}

	/**
	 * @since 1.2.0
	 * @access protected
	 * @param string $meta
	 */
	protected function update_meta( $meta ) {
		update_option( self::META_KEY, $meta );
	}

	/**
	 * @since 1.2.0
	 * @access protected
	 * @return string
	 */
	protected function get_file_handle_id() {
		return self::FILE_HANDLER_ID;
	}

	/**
	 * @since 1.2.0
	 * @access protected
	*/
	protected function render_css() {
		$this->render_schemes_css();
	}

	/**
	 * @since 1.2.0
	 * @access protected
	 * @return string
	 */
	protected function get_file_name() {
		return 'global';
	}

	/**
	 * @since 1.2.0
	 * @access protected
	*/
	protected function get_inline_dependency() {
		return 'embroidery-frontend';
	}

	/**
	 * @since 1.2.0
	 * @access protected
	 * @return bool
	 */
	protected function is_update_required() {
		$file_last_updated = $this->get_meta( 'time' );

		$schemes_last_update = get_option( Scheme_Base::LAST_UPDATED_META );

		if ( $file_last_updated < $schemes_last_update ) {
			return true;
		}

		$embroidery_settings_last_updated = get_option( Settings::UPDATE_TIME_FIELD );

		if ( $file_last_updated < $embroidery_settings_last_updated ) {
			return true;
		}

		return false;
	}

	/**
	 * @since 1.2.0
	 * @access private
	*/
	private function render_schemes_css() {
		$embroidery = Plugin::$instance;

		foreach ( $embroidery->widgets_manager->get_widget_types() as $widget ) {
			$scheme_controls = $widget->get_scheme_controls();

			foreach ( $scheme_controls as $control ) {
				$this->add_control_rules(
					$control, $widget->get_controls(), function( $control ) use ( $embroidery ) {
						$scheme_value = $embroidery->schemes_manager->get_scheme_value( $control['scheme']['type'], $control['scheme']['value'] );

						if ( empty( $scheme_value ) ) {
							return null;
						}

						if ( ! empty( $control['scheme']['key'] ) ) {
							$scheme_value = $scheme_value[ $control['scheme']['key'] ];
						}

						if ( empty( $scheme_value ) ) {
							return null;
						}

						return $scheme_value;
					}, [ '{{WRAPPER}}' ], [ '.embroidery-widget-' . $widget->get_name() ]
				);
			}
		}
	}
}
