<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

?>
<script type="text/template" id="tmpl-embroidery-repeater-row">
	<div class="embroidery-repeater-row-tools">
		<div class="embroidery-repeater-row-handle-sortable">
			<i class="fa fa-ellipsis-v" aria-hidden="true"></i>
			<span class="embroidery-screen-only"><?php esc_html_e( 'Drag & Drop', 'embroidery' ); ?></span>
		</div>
		<div class="embroidery-repeater-row-item-title"></div>
		<div class="embroidery-repeater-row-tool embroidery-repeater-tool-duplicate">
			<i class="fa fa-copy" aria-hidden="true"></i>
			<span class="embroidery-screen-only"><?php esc_html_e( 'Duplicate', 'embroidery' ); ?></span>
		</div>
		<div class="embroidery-repeater-row-tool embroidery-repeater-tool-remove">
			<i class="fa fa-remove" aria-hidden="true"></i>
			<span class="embroidery-screen-only"><?php esc_html_e( 'Remove', 'embroidery' ); ?></span>
		</div>
	</div>
	<div class="embroidery-repeater-row-controls"></div>
</script>
