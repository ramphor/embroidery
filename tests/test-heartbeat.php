<?php

class Embroidery_Test_Heartbeat extends WP_UnitTestCase {

	protected $user_own_post;
	protected $user_editor;

	public function setUp() {
		parent::setUp();

		// Create new instance again
		new \Embroidery\Heartbeat;
	}

	public function test_postLock() {
		$this->user_own_post = $this->factory->user->create( [ 'role' => 'administrator' ] );
		$this->user_editor = $this->factory->user->create( [ 'role' => 'administrator' ] );

		wp_set_current_user( $this->user_own_post );

		$post = $this->factory->post->create_and_get();

		$data = [
			'embroidery_post_lock' => [
				'post_ID' => $post->ID,
			],
		];

		/** This filter is documented in wp-admin/includes/ajax-actions.php */
		$response = apply_filters( 'heartbeat_received', [], $data, '' );

		// Switch to other user
		wp_set_current_user( $this->user_editor );

		$this->assertEquals( $this->user_own_post, wp_check_post_lock( $post->ID ) );

		/** This filter is documented in wp-admin/includes/ajax-actions.php */
		$response = apply_filters( 'heartbeat_received', [], $data, '' );

		$this->assertArrayHasKey( 'locked_user', $response );
	}
}
