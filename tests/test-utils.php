<?php

class Embroidery_Test_Utils extends WP_UnitTestCase {

	public function test_getYoutubeId() {
		$youtube_id = 'WhWc3b3KhnY';
		$youtube_urls = [
			'https://www.youtube.com/watch?v=' . $youtube_id,
			'https://www.youtube.com/watch?v=' . $youtube_id . '&feature=player_embedded',
			'https://youtu.be/' . $youtube_id,
		];

		foreach ( $youtube_urls as $youtube_url ) {
			$video_properties = \Embroidery\Embed::get_video_properties( $youtube_url );

			$this->assertEquals( $youtube_id, $video_properties['video_id'] );
		}

		$this->assertNull( \Embroidery\Embed::get_video_properties( 'https://www.youtube.com/' ) );
	}
}
