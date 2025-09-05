<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
?>
<script type="text/template" id="tmpl-embroidery-empty-preview">
	<div class="embroidery-first-add">
		<div class="embroidery-icon eicon-plus"></div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-preview">
	<div class="embroidery-section-wrap"></div>
</script>

<script type="text/template" id="tmpl-embroidery-add-section">
	<div class="embroidery-add-section-inner">
		<div class="embroidery-add-section-close">
			<i class="eicon-close" aria-hidden="true"></i>
			<span class="embroidery-screen-only"><?php esc_html_e( 'Close', 'embroidery' ); ?></span>
		</div>
		<div class="embroidery-add-new-section">
			<button class="embroidery-add-section-button embroidery-button"><?php _e( 'Add New Section', 'embroidery' ); ?></button>
			<button class="embroidery-add-template-button embroidery-button"><?php _e( 'Add Template', 'embroidery' ); ?></button>
			<div class="embroidery-add-section-drag-title"><?php _e( 'Or drag widget here', 'embroidery' ); ?></div>
		</div>
		<div class="embroidery-select-preset">
			<div class="embroidery-select-preset-title"><?php _e( 'Select your Structure', 'embroidery' ); ?></div>
			<ul class="embroidery-select-preset-list">
				<#
					var structures = [ 10, 20, 30, 40, 21, 22, 31, 32, 33, 50, 60, 34 ];

					_.each( structures, function( structure ) {
					var preset = embroidery.presetsFactory.getPresetByStructure( structure ); #>

					<li class="embroidery-preset embroidery-column embroidery-col-16" data-structure="{{ structure }}">
						{{{ embroidery.presetsFactory.getPresetSVG( preset.preset ).outerHTML }}}
					</li>
					<# } ); #>
			</ul>
		</div>
	</div>
</script>
