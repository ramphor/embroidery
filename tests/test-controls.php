<?php

class Embroidery_Test_Controls extends WP_UnitTestCase {

	public function test_getInstance() {
		$this->assertInstanceOf( '\Embroidery\Controls_Manager', Embroidery\Plugin::$instance->controls_manager );
	}

	public function test_getControls() {
		$this->assertNotEmpty( Embroidery\Plugin::$instance->controls_manager->get_controls() );
	}

	public function test_renderControls() {
		ob_start();
		Embroidery\Plugin::$instance->controls_manager->render_controls();
		$this->assertNotEmpty( ob_get_clean() );
	}

	public function test_enqueueControlScripts() {
		ob_start();
		Embroidery\Plugin::$instance->controls_manager->enqueue_control_scripts();
		$this->assertEmpty( ob_get_clean() );
	}

	public function test_getTypes() {
		foreach ( Embroidery\Plugin::$instance->controls_manager->get_controls() as $control ) {
			$this->assertNotEmpty( $control->get_type() );
		}
	}

	public function test_registerNUnregisterControl() {
		$control_class = '\Embroidery\Control_Text';

		$control_id = 'text';

		$control_instance = new $control_class();

		Embroidery\Plugin::$instance->controls_manager->register_control( $control_id, new $control_instance );

		$control = Embroidery\Plugin::$instance->controls_manager->get_control( $control_id );

		$this->assertInstanceOf( $control_class, $control );

		$this->assertTrue( Embroidery\Plugin::$instance->controls_manager->unregister_control( $control_id ) );

		$this->assertFalse( Embroidery\Plugin::$instance->controls_manager->unregister_control( $control_id ) );

		// Return the control for next tests..
		Embroidery\Plugin::$instance->controls_manager->register_control( $control_id, $control_instance );
	}

	public function test_groupControlsGetTypes() {
		foreach ( Embroidery\Plugin::$instance->controls_manager->get_control_groups() as $control_group ) {
			$this->assertNotEmpty( $control_group->get_type() );
		}
	}

	public function test_replaceStyleValues() {
		$post_css_file = new \Embroidery\Post_CSS_File( 0 );

		$controls_stack = [
			'margin' => [
				'name' => 'margin',
				'type' => \Embroidery\Controls_Manager::DIMENSIONS,
				'selectors' => [
					'{{WRAPPER}} .embroidery-element' => 'margin: {{TOP}}px {{RIGHT}}px {{BOTTOM}}px {{LEFT}}px;',
				]
			],
			'color' => [
				'name' => 'color',
				'type' => \Embroidery\Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .embroidery-element' => 'color: {{VALUE}};',
				]
			]
		];

		$values = [
			'color' => '#fff',
			'margin' => [
				'top' => '1',
				'right' => '2',
				'bottom' => '3',
				'left' => '4',
			]
		];

		$value_callback = function ( $control ) use ( $values ) {
			return $values[ $control['name'] ];
		};

		$placeholders = [ '{{WRAPPER}}' ];

		$replacements = [ '.embroidery-test-element' ];

		$post_css_file->add_control_rules( $controls_stack['color'], $controls_stack, $value_callback, $placeholders, $replacements );

		$this->assertEquals(
			'#fff',
			$post_css_file->get_stylesheet()->get_rules( 'all', '.embroidery-test-element .embroidery-element', 'color' )
		);

		$post_css_file->add_control_rules( $controls_stack['margin'], $controls_stack, $value_callback, $placeholders, $replacements );

		$this->assertEquals(
			'1px 2px 3px 4px',
			$post_css_file->get_stylesheet()->get_rules( 'all', '.embroidery-test-element .embroidery-element', 'margin' )
		);
	}

	public function test_checkCondition() {
		Embroidery\Plugin::$instance->widgets_manager->get_widget_types(); // Ensure the widgets initialized

		$element_obj = \Embroidery\Plugin::$instance->elements_manager->create_element_instance( [
			'elType' => 'widget',
			'widgetType' => 'text-editor',
			'id' => 'test_id',
			'settings' => [
				'control_1' => 'value',
			]
		] );

		$this->assertTrue( $element_obj->is_control_visible( [] ) );

		$control_option = [
			'name' => 'control_2',
			'condition' => [
				'control_1' => 'value1',
			],
		];

		$this->assertFalse( $element_obj->is_control_visible( $control_option) );

		$control_option = [
			'name' => 'control_2',
			'condition' => [
				'control_1' => 'value',
			],
		];

		$this->assertTrue( $element_obj->is_control_visible( $control_option) );

		$control_option = [
			'name' => 'control_2',
			'condition' => [
				'control_1!' => 'value',
			],
		];
		$this->assertFalse( $element_obj->is_control_visible( $control_option) );
	}

	public function test_getDefaultValue() {
		// Text Control
		$text_control = Embroidery\Plugin::$instance->controls_manager->get_control( \Embroidery\Controls_Manager::TEXT );

		$control_option = [
			'name' => 'key',
			'default' => 'value',
		];
		$this->assertEquals( 'value', $text_control->get_value( $control_option, [] ) );

		// URL Control
		$url_control = Embroidery\Plugin::$instance->controls_manager->get_control( \Embroidery\Controls_Manager::URL );
		$control_option = [
			'name' => 'key',
			'default' => [
				'url' => 'THE_LINK',
			],
		];
		$this->assertEquals( [ 'url' => 'THE_LINK', 'is_external' => '', 'nofollow' => '' ], $url_control->get_value( $control_option, [ 'key' => [ 'is_external' => '' ] ] ) );

		// Repeater Control
		$repeater_control = \Embroidery\Plugin::$instance->controls_manager->get_control( \Embroidery\Controls_Manager::REPEATER );
		$control_option = [
			'name' => 'key',
			'default' => [ [] ],
			'fields' => [
				[
					'name' => 'one',
					'type' => \Embroidery\Controls_Manager::TEXT,
					'default' => 'value',
				],
			],
		];

		$expected = [
			[
				'one' => 'value',
			]
		];
		$this->assertEquals( $expected, $repeater_control->get_value( $control_option, [ [] ] ) );
	}
}
