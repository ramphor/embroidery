<?php
namespace Embroidery\Modules\History;

use Embroidery\Core\Base\Module as BaseModule;
use Embroidery\Plugin;

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

class Module extends BaseModule {

	public function get_name() {
		return 'history';
	}

	public function localize_settings( $settings ) {
		$settings = array_replace_recursive( $settings, [
			'i18n' => [
				'history' => __( 'History', 'embroidery' ),
				'template' => __( 'Template', 'embroidery' ),
				'added' => __( 'Added', 'embroidery' ),
				'removed' => __( 'Removed', 'embroidery' ),
				'edited' => __( 'Edited', 'embroidery' ),
				'moved' => __( 'Moved', 'embroidery' ),
				'duplicated' => __( 'Duplicated', 'embroidery' ),
				'editing_started' => __( 'Editing Started', 'embroidery' ),
			],
		] );

		return $settings;
	}

	public function __construct() {
		parent::__construct();

		add_filter( 'embroidery/editor/localize_settings', [ $this, 'localize_settings' ] );

		Plugin::$instance->editor->add_editor_template( __DIR__ . '/views/history-panel-template.php' );
		Plugin::$instance->editor->add_editor_template( __DIR__ . '/views/revisions-panel-template.php' );
	}
}
