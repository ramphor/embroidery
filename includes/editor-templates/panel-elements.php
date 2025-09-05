<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
?>
<script type="text/template" id="tmpl-embroidery-panel-elements">
	<div id="embroidery-panel-elements-navigation" class="embroidery-panel-navigation">
		<div id="embroidery-panel-elements-navigation-all" class="embroidery-panel-navigation-tab active" data-view="categories"><?php echo __( 'Elements', 'embroidery' ); ?></div>
		<div id="embroidery-panel-elements-navigation-global" class="embroidery-panel-navigation-tab" data-view="global"><?php echo __( 'Global', 'embroidery' ); ?></div>
	</div>
	<div id="embroidery-panel-elements-search-area"></div>
	<div id="embroidery-panel-elements-wrapper"></div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-categories">
	<div id="embroidery-panel-categories"></div>

	<div id="embroidery-panel-get-pro-elements" class="embroidery-panel-nerd-box">
		<i class="embroidery-panel-nerd-box-icon eicon-hypster" aria-hidden="true"></i>
		<div class="embroidery-panel-nerd-box-message"><?php _e( 'Get more with Embroidery Pro', 'embroidery' ); ?></div>
		<a class="embroidery-button embroidery-button-default embroidery-panel-nerd-box-link" target="_blank" href="<?php echo Utils::get_pro_link( 'https://embroidery.com/pro/?utm_source=panel-widgets&utm_campaign=gopro&utm_medium=wp-dash' ); ?>"><?php _e( 'Go Pro', 'embroidery' ); ?></a>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-elements-category">
	<div class="panel-elements-category-title panel-elements-category-title-{{ name }}">{{{ title }}}</div>
	<div class="panel-elements-category-items"></div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-element-search">
	<label for="embroidery-panel-elements-search-input" class="screen-reader-text"><?php echo __( 'Search Widget:', 'embroidery' ); ?></label>
	<input type="search" id="embroidery-panel-elements-search-input" placeholder="<?php esc_attr_e( 'Search Widget...', 'embroidery' ); ?>" />
	<i class="fa fa-search" aria-hidden="true"></i>
</script>

<script type="text/template" id="tmpl-embroidery-element-library-element">
	<div class="embroidery-element">
		<div class="icon">
			<i class="{{ icon }}" aria-hidden="true"></i>
		</div>
		<div class="embroidery-element-title-wrapper">
			<div class="title">{{{ title }}}</div>
		</div>
	</div>
</script>

<script type="text/template" id="tmpl-embroidery-panel-global">
	<div class="embroidery-panel-nerd-box">
		<i class="embroidery-panel-nerd-box-icon eicon-hypster" aria-hidden="true"></i>
		<div class="embroidery-panel-nerd-box-title"><?php echo __( 'Meet Our Global Widget', 'embroidery' ); ?></div>
		<div class="embroidery-panel-nerd-box-message"><?php echo __( 'With this feature, you can save a widget as global, then add it to multiple areas. All areas will be editable from one single place.', 'embroidery' ); ?></div>
		<div class="embroidery-panel-nerd-box-message"><?php echo __( 'This feature is only available on Embroidery Pro.', 'embroidery' ); ?></div>
        <a class="embroidery-button embroidery-button-default embroidery-panel-nerd-box-link" target="_blank" href="<?php echo Utils::get_pro_link( 'https://embroidery.com/pro/?utm_source=panel-global&utm_campaign=gopro&utm_medium=wp-dash' ); ?>"><?php _e( 'Go Pro', 'embroidery' ); ?></a>
    </div>
</script>
