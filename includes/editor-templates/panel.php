<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * @var Editor $this
 */
?>
<script type="text/template" id="tmpl-embroidery-panel">
	<div id="embroidery-mode-switcher"></div>
	<header id="embroidery-panel-header-wrapper"></header>
	<main id="embroidery-panel-content-wrapper"></main>
	<footer id="embroidery-panel-footer">
		<div class="embroidery-panel-container">
		</div>
	</footer>
</script>

<script type="text/template" id="tmpl-embroidery-panel-menu">
	<div id="embroidery-panel-page-menu-content"></div>
	<div id="embroidery-panel-page-menu-footer">
		<a href="<?php echo esc_url( Utils::get_exit_to_dashboard_url( get_the_ID() ) ); ?>" id="embroidery-panel-exit-to-dashboard" class="embroidery-button embroidery-button-default">
			<i class="fa fa-wordpress"></i>
			<?php echo esc_html__( 'Exit To Dashboard', 'embroidery' ); ?>
		</a>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-menu-group">
	<div class="embroidery-panel-menu-group-title">{{{ title }}}</div>
	<div class="embroidery-panel-menu-items"></div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-menu-item">
	<div class="embroidery-panel-menu-item-icon">
		<i class="{{ icon }}"></i>
	</div>
	<div class="embroidery-panel-menu-item-title">{{{ title }}}</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-header">
	<div id="embroidery-panel-header-menu-button" class="embroidery-header-button">
		<i class="embroidery-icon eicon-menu-bar tooltip-target" aria-hidden="true" data-tooltip="<?php esc_attr_e( 'Menu', 'embroidery' ); ?>"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'Menu', 'embroidery' ); ?></span>
	</div>
	<div id="embroidery-panel-header-title"></div>
	<div id="embroidery-panel-header-add-button" class="embroidery-header-button">
		<i class="embroidery-icon eicon-apps tooltip-target" aria-hidden="true" data-tooltip="<?php esc_attr_e( 'Widgets Panel', 'embroidery' ); ?>"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'Widgets Panel', 'embroidery' ); ?></span>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-footer-content">
	<div id="embroidery-panel-footer-settings" class="embroidery-panel-footer-tool embroidery-leave-open tooltip-target" data-tooltip="<?php esc_html_e( 'Settings', 'embroidery' ); ?>">
		<i class="fa fa-cog" aria-hidden="true"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'Document Settings', 'embroidery' ); ?></span>
	</div>
	<div id="embroidery-panel-footer-responsive" class="embroidery-panel-footer-tool">
		<i class="eicon-device-desktop tooltip-target" aria-hidden="true" data-tooltip="<?php esc_attr_e( 'Responsive Mode', 'embroidery' ); ?>"></i>
		<span class="embroidery-screen-only">
			<?php esc_html_e( 'Responsive Mode', 'embroidery' ); ?>
		</span>
		<div class="embroidery-panel-footer-sub-menu-wrapper">
			<div class="embroidery-panel-footer-sub-menu">
				<div class="embroidery-panel-footer-sub-menu-item" data-device-mode="desktop">
					<i class="embroidery-icon eicon-device-desktop" aria-hidden="true"></i>
					<span class="embroidery-title"><?php esc_html_e( 'Desktop', 'embroidery' ); ?></span>
					<span class="embroidery-description"><?php esc_html_e( 'Default Preview', 'embroidery' ); ?></span>
				</div>
				<div class="embroidery-panel-footer-sub-menu-item" data-device-mode="tablet">
					<i class="embroidery-icon eicon-device-tablet" aria-hidden="true"></i>
					<span class="embroidery-title"><?php esc_html_e( 'Tablet', 'embroidery' ); ?></span>
					<span class="embroidery-description"><?php esc_html_e( 'Preview for 768px', 'embroidery' ); ?></span>
				</div>
				<div class="embroidery-panel-footer-sub-menu-item" data-device-mode="mobile">
					<i class="embroidery-icon eicon-device-mobile" aria-hidden="true"></i>
					<span class="embroidery-title"><?php esc_html_e( 'Mobile', 'embroidery' ); ?></span>
					<span class="embroidery-description"><?php esc_html_e( 'Preview for 360px', 'embroidery' ); ?></span>
				</div>
			</div>
		</div>
	</div>
	<div id="embroidery-panel-footer-history" class="embroidery-panel-footer-tool embroidery-leave-open tooltip-target" data-tooltip="<?php esc_attr_e( 'History', 'embroidery' ); ?>">
		<i class="fa fa-history" aria-hidden="true"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'History', 'embroidery' ); ?></span>
	</div>
	<div id="embroidery-panel-saver-button-preview" class="embroidery-panel-footer-tool tooltip-target" data-tooltip="<?php esc_attr_e( 'Preview Changes', 'embroidery' ); ?>">
		<span id="embroidery-panel-saver-button-preview-label">
			<i class="fa fa-eye" aria-hidden="true"></i>
			<span class="embroidery-screen-only"><?php esc_html_e( 'Preview Changes', 'embroidery' ); ?></span>
		</span>
	</div>
	<div id="embroidery-panel-saver-publish" class="embroidery-panel-footer-tool">
		<button id="embroidery-panel-saver-button-publish" class="embroidery-button embroidery-button-success">
			<span class="embroidery-state-icon">
				<i class="fa fa-spin fa-circle-o-notch" aria-hidden="true"></i>
			</span>
			<span id="embroidery-panel-saver-button-publish-label">
				<?php esc_html_e( 'Publish', 'embroidery' ); ?>
			</span>
		</button>
	</div>
	<div id="embroidery-panel-saver-save-options" class="embroidery-panel-footer-tool" >
		<button id="embroidery-panel-saver-button-save-options" class="embroidery-button embroidery-button-success tooltip-target" data-tooltip="<?php esc_attr_e( 'Save Options', 'embroidery' ); ?>">
			<i class="fa fa-caret-up" aria-hidden="true"></i>
			<span class="embroidery-screen-only"><?php esc_html_e( 'Save Options', 'embroidery' ); ?></span>
		</button>
		<div class="embroidery-panel-footer-sub-menu-wrapper">
			<p class="embroidery-last-edited-wrapper">
				<span class="embroidery-state-icon">
					<i class="fa fa-spin fa-circle-o-notch" aria-hidden="true"></i>
				</span>
				<span class="embroidery-last-edited">
					{{{ embroidery.config.last_edited }}}
				</span>
			</p>
			<div class="embroidery-panel-footer-sub-menu">
				<div id="embroidery-panel-saver-menu-save-draft" class="embroidery-panel-footer-sub-menu-item">
					<i class="embroidery-icon fa fa-save" aria-hidden="true"></i>
					<span class="embroidery-title"><?php esc_html_e( 'Save Draft', 'embroidery' ); ?></span>
				</div>
				<div id="embroidery-panel-saver-menu-save-template" class="embroidery-panel-footer-sub-menu-item">
					<i class="embroidery-icon fa fa-folder" aria-hidden="true"></i>
					<span class="embroidery-title"><?php esc_html_e( 'Save as Template', 'embroidery' ); ?></span>
				</div>
			</div>
		</div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-mode-switcher-content">
	<input id="embroidery-mode-switcher-preview-input" type="checkbox">
	<label for="embroidery-mode-switcher-preview-input" id="embroidery-mode-switcher-preview">
		<i class="fa" aria-hidden="true" title="<?php esc_attr_e( 'Hide Panel', 'embroidery' ); ?>"></i>
		<span class="embroidery-screen-only"><?php esc_html_e( 'Hide Panel', 'embroidery' ); ?></span>
	</label>
</script>

<script type="text/template" id="tmpl-editor-content">
	<div class="embroidery-panel-navigation">
		<# _.each( elementData.tabs_controls, function( tabTitle, tabSlug ) { #>
		<div class="embroidery-panel-navigation-tab embroidery-tab-control-{{ tabSlug }}" data-tab="{{ tabSlug }}">
			<a href="#">{{{ tabTitle }}}</a>
		</div>
		<# } ); #>
	</div>
	<# if ( elementData.reload_preview ) { #>
		<div class="embroidery-update-preview">
			<div class="embroidery-update-preview-title"><?php echo __( 'Update changes to page', 'embroidery' ); ?></div>
			<div class="embroidery-update-preview-button-wrapper">
				<button class="embroidery-update-preview-button embroidery-button embroidery-button-success"><?php echo __( 'Apply', 'embroidery' ); ?></button>
			</div>
		</div>
	<# } #>
	<div id="embroidery-controls"></div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-schemes-disabled">
	<i class="embroidery-panel-nerd-box-icon eicon-nerd" aria-hidden="true"></i>
	<div class="embroidery-panel-nerd-box-title">{{{ '<?php echo __( '{0} are disabled', 'embroidery' ); ?>'.replace( '{0}', disabledTitle ) }}}</div>
	<div class="embroidery-panel-nerd-box-message"><?php printf( __( 'You can enable it from the <a href="%s" target="_blank">Embroidery settings page</a>.', 'embroidery' ), Settings::get_url() ); ?></div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-scheme-color-item">
	<div class="embroidery-panel-scheme-color-input-wrapper">
		<input type="text" class="embroidery-panel-scheme-color-value" value="{{ value }}" data-alpha="true" />
	</div>
	<div class="embroidery-panel-scheme-color-title">{{{ title }}}</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-scheme-typography-item">
	<div class="embroidery-panel-heading">
		<div class="embroidery-panel-heading-toggle">
			<i class="fa" aria-hidden="true"></i>
		</div>
		<div class="embroidery-panel-heading-title">{{{ title }}}</div>
	</div>
	<div class="embroidery-panel-scheme-typography-items embroidery-panel-box-content">
		<?php
		$scheme_fields_keys = Group_Control_Typography::get_scheme_fields_keys();

		$typography_group = Plugin::$instance->controls_manager->get_control_groups( 'typography' );

		$typography_fields = $typography_group->get_fields();

		$scheme_fields = array_intersect_key( $typography_fields, array_flip( $scheme_fields_keys ) );

		$system_fonts = Fonts::get_fonts_by_groups( [ Fonts::SYSTEM ] );

		$google_fonts = Fonts::get_fonts_by_groups( [ Fonts::GOOGLE, Fonts::EARLYACCESS ] );

		foreach ( $scheme_fields as $option_name => $option ) :
		?>
			<div class="embroidery-panel-scheme-typography-item">
				<div class="embroidery-panel-scheme-item-title embroidery-control-title"><?php echo $option['label']; ?></div>
				<div class="embroidery-panel-scheme-typography-item-value">
					<?php if ( 'select' === $option['type'] ) : ?>
						<select name="<?php echo $option_name; ?>" class="embroidery-panel-scheme-typography-item-field">
							<?php foreach ( $option['options'] as $field_key => $field_value ) : ?>
								<option value="<?php echo $field_key; ?>"><?php echo $field_value; ?></option>
							<?php endforeach; ?>
						</select>
					<?php elseif ( 'font' === $option['type'] ) : ?>
						<select name="<?php echo $option_name; ?>" class="embroidery-panel-scheme-typography-item-field">
							<option value=""><?php esc_html_e( 'Default', 'embroidery' ); ?></option>

							<optgroup label="<?php esc_html_e( 'System', 'embroidery' ); ?>">
								<?php foreach ( $system_fonts as $font_title => $font_type ) : ?>
									<option value="<?php echo esc_attr( $font_title ); ?>"><?php echo $font_title; ?></option>
								<?php endforeach; ?>
							</optgroup>

							<optgroup label="<?php esc_html_e( 'Google', 'embroidery' ); ?>">
								<?php foreach ( $google_fonts as $font_title => $font_type ) : ?>
									<option value="<?php echo esc_attr( $font_title ); ?>"><?php echo $font_title; ?></option>
								<?php endforeach; ?>
							</optgroup>
						</select>
					<?php elseif ( 'text' === $option['type'] ) : ?>
						<input name="<?php echo $option_name; ?>" class="embroidery-panel-scheme-typography-item-field" />
					<?php endif; ?>
				</div>
			</div>
		<?php endforeach; ?>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-control-responsive-switchers">
	<div class="embroidery-control-responsive-switchers">
		<#
			var devices = responsive.devices || [ 'desktop', 'tablet', 'mobile' ];

			_.each( devices, function( device ) { #>
				<a class="embroidery-responsive-switcher embroidery-responsive-switcher-{{ device }}" data-device="{{ device }}">
					<i class="eicon-device-{{ device }}"></i>
				</a>
			<# } );
		#>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-page-settings">
	<div class="embroidery-panel-navigation">
		<# _.each( embroidery.config.page_settings.tabs, function( tabTitle, tabSlug ) { #>
			<div class="embroidery-panel-navigation-tab embroidery-tab-control-{{ tabSlug }}" data-tab="{{ tabSlug }}">
				<a href="#">{{{ tabTitle }}}</a>
			</div>
			<# } ); #>
	</div>
	<div id="embroidery-panel-page-settings-controls"></div>
</script>
