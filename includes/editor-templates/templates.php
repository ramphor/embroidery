<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
?>
<script type="text/template" id="tmpl-embroidery-template-library-header">
	<div id="embroidery-template-library-header-logo-area"></div>
	<div id="embroidery-template-library-header-menu-area"></div>
	<div id="embroidery-template-library-header-items-area">
		<div id="embroidery-template-library-header-close-modal" class="embroidery-template-library-header-item">
			<i class="eicon-close" aria-hidden="true" title="<?php esc_attr_e( 'Close', 'embroidery' ); ?>"></i>
			<span class="embroidery-screen-only"><?php esc_html_e( 'Close', 'embroidery' ); ?></span>
		</div>
		<div id="embroidery-template-library-header-tools"></div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-header-logo">
	<span id="embroidery-template-library-header-logo-icon-wrapper">
		<i class="eicon-embroidery"></i>
	</span>
	<span><?php echo __( 'Library', 'embroidery' ); ?></span>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-header-actions">
	<div id="embroidery-template-library-header-import" class="embroidery-template-library-header-item">
		<i class="eicon-upload-circle-o" aria-hidden="true" title="<?php esc_attr_e( 'Import Template', 'embroidery' ); ?>"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'Import Template', 'embroidery' ); ?></span>
	</div>
	<div id="embroidery-template-library-header-sync" class="embroidery-template-library-header-item">
		<i class="eicon-sync" aria-hidden="true" title="<?php esc_attr_e( 'Sync Library', 'embroidery' ); ?>"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'Sync Library', 'embroidery' ); ?></span>
	</div>
	<div id="embroidery-template-library-header-save" class="embroidery-template-library-header-item">
		<i class="eicon-save-o" aria-hidden="true" title="<?php esc_attr_e( 'Save', 'embroidery' ); ?>"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'Save', 'embroidery' ); ?></span>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-header-menu">
	<div id="embroidery-template-library-menu-pre-made-templates" class="embroidery-template-library-menu-item" data-template-source="remote"><?php echo __( 'Predesigned Templates', 'embroidery' ); ?></div>
	<div id="embroidery-template-library-menu-my-templates" class="embroidery-template-library-menu-item" data-template-source="local"><?php echo __( 'My Templates', 'embroidery' ); ?></div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-header-preview">
	<div id="embroidery-template-library-header-preview-insert-wrapper" class="embroidery-template-library-header-item">
		{{{ embroidery.templates.getLayout().getTemplateActionButton( obj ) }}}
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-header-back">
	<i class="eicon-" aria-hidden="true"></i>
	<span><?php echo __( 'Back to Library', 'embroidery' ); ?></span>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-loading">
	<div class="embroidery-loader-wrapper">
		<div class="embroidery-loader">
			<div class="embroidery-loader-box"></div>
			<div class="embroidery-loader-box"></div>
			<div class="embroidery-loader-box"></div>
			<div class="embroidery-loader-box"></div>
		</div>
		<div class="embroidery-loading-title"><?php echo __( 'Loading', 'embroidery' ); ?></div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-templates">
	<#
		var activeSource = embroidery.templates.getFilter('source');
	#>
	<div id="embroidery-template-library-toolbar">
		<# if ( 'remote' === activeSource ) { #>
			<div id="embroidery-template-library-filter-toolbar-remote" class="embroidery-template-library-filter-toolbar">
				<div id="embroidery-template-library-order">
					<input type="radio" id="embroidery-template-library-order-new" class="embroidery-template-library-order-input" name="embroidery-template-library-order" value="date">
					<label for="embroidery-template-library-order-new" class="embroidery-template-library-order-label"><?php echo __( 'New', 'embroidery' ); ?></label>
					<input type="radio" id="embroidery-template-library-order-trend" class="embroidery-template-library-order-input" name="embroidery-template-library-order" value="trendIndex">
					<label for="embroidery-template-library-order-trend" class="embroidery-template-library-order-label"><?php echo __( 'Trend', 'embroidery' ); ?></label>
					<input type="radio" id="embroidery-template-library-order-popular" class="embroidery-template-library-order-input" name="embroidery-template-library-order" value="popularityIndex">
					<label for="embroidery-template-library-order-popular" class="embroidery-template-library-order-label"><?php echo __( 'Popular', 'embroidery' ); ?></label>
				</div>
				<div id="embroidery-template-library-my-favorites">
					<input id="embroidery-template-library-filter-my-favorites" type="checkbox">
					<label id="embroidery-template-library-filter-my-favorites-label" for="embroidery-template-library-filter-my-favorites">
						<i class="fa" aria-hidden="true"></i>
						<?php echo __( 'My Favorites', 'embroidery' ); ?>
					</label>
				</div>
			</div>
		<# } else { #>
			<div id="embroidery-template-library-filter-toolbar-local" class="embroidery-template-library-filter-toolbar"></div>
		<# } #>
		<div id="embroidery-template-library-filter-text-wrapper">
			<input id="embroidery-template-library-filter-text" placeholder="<?php echo __( 'Search', 'embroidery' ); ?>">
		</div>
	</div>
	<# if ( 'local' === activeSource ) { #>
		<div id="embroidery-template-library-order-toolbar-local">
			<div class="embroidery-template-library-local-column-1">
				<input type="radio" id="embroidery-template-library-order-local-title" class="embroidery-template-library-order-input" name="embroidery-template-library-order-local" value="title" data-default-ordering-direction="asc">
				<label for="embroidery-template-library-order-local-title" class="embroidery-template-library-order-label"><?php echo __( 'Name', 'embroidery' ); ?></label>
			</div>
			<div class="embroidery-template-library-local-column-2">
				<input type="radio" id="embroidery-template-library-order-local-type" class="embroidery-template-library-order-input" name="embroidery-template-library-order-local" value="type" data-default-ordering-direction="asc">
				<label for="embroidery-template-library-order-local-type" class="embroidery-template-library-order-label"><?php echo __( 'Type', 'embroidery' ); ?></label>
			</div>
			<div class="embroidery-template-library-local-column-3">
				<input type="radio" id="embroidery-template-library-order-local-author" class="embroidery-template-library-order-input" name="embroidery-template-library-order-local" value="author" data-default-ordering-direction="asc">
				<label for="embroidery-template-library-order-local-author" class="embroidery-template-library-order-label"><?php echo __( 'Created By', 'embroidery' ); ?></label>
			</div>
			<div class="embroidery-template-library-local-column-4">
				<input type="radio" id="embroidery-template-library-order-local-date" class="embroidery-template-library-order-input" name="embroidery-template-library-order-local" value="date">
				<label for="embroidery-template-library-order-local-date" class="embroidery-template-library-order-label"><?php echo __( 'Creation Date', 'embroidery' ); ?></label>
			</div>
			<div class="embroidery-template-library-local-column-5">
				<div class="embroidery-template-library-order-label"><?php echo __( 'Actions', 'embroidery' ); ?></div>
			</div>
		</div>
	<# } #>
	<div id="embroidery-template-library-templates-container"></div>
	<# if ( 'remote' === activeSource ) { #>
		<div id="embroidery-template-library-footer-banner">
			<i class="eicon-nerd" aria-hidden="true"></i>
			<div class="embroidery-excerpt"><?php echo __( 'Stay tuned! More awesome templates coming real soon.', 'embroidery' ); ?></div>
		</div>
	<# } #>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-template-remote">
	<div class="embroidery-template-library-template-body">
		<div class="embroidery-template-library-template-screenshot" style="background-image: url({{ thumbnail }});"></div>
		<div class="embroidery-template-library-template-controls">
			<div class="embroidery-template-library-template-preview">
				<i class="fa fa-search-plus" aria-hidden="true"></i>
			</div>
			{{{ embroidery.templates.getLayout().getTemplateActionButton( obj ) }}}
		</div>
	</div>
	<div class="embroidery-template-library-template-footer">
		<div class="embroidery-template-library-template-name">{{{ title }}}</div>
		<div class="embroidery-template-library-favorite">
			<input id="embroidery-template-library-template-{{ template_id }}-favorite-input" class="embroidery-template-library-template-favorite-input" type="checkbox"{{ favorite ? " checked" : "" }}>
			<label for="embroidery-template-library-template-{{ template_id }}-favorite-input" class="embroidery-template-library-template-favorite-label">
				<i class="fa fa-heart-o" aria-hidden="true"></i>
				<span class="embroidery-screen-only"><?php esc_html_e( 'Favorite', 'embroidery' ); ?></span>
			</label>
		</div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-template-local">
	<div class="embroidery-template-library-template-name embroidery-template-library-local-column-1">{{{ title }}}</div>
	<div class="embroidery-template-library-template-meta embroidery-template-library-template-type embroidery-template-library-local-column-2">{{{ embroidery.translate( type ) }}}</div>
	<div class="embroidery-template-library-template-meta embroidery-template-library-template-author embroidery-template-library-local-column-3">{{{ author }}}</div>
	<div class="embroidery-template-library-template-meta embroidery-template-library-template-date embroidery-template-library-local-column-4">{{{ human_date }}}</div>
	<div class="embroidery-template-library-template-controls embroidery-template-library-local-column-5">
		<div class="embroidery-template-library-template-preview">
			<i class="fa fa-eye" aria-hidden="true"></i>
			<span class="embroidery-template-library-template-control-title"><?php echo __( 'Preview', 'embroidery' ); ?></span>
		</div>
		<button class="embroidery-template-library-template-action embroidery-template-library-template-insert embroidery-button embroidery-button-success">
			<i class="eicon-file-download" aria-hidden="true"></i>
			<span class="embroidery-button-title"><?php echo __( 'Insert', 'embroidery' ); ?></span>
		</button>
		<div class="embroidery-template-library-template-more-toggle">
			<i class="eicon-ellipsis-h" aria-hidden="true"></i>
		</div>
		<div class="embroidery-template-library-template-more">
			<div class="embroidery-template-library-template-delete">
				<i class="fa fa-trash-o" aria-hidden="true"></i>
				<span class="embroidery-template-library-template-control-title"><?php echo __( 'Delete', 'embroidery' ); ?></span>
			</div>
			<div class="embroidery-template-library-template-export">
				<a href="{{ export_link }}">
					<i class="fa fa-sign-out" aria-hidden="true"></i>
					<span class="embroidery-template-library-template-control-title"><?php echo __( 'Export', 'embroidery' ); ?></span>
				</a>
			</div>
		</div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-insert-button">
	<button class="embroidery-template-library-template-action embroidery-template-library-template-insert embroidery-button embroidery-button-success">
		<i class="eicon-file-download" aria-hidden="true"></i>
		<span class="embroidery-button-title"><?php echo __( 'Insert', 'embroidery' ); ?></span>
	</button>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-get-pro-button">
	<a href="<?php echo Utils::get_pro_link( 'https://embroidery.com/pro/?utm_source=panel-library&utm_campaign=gopro&utm_medium=wp-dash' ); ?>" target="_blank">
		<button class="embroidery-template-library-template-action embroidery-button embroidery-button-go-pro">
			<i class="fa fa-external-link-square" aria-hidden="true"></i>
			<span class="embroidery-button-title"><?php echo __( 'Go Pro', 'embroidery' ); ?></span>
		</button>
	</a>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-save-template">
	<div class="embroidery-template-library-blank-icon">
		<i class="eicon-library-save" aria-hidden="true"></i>
	</div>
	<div class="embroidery-template-library-blank-title">{{{ title }}}</div>
	<div class="embroidery-template-library-blank-message">{{{ description }}}</div>
	<form id="embroidery-template-library-save-template-form">
		<input type="hidden" name="post_id" value="<?php echo get_the_ID(); ?>">
		<input id="embroidery-template-library-save-template-name" name="title" placeholder="<?php echo __( 'Enter Template Name', 'embroidery' ); ?>" required>
		<button id="embroidery-template-library-save-template-submit" class="embroidery-button embroidery-button-success">
			<span class="embroidery-state-icon">
				<i class="fa fa-spin fa-circle-o-notch" aria-hidden="true"></i>
			</span>
			<?php echo __( 'Save', 'embroidery' ); ?>
		</button>
	</form>
	<div class="embroidery-template-library-blank-footer">
		<?php echo __( 'Want to learn more about the Embroidery library?', 'embroidery' ); ?>
		<a class="embroidery-template-library-blank-footer-link" href="https://go.embroidery.com/docs-library/" target="_blank"><?php echo __( 'Click here', 'embroidery' ); ?></a>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-import">
	<form id="embroidery-template-library-import-form">
		<div class="embroidery-template-library-blank-icon">
			<i class="eicon-library-upload" aria-hidden="true"></i>
		</div>
		<div class="embroidery-template-library-blank-title"><?php echo __( 'Import Template to Your Library', 'embroidery' ); ?></div>
		<div class="embroidery-template-library-blank-message"><?php echo __( 'Drag & drop your .JSON or .zip template file', 'embroidery' ); ?></div>
		<div id="embroidery-template-library-import-form-or"><?php echo __( 'or', 'embroidery' ); ?></div>
		<label for="embroidery-template-library-import-form-input" id="embroidery-template-library-import-form-label" class="embroidery-button embroidery-button-success"><?php echo __( 'Select File', 'embroidery' ); ?></label>
		<input id="embroidery-template-library-import-form-input" type="file" name="file" accept=".json,.zip" required/>
		<div class="embroidery-template-library-blank-footer">
			<?php echo __( 'Want to learn more about the Embroidery library?', 'embroidery' ); ?>
			<a class="embroidery-template-library-blank-footer-link" href="https://go.embroidery.com/docs-library/" target="_blank"><?php echo __( 'Click here', 'embroidery' ); ?></a>
		</div>
	</form>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-templates-empty">
	<div class="embroidery-template-library-blank-icon">
		<i class="eicon-nerd" aria-hidden="true"></i>
	</div>
	<div class="embroidery-template-library-blank-title"></div>
	<div class="embroidery-template-library-blank-message"></div>
	<div class="embroidery-template-library-blank-footer">
		<?php echo __( 'Want to learn more about the Embroidery library?', 'embroidery' ); ?>
		<a class="embroidery-template-library-blank-footer-link" href="https://go.embroidery.com/docs-library/" target="_blank"><?php echo __( 'Click here', 'embroidery' ); ?></a>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-template-library-preview">
	<iframe></iframe>
</script>
