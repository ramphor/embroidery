<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Scheme base class.
 *
 * Embroidery base class for schemes is an abstract class implementing the scheme
 * interface. The class is responsible for creating base schemes.
 *
 * @since 1.0.0
 * @abstract
 */
abstract class Scheme_Base implements Scheme_Interface {

	/**
	 * DB option name for the time when the scheme was last updated.
	 */
	const LAST_UPDATED_META = '_embroidery_scheme_last_updated';

	/**
	 * System schemes.
	 *
	 * Holds the list of all the system schemes.
	 *
	 * @since 1.0.0
	 * @access private
	 *
	 * @var array System schemes.
	 */
	private $_system_schemes;

	/**
	 * Init system schemes.
	 *
	 * Initialize the system schemes.
	 *
	 * @since 1.0.0
	 * @access protected
	 * @abstract
	 */
	abstract protected function _init_system_schemes();

	/**
	 * Get description.
	 *
	 * Retrieve the scheme description.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return string Scheme description.
	 */
	public static function get_description() {
		return '';
	}

	/**
	 * Get system schemes.
	 *
	 * Retrieve the system schemes.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string System schemes.
	 */
	final public function get_system_schemes() {
		if ( null === $this->_system_schemes ) {
			$this->_system_schemes = $this->_init_system_schemes();
		}

		return $this->_system_schemes;
	}

	/**
	 * Get scheme value.
	 *
	 * Retrieve the scheme value.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string Scheme value.
	 */
	public function get_scheme_value() {
		$scheme_value = get_option( 'embroidery_scheme_' . static::get_type() );

		if ( ! $scheme_value ) {
			$scheme_value = $this->get_default_scheme();

			update_option( 'embroidery_scheme_' . static::get_type(), $scheme_value );
		}

		return $scheme_value;
	}

	/**
	 * Save scheme.
	 *
	 * Update Embroidery scheme in the database, and update the last updated
	 * scheme time.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array $posted
	 */
	public function save_scheme( array $posted ) {
		$scheme_value = $this->get_scheme_value();

		update_option( 'embroidery_scheme_' . static::get_type(), array_replace( $scheme_value, array_intersect_key( $posted, $scheme_value ) ) );

		update_option( self::LAST_UPDATED_META, time() );
	}

	/**
	 * Get scheme.
	 *
	 * Retrieve the scheme.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return string The scheme.
	 */
	public function get_scheme() {
		$scheme = [];

		$titles = $this->get_scheme_titles();

		foreach ( $this->get_scheme_value() as $scheme_key => $scheme_value ) {
			$scheme[ $scheme_key ] = [
				'title' => isset( $titles[ $scheme_key ] ) ? $titles[ $scheme_key ] : '',
				'value' => $scheme_value,
			];
		}

		return $scheme;
	}

	/**
	 * Print scheme template.
	 *
	 * Used to generate the scheme template on the editor using Underscore JS
	 * template.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	final public function print_template() {
		?>
		<script type="text/template" id="tmpl-embroidery-panel-schemes-<?php echo static::get_type(); ?>">
			<div class="embroidery-panel-scheme-buttons">
				<div class="embroidery-panel-scheme-button-wrapper embroidery-panel-scheme-reset">
					<button class="embroidery-button">
						<i class="fa fa-undo" aria-hidden="true"></i>
						<?php _e( 'Reset', 'embroidery' ); ?>
					</button>
				</div>
				<div class="embroidery-panel-scheme-button-wrapper embroidery-panel-scheme-discard">
					<button class="embroidery-button">
						<i class="fa fa-times" aria-hidden="true"></i>
						<?php _e( 'Discard', 'embroidery' ); ?>
					</button>
				</div>
				<div class="embroidery-panel-scheme-button-wrapper embroidery-panel-scheme-save">
					<button class="embroidery-button embroidery-button-success" disabled><?php _e( 'Apply', 'embroidery' ); ?></button>
				</div>
			</div>
			<?php $this->print_template_content(); ?>
		</script>
		<?php
	}
}
