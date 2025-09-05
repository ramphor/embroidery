<script type="text/template" id="tmpl-embroidery-panel-revisions">
	<div class="embroidery-panel-box">
	<div class="embroidery-panel-scheme-buttons">
			<div class="embroidery-panel-scheme-button-wrapper embroidery-panel-scheme-discard">
				<button class="embroidery-button" disabled>
					<i class="fa fa-times"></i><?php esc_html_e( 'Discard', 'embroidery' ); ?>
				</button>
			</div>
			<div class="embroidery-panel-scheme-button-wrapper embroidery-panel-scheme-save">
				<button class="embroidery-button embroidery-button-success" disabled>
					<?php esc_html_e( 'Apply', 'embroidery' ); ?>
				</button>
			</div>
		</div>
	</div>

	<div class="embroidery-panel-box">
		<div class="embroidery-panel-heading">
			<div class="embroidery-panel-heading-title"><?php esc_html_e( 'Revisions', 'embroidery' ); ?></div>
		</div>
		<div id="embroidery-revisions-list" class="embroidery-panel-box-content"></div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-revisions-no-revisions">
	<i class="embroidery-panel-nerd-box-icon eicon-nerd"></i>
	<div class="embroidery-panel-nerd-box-title"><?php esc_html_e( 'No Revisions Saved Yet', 'embroidery' ); ?></div>
	<div class="embroidery-panel-nerd-box-message">{{{ embroidery.translate( embroidery.config.revisions_enabled ? 'no_revisions_1' : 'revisions_disabled_1' ) }}}</div>
	<div class="embroidery-panel-nerd-box-message">{{{ embroidery.translate( embroidery.config.revisions_enabled ? 'no_revisions_2' : 'revisions_disabled_2' ) }}}</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-revisions-revision-item">
	<div class="embroidery-revision-item__wrapper {{ type }}">
		<div class="embroidery-revision-item__gravatar">{{{ gravatar }}}</div>
		<div class="embroidery-revision-item__details">
			<div class="embroidery-revision-date">{{{ date }}}</div>
			<div class="embroidery-revision-meta"><span>{{{ embroidery.translate( type ) }}}</span> <?php esc_html_e( 'By', 'embroidery' ); ?> {{{ author }}}</div>
		</div>
		<div class="embroidery-revision-item__tools">
			<# if ( 'current' === type ) { #>
				<i class="embroidery-revision-item__tools-current fa fa-star"></i>
			<# } else { #>
				<i class="embroidery-revision-item__tools-delete fa fa-times"></i>
			<# } #>

			<i class="embroidery-revision-item__tools-spinner fa fa-spin fa-circle-o-notch"></i>
		</div>
	</div>
</script>
