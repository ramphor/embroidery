<script type="text/template" id="tmpl-embroidery-panel-history-page">
	<div id="embroidery-panel-elements-navigation" class="embroidery-panel-navigation">
		<div id="embroidery-panel-elements-navigation-history" class="embroidery-panel-navigation-tab active" data-view="history"><?php esc_html_e( 'Actions', 'embroidery' ); ?></div>
		<div id="embroidery-panel-elements-navigation-revisions" class="embroidery-panel-navigation-tab" data-view="revisions"><?php esc_html_e( 'Revisions', 'embroidery' ); ?></div>
	</div>
	<div id="embroidery-panel-history-content"></div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-history-tab">
	<div class="embroidery-panel-box">
		<div class="embroidery-panel-box-content">
			<div id="embroidery-history-list"></div>
			<div class="embroidery-history-revisions-message"><?php esc_html_e( 'Switch to Revisions tab for older versions', 'embroidery' ) ?></div>
		</div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-history-no-items">
	<i class="embroidery-panel-nerd-box-icon eicon-nerd"></i>
	<div class="embroidery-panel-nerd-box-title"><?php esc_html_e( 'No History Yet', 'embroidery' ); ?></div>
	<div class="embroidery-panel-nerd-box-message"><?php esc_html_e( 'Once you start working, you\'ll be able to redo / undo any action you make in the editor.', 'embroidery' ) ?></div>
	<div class="embroidery-panel-nerd-box-message"><?php esc_html_e( 'Switch to Revisions tab for older versions', 'embroidery' ) ?></div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-history-item">
	<div class="embroidery-history-item embroidery-history-item-{{ status }}">
		<div class="embroidery-history-item__details">
			<span class="embroidery-history-item__title">{{{ title }}} </span>
			<span class="embroidery-history-item__subtitle">{{{ subTitle }}} </span>
			<span class="embroidery-history-item__action">{{{ action }}}</span>
		</div>
		<div class="embroidery-history-item__icon">
			<span class="fa"></span>
		</div>
	</div>
</script>
