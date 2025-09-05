<?php

class Embroidery_Test_Widgets extends WP_UnitTestCase {

	public function test_getInstance() {
		$this->assertInstanceOf( '\Embroidery\Widgets_Manager', Embroidery\Plugin::$instance->widgets_manager );
	}

	public function test_getWidgets() {
		$this->assertNotEmpty( Embroidery\Plugin::$instance->widgets_manager->get_widget_types() );
	}

	public function test_elementMethods() {
		foreach ( Embroidery\Plugin::$instance->widgets_manager->get_widget_types() as $widget_type ) {
			$name = $widget_type->get_name();

			if ( 'common' === $name ) {
				continue;
			}

			$this->assertNotEmpty( $widget_type->get_title() );
			$this->assertNotEmpty( $widget_type->get_type() );
			$this->assertNotEmpty( $name );
		}
	}

	public function test_registerNUnregisterWidget() {
		$widget_class = '\Embroidery\Widget_Text_editor';
		$widget_id = 'text-editor';

		$this->assertTrue( Embroidery\Plugin::$instance->widgets_manager->register_widget_type( new $widget_class() ) );

		$widget = Embroidery\Plugin::$instance->widgets_manager->get_widget_types( $widget_id );
		$this->assertInstanceOf( $widget_class, $widget );

		$this->assertTrue( Embroidery\Plugin::$instance->widgets_manager->unregister_widget_type( $widget_id ) );
		$this->assertFalse( Embroidery\Plugin::$instance->widgets_manager->unregister_widget_type( $widget_id ) );

		$this->assertNull( Embroidery\Plugin::$instance->widgets_manager->get_widget_types( $widget_id ) );
	}

	public function test_controlsSelectorsData() {
		foreach ( Embroidery\Plugin::$instance->widgets_manager->get_widget_types() as $widget ) {
			foreach ( $widget->get_controls() as $control ) {
				if ( empty( $control['selectors'] ) ) {
					continue;
				}

				foreach ( $control['selectors'] as $selector => $css_property ) {
					foreach ( explode( ',', $selector ) as $item ) {
						preg_match( '/\{\{(WRAPPER)|(ID)\}\}/', $item, $matches );

						$this->assertTrue( !! $matches );
					}
				}
			}
		}
	}

	public function test_controlsDefaultData() {
		foreach ( Embroidery\Plugin::$instance->widgets_manager->get_widget_types() as $widget ) {
			foreach ( $widget->get_controls() as $control ) {
				if ( \Embroidery\Controls_Manager::SELECT !== $control['type'] )
					continue;

				$error_msg = sprintf( 'Widget: %s, Control: %s', $widget->get_name(), $control['name'] );

				if ( empty( $control['default'] ) ) {
					$this->assertTrue( isset( $control['options'][''] ), $error_msg );
				} else {
					$flat_options = [];

					if ( isset( $control['groups'] ) ) {
						foreach ( $control['groups'] as $index_or_key => $args_or_label ) {
							if ( is_numeric( $index_or_key ) ) {
								$args = $args_or_label;

								$this->assertTrue( is_array( $args['options'] ), $error_msg );

								foreach ( $args['options'] as $key => $label ) {
									$flat_options[ $key ] = $label;
								}
							} else {
								$key = $index_or_key;
								$label = $args_or_label;
								$flat_options[ $key ] = $label;
							}
						}
					} else {
						$flat_options = $control['options'];
					}

					$this->assertArrayHasKey( $control['default'], $flat_options, $error_msg );
				}
			}
		}
	}
}
