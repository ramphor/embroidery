<?php

class Embroidery_Test_Fonts extends WP_UnitTestCase {

	public function test_getAllFonts() {
		$this->assertNotEmpty( \Embroidery\Fonts::get_fonts() );
	}

	public function test_getFontType() {
		$this->assertEquals( 'system', \Embroidery\Fonts::get_font_type( 'Arial' ) );
		$this->assertFalse( \Embroidery\Fonts::get_font_type( 'NotFoundThisFont' ) );
	}

	public function test_getFontByGroups() {
		$this->assertArrayHasKey( 'Arial', \Embroidery\Fonts::get_fonts_by_groups( [ 'system' ] ) );
		$this->assertArrayNotHasKey( 'Arial', \Embroidery\Fonts::get_fonts_by_groups( [ 'googlefonts' ] ) );
	}
}
