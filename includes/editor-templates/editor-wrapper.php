<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

global $wp_version;

$body_classes = [
	'embroidery-editor-active',
	'wp-version-' . str_replace( '.', '-', $wp_version ),
];

if ( is_rtl() ) {
	$body_classes[] = 'rtl';
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title><?php echo __( 'Embroidery', 'embroidery' ) . ' | ' . get_the_title(); ?></title>
	<?php wp_head(); ?>
	<script>
		var ajaxurl = '<?php echo admin_url( 'admin-ajax.php', 'relative' ); ?>';
	</script>
</head>
<body class="<?php echo implode( ' ', $body_classes ); ?>">
<div id="embroidery-editor-wrapper">
	<div id="embroidery-preview">
		<div id="embroidery-loading">
			<div class="embroidery-loader-wrapper">
				<div class="embroidery-loader">
					<div class="embroidery-loader-box"></div>
					<div class="embroidery-loader-box"></div>
					<div class="embroidery-loader-box"></div>
					<div class="embroidery-loader-box"></div>
				</div>
				<div class="embroidery-loading-title"><?php _e( 'Loading', 'embroidery' ); ?></div>
			</div>
		</div>
		<div id="embroidery-preview-responsive-wrapper" class="embroidery-device-desktop embroidery-device-rotate-portrait">
			<div id="embroidery-preview-loading">
				<i class="fa fa-spin fa-circle-o-notch" aria-hidden="true"></i>
			</div>
			<?php
			// IFrame will be create here by the Javascript later.
			?>
		</div>
	</div>
	<div id="embroidery-panel" class="embroidery-panel"></div>
</div>
<?php
	wp_footer();
	/** This action is documented in wp-admin/admin-footer.php */
	do_action( 'admin_print_footer_scripts' );
?>
</body>
</html>
