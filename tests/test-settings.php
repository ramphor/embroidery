<?php

class Embroidery_Test_Settings extends WP_UnitTestCase {

	public function test_validationsCheckboxList() {
		$this->assertEquals( [], \Embroidery\Settings_Validations::checkbox_list( null ) );
		$this->assertEquals( [ 'a', 'b' ], \Embroidery\Settings_Validations::checkbox_list( [ 'a', 'b' ] ) );
	}
}
