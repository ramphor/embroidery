# PHP Hooks

## TOC
  * [Frontend Filters](#frontend-filters)
    + [`embroidery/frontend/the_content`](#embroideryfrontendthe_content)
    + [`embroidery/widget/render_content`](#embroiderywidgetrender_content)
    + [`embroidery/frontend/print_google_fonts`](#embroideryfrontendprint_google_fonts)
  * [Editor Filters](#editor-filters)
    + [`embroidery/element/print_template`](#embroideryelementprint_template)
  * [Init Actions](#init-actions)
    + [`embroidery/loaded`](#embroideryloaded)
    + [`embroidery/init`](#embroideryinit)
    + [`embroidery/widget/{name}/skins_init`](#embroiderywidgetnameskins_init)
  * [Frontend Actions](#frontend-actions)
    + [`embroidery/frontend/before_enqueue_scripts`](#embroideryfrontendbefore_enqueue_scripts)
    + [`embroidery/frontend/after_register_styles`](#embroideryfrontendafter_register_styles)
    + [`embroidery/frontend/after_enqueue_styles`](#embroideryfrontendafter_enqueue_styles)
    + [`embroidery/element/parse_css`](#embroideryelementparse_css)
    + [`embroidery/frontend/{section|column|widget}/before_render`](#embroideryfrontendsectioncolumnwidgetbefore_render)
    + [`embroidery/frontend/{section|column|widget}/after_render`](#embroideryfrontendsectioncolumnwidgetafter_render)
    + [`embroidery/widgets/widgets_registered`](#embroiderywidgetswidgets_registered)
  * [Editor Actions](#editor-actions)
    + [`embroidery/editor/after_save`](#embroideryeditorafter_save)
    + [`embroidery/editor/before_enqueue_scripts`](#embroideryeditorbefore_enqueue_scripts)
    + [`embroidery/element/before_section_start`](#embroideryelementbefore_section_start)
    + [`embroidery/element/after_section_end`](#embroideryelementafter_section_end)
    + [`embroidery/element/{$element_name}/{$section_id}/before_section_start`](#embroideryelementelementnamesection_idbefore_section_start)
    + [`embroidery/element/{element_name}/{section_id}/after_section_end`](#embroideryelementelementnamesection_idafter_section_end)
    + [`embroidery/element/after_section_start`](#embroideryelementafter_section_start)
    + [`embroidery/element/before_section_end`](#embroideryelementbefore_section_end)
    + [`embroidery/element/{$element_name}/{$section_id}/after_section_start`](#embroideryelementelementnamesection_idafter_section_start)
    + [`embroidery/element/{element_name}/{section_id}/before_section_end`](#embroideryelementelementnamesection_idbefore_section_end)
  * [Preview Actions](#preview-actions)
    + [`embroidery/preview/enqueue_styles`](#embroiderypreviewenqueue_styles)

## Frontend Filters

### `embroidery/frontend/the_content`
Applied to frontend HTML content (the entire Embroidery content in page).

#### Arguments

Argument          | Type         | Description
------------      | :------:     | ---------------------------------------------
`content`         | *`string`*   | The entire Embroidery HTML output of current page/post

#### Example

```php
add_action( 'embroidery/frontend/the_content', function( $content ) {
	if ( ! membership_plugin_is_allowed_content() ) {
		$content = __( 'Forbidden', 'membership_plugin' );
	}

	return $content;
} );
```

### `embroidery/widget/render_content`
Applied to the PHP html content of a single widget. ( in the Editor it will be shown after the finish edit the element. to change the JavaScript Template see [`embroidery/element/print_template`](#embroideryelementprint_template))

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`content`         | *`string`*        | The widget HTML output
`widget`          | *`Widget_Base`*   | The widget instance

#### Example

 ```php
add_action( 'embroidery/widget/render_content', function( $content, $widget ) {
	if ( 'heading' === $widget->get_name() ) {
		$settings = $widget->get_settings();

		if ( ! empty( $settings['link']['is_external'] ) ) {
			$content .= '<i class="fa fa-external-link" aria-hidden="true"></i>';
		}
	}

	return $content;
}, 10, 2 );
 ```

 ### `embroidery/frontend/print_google_fonts`
 Used to prevent loading of Google Fonts by Embroidery

 #### Arguments
 None

 #### Example

  ```php
add_filter( 'embroidery/frontend/print_google_fonts', '__return_false' );
 ```

## Editor Filters

### `embroidery/element/print_template`
Applied to the javascript preview templates.

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`template`        | *`string`*        | The JavaScript template output
`widget`          | *`Widget_Base`*   | The widget instance

#### Example

 ```php
add_action( 'embroidery/element/print_template', function( $template, $widget ) {
	if ( 'heading' === $widget->get_name() ) {
		$old_template = '<a href="\' + settings.link.url + \'">\' + title_html + \'</a>';
		$new_template = '<a href="\' + settings.link.url + \'">\' + title_html + ( settings.link.is_external ? \'<i class="fa fa-external-link" aria-hidden="true"></i>\' : \'\' ) + \'</a>';
		$template = str_replace( $old_template, $new_template, $template );
	}

	return $template;
}, 10, 2 );
 ```
 Note: The code above it for example only, we do not recommend to use `str_replace` on templates, because the template may be changed and the `str_replace` will fail. instead, take the whole original template and change it for your needs.

## Init Actions

### `embroidery/loaded`
Embroidery plugin is loaded, before load all components

#### Arguments
None

#### Example

 ```php
add_action( 'embroidery/loaded', 'load_my_plugin' );
 ```

### `embroidery/init`
Embroidery is fully loaded

#### Arguments
None

#### Example

 ```php
// Add a custom category for panel widgets
add_action( 'embroidery/init', function() {
	\Embroidery\Plugin::$instance->elements_manager->add_category(
		'theme-elements',
		[
			'title' => __( 'Theme Elements', 'theme-domain' ),
			'icon' => 'fa fa-plug', //default icon
		],
		2 // position
	);
} );
```

### `embroidery/widget/{name}/skins_init`
Runs after widget construction.
Here is th place to register custom skins.

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`widget`          | *`Widget_Base`*   | The widget instance

#### Example

 ```php
// Add a custom skin for the Google Maps widget
add_action( 'embroidery/widget/google_maps/skins_init', function( $widget ) {
	$widget->add_skin( new MySkins\Skin_Dark_Map( $widget ) );
} );
```

## Frontend Actions

### `embroidery/frontend/before_enqueue_scripts`
Before the frontend scripts enqueuing.

#### Arguments
None

#### Example

 ```php
add_action( 'embroidery/frontend/before_enqueue_scripts', function() {
	wp_enqueue_script(
		'plugin-name-frontend',
		'plugin-url/assets/frontend.js',
		[
			'embroidery-frontend', // dependency
		],
		'plugin_version',
		true // in_footer
	);
} );
```

### `embroidery/frontend/after_register_styles`
After Embroidery registers all styles.

#### Arguments
None

### `embroidery/frontend/after_enqueue_styles`
After the frontend styles enqueuing.

#### Arguments
None

#### Example

 ```php
add_action( 'embroidery/frontend/after_enqueue_styles', function() {
    wp_dequeue_style( 'font-awesome' );
} );
```

### `embroidery/element/parse_css`
After Parse the element CSS in order to generate the CSS file

#### Arguments
Argument          | Type              | Description
------------      | :------:          | ----------------------
`post_css`        | *`Post_CSS_File`* | The Post CSS generator
`element`         | *`Element_Base`*  | The element instance

#### Example

 ```php
add_action(	'embroidery/element/parse_css', function( $post_css, $element ) {
	$item_width = some_get_theme_config_function( 'item_width' );
	/**
	 * @var \Embroidery\Post_CSS_File $post_css
	 * @var \Embroidery\Element_Base  $element
	 */
	$post_css->get_stylesheet()->add_rules( $element->get_unique_selector(), [
		'width' => $item_width . 'px',
	] );
}, 10, 2 );
```

### `embroidery/frontend/{element|widget}/before_render`
### `embroidery/frontend/{element|widget}/after_render`
Before/after the element is printed

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`element`         | *`Element_Base`*  | The element instance

#### Example

```php
add_action( 'embroidery/frontend/element/before_render', function ( \Embroidery\Element_Base $element ) {
	if ( ! $element->get_settings( 'my-custom-settings' ) ) {
		return;
	}

	$element->add_render_attribute( '_wrapper', [
		'class' => 'my-custom-class',
		'data-my_data' => 'my-data-value',
	] );
} );
```

### `embroidery/widgets/widgets_registered`
The place to register your custom widgets.

#### Arguments

Argument          | Type               | Description
------------      | :------:           | ----------------------
`widgets_manager` | *`Widgets_Manager`*| The widgets manager instance

#### Example

```php
add_action( 'embroidery/widgets/widgets_registered', function( $widgets_manager ) {
	require 'plugin-path/widgets/my-widget.php';

    $widgets_manager->register_widget_type( new My_Widget() );
} );
```

## Editor Actions
### `embroidery/editor/after_save`
Runs after saving Embroidery data.

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`post_id`         | *`integer`*       | The post ID
`editor_data`     | *`array`*         | Array of Embroidery elements

#### Example

```php
add_action( 'embroidery/editor/after_save', function( $post_id, $editor_data ) {
    // Activity Log Plugin
    aal_insert_log(
		[
			'action' => 'saved',
			'object_type' => 'Embroidery Data',
			'object_id' => $post_id,
			'object_name' => get_the_title( $post_id ),
		]
	);
}
```

### `embroidery/editor/before_enqueue_scripts`
Before the editor scripts enqueuing.

#### Arguments
None

#### Example

 ```php
add_action( 'embroidery/editor/before_enqueue_scripts', function() {
	wp_enqueue_script(
		'plugin-name-editor',
		'plugin-url/assets/editor.js',
		[
			'embroidery-editor', // dependency
		],
		'plugin_version',
		true // in_footer
	);
} );
```

start_controls_section
### `embroidery/element/before_section_start`
### `embroidery/element/after_section_end`
Runs before/after an editor section is registered.
Here is the place to add additional sections before and after each section for all elements in panel
If you need to add a section in a specific place ( a specific element & section ), prefer to use the [next hook](#embroideryelementelement_namesection_idbefore_section_start)

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`element`         | *`Element_Base`*  | The edited element.
`section_id`      | *`string`*        | Current section  id
`args`            | *`array`*         | The $args that sent to `$element->start_controls_section`

#### Example

 ```php

add_action( 'embroidery/element/before_section_start', function( $element, $section_id, $args ) {
	/** @var \Embroidery\Element_Base $element */
	if ( 'section' === $element->get_name() && 'section_background' === $section_id ) {

		$element->start_controls_section(
			'custom_section',
			[
				'tab' => \Embroidery\Controls_Manager::TAB_STYLE,
				'label' => __( 'Custom Section', 'plugin-name' ),
			]
		);

		$element->add_control(
			'custom_control',
			[
			'type' => \Embroidery\Controls_Manager::NUMBER,
			'label' => __( 'Custom Control', 'plugin-name' ),
			]
		);

		$element->end_controls_section();
	}
}, 10, 3 );
```

### `embroidery/element/{$element_name}/{$section_id}/before_section_start`
### `embroidery/element/{element_name}/{section_id}/after_section_end`
Runs before/after a specific element ( like `heading`) and a specific section ( like `section_title` )

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`element`         | *`Element_Base`*  | The edited element.
`args`            | *`array`*         | The $args that sent to `$element->start_controls_section`

#### Example

```php
add_action( 'embroidery/element/heading/section_title/before_section_start', function( $element, $args ) {
	/** @var \Embroidery\Element_Base $element */
	$element->start_controls_section(
		'custom_section',
		[
			'tab' => \Embroidery\Controls_Manager::TAB_STYLE,
			'label' => __( 'Custom Section', 'plugin-name' ),
		]
	);

	$element->add_control(
		'custom_control',
		[
			'type' => \Embroidery\Controls_Manager::NUMBER,
			'label' => __( 'Custom Control', 'plugin-name' ),
		]
	);

	$element->end_controls_section();
}, 10, 2 );
```

### `embroidery/element/after_section_start`
### `embroidery/element/before_section_end`
Runs within an editor section. after it was opened / before the section is closed.
Here is the place to add additional controls to existing sections.
If you need to add a control to a specific place ( a specific element & section ), prefer to use the [next hook](#embroideryelementelement_namesection_idafter_section_start)

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`element`         | *`Element_Base`*  | The edited element.
`section_id`      | *`string`*        | Current section id
`args`            | *`array`*         | The $args that sent to `$element->start_controls_section`

#### Example

```php
add_action( 'embroidery/element/after_section_start', function( $element, $section_id, $args ) {
	/** @var \Embroidery\Element_Base $element */
	if ( 'section' === $element->get_name() && 'section_background' === $section_id ) {
		$element->add_control(
			'custom_control',
			[
				'type' => \Embroidery\Controls_Manager::NUMBER,
				'label' => __( 'Custom Control', 'plugin-name' ),
			]
		);
	}
}, 10, 3 );
```

### `embroidery/element/{$element_name}/{$section_id}/after_section_start`
### `embroidery/element/{element_name}/{section_id}/before_section_end`

Runs within an editor section. after it was opened / before the section is closed.
Here is the place to add additional controls before and after a specific element ( like `heading`) and a specific section ( like `section_title` )

#### Arguments

Argument          | Type              | Description
------------      | :------:          | ----------------------
`element`         | *`Element_Base`*  | The edited element.
`args`            | *`array`*         | The $args that sent to `$element->start_controls_section`

#### Example

```php
add_action( 'embroidery/element/heading/section_title/before_section_start', function( $element, $args ) {
	/** @var \Embroidery\Element_Base $element */
	$element->add_control(
		'custom_control',
		[
			'type' => \Embroidery\Controls_Manager::NUMBER,
			'label' => __( 'Custom Control', 'plugin-name' ),
		]
	);
}, 10, 2 );
```

## Preview Actions
### `embroidery/preview/enqueue_styles`
Before the preview styles enqueuing.

#### Arguments
None

#### Example

 ```php
add_action( 'embroidery/preview/enqueue_styles', function() {
	wp_enqueue_style(
		'embroidery-preview-style',
		url/to/style.css',
		[],
		'plugin-version'
	);
} );
```
