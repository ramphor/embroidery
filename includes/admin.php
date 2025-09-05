<?php
namespace Embroidery;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Embroidery admin class.
 *
 * Embroidery admin handler class is responsible for initializing Embroidery in
 * WordPress admin.
 *
 * @since 1.0.0
 */
class Admin {

	/**
	 * Enqueue admin scripts.
	 *
	 * Registers all the admin scripts and enqueues them.
	 *
	 * Fired by `admin_enqueue_scripts` action.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function enqueue_scripts() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_register_script(
			'embroidery-dialog',
			EMBROIDERY_ASSETS_URL . 'lib/dialog/dialog' . $suffix . '.js',
			[
				'jquery-ui-position',
			],
			'4.1.0',
			true
		);

		wp_register_script(
			'embroidery-admin-app',
			EMBROIDERY_ASSETS_URL . 'js/admin' . $suffix . '.js',
			[
				'jquery',
			],
			EMBROIDERY_VERSION,
			true
		);

		wp_localize_script(
			'embroidery-admin-app',
			'EmbroideryAdminConfig',
			[
				'home_url' => home_url(),
				'i18n' => [
					'rollback_confirm' => __( 'Are you sure you want to reinstall previous version?', 'embroidery' ),
					'rollback_to_previous_version' => __( 'Rollback to Previous Version', 'embroidery' ),
					'yes' => __( 'Yes', 'embroidery' ),
					'cancel' => __( 'Cancel', 'embroidery' ),
				],
			]
		);

		wp_enqueue_script( 'embroidery-admin-app' );

		if ( in_array( get_current_screen()->id, [ 'plugins', 'plugins-network' ] ) ) {
			add_action( 'admin_footer', [ $this, 'print_deactivate_feedback_dialog' ] );

			$this->enqueue_feedback_dialog_scripts();
		}
	}

	/**
	 * Enqueue admin styles.
	 *
	 * Registers all the admin styles and enqueues them.
	 *
	 * Fired by `admin_enqueue_scripts` action.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function enqueue_styles() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		$direction_suffix = is_rtl() ? '-rtl' : '';

		wp_register_style(
			'embroidery-icons',
			EMBROIDERY_ASSETS_URL . 'lib/eicons/css/embroidery-icons' . $suffix . '.css',
			[],
			EMBROIDERY_VERSION
		);

		wp_register_style(
			'embroidery-admin-app',
			EMBROIDERY_ASSETS_URL . 'css/admin' . $direction_suffix . $suffix . '.css',
			[
				'embroidery-icons',
			],
			EMBROIDERY_VERSION
		);

		wp_enqueue_style( 'embroidery-admin-app' );

		// It's for upgrade notice.
		// TODO: enqueue this just if needed.
		add_thickbox();
	}

	/**
	 * Print switch mode button.
	 *
	 * Adds a switch button in post edit screen (which has cpt support). To allow
	 * the user to switch from the native WordPress editor to Embroidery builder.
	 *
	 * Fired by `edit_form_after_title` action.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param \WP_Post $post The current post object.
	 */
	public function print_switch_mode_button( $post ) {
		if ( ! User::is_current_user_can_edit( $post->ID ) ) {
			return;
		}

		wp_nonce_field( basename( __FILE__ ), '_embroidery_edit_mode_nonce' );
		?>
		<div id="embroidery-switch-mode">
			<input id="embroidery-switch-mode-input" type="hidden" name="_embroidery_post_mode" value="<?php echo Plugin::$instance->db->is_built_with_embroidery( $post->ID ); ?>" />
			<button id="embroidery-switch-mode-button" class="embroidery-button button button-primary button-hero">
				<span class="embroidery-switch-mode-on"><?php _e( '&#8592; Back to WordPress Editor', 'embroidery' ); ?></span>
				<span class="embroidery-switch-mode-off">
					<i class="eicon-embroidery" aria-hidden="true"></i>
					<?php _e( 'Edit with Embroidery', 'embroidery' ); ?>
				</span>
			</button>
		</div>
		<div id="embroidery-editor">
			<a id="embroidery-go-to-edit-page-link" href="<?php echo Utils::get_edit_link( $post->ID ); ?>">
				<div id="embroidery-editor-button" class="embroidery-button button button-primary button-hero">
					<i class="eicon-embroidery" aria-hidden="true"></i>
					<?php _e( 'Edit with Embroidery', 'embroidery' ); ?>
				</div>
				<div class="embroidery-loader-wrapper">
					<div class="embroidery-loader">
						<div class="embroidery-loader-box"></div>
						<div class="embroidery-loader-box"></div>
						<div class="embroidery-loader-box"></div>
						<div class="embroidery-loader-box"></div>
					</div>
					<div class="embroidery-loading-title"><?php _e( 'Loading', 'embroidery' ); ?></div>
				</div>
			</a>
		</div>
		<?php
	}

	/**
	 * Save post.
	 *
	 * Flag the post mode when the post is saved.
	 *
	 * Fired by `save_post` action.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param int $post_id Post ID.
	 */
	public function save_post( $post_id ) {
		if ( ! isset( $_POST['_embroidery_edit_mode_nonce'] ) || ! wp_verify_nonce( $_POST['_embroidery_edit_mode_nonce'], basename( __FILE__ ) ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		Plugin::$instance->db->set_is_embroidery_page( $post_id, ! empty( $_POST['_embroidery_post_mode'] ) );
	}

	/**
	 * Add edit link in dashboard.
	 *
	 * Add an edit link to the post/page action links on the post/pages list table.
	 *
	 * Fired by `post_row_actions` and `page_row_actions` filters.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array    $actions An array of row action links.
	 * @param \WP_Post $post    The post object.
	 *
	 * @return array An updated array of row action links.
	 */
	public function add_edit_in_dashboard( $actions, $post ) {
		if ( User::is_current_user_can_edit( $post->ID ) && Plugin::$instance->db->is_built_with_embroidery( $post->ID ) ) {
			$actions['edit_with_embroidery'] = sprintf(
				'<a href="%s">%s</a>',
				Utils::get_edit_link( $post->ID ),
				__( 'Edit with Embroidery', 'embroidery' )
			);
		}

		return $actions;
	}

	/**
	 * Add Embroidery post state.
	 *
	 * Adds a new "Embroidery" post state to the post table.
	 *
	 * Fired by `display_post_states` filter.
	 *
	 * @since 1.8.0
	 * @access public
	 *
	 * @param array    $post_states An array of post display states.
	 * @param \WP_Post $post        The current post object.
	 *
	 * @return array A filtered array of post display states.
	 */
	public function add_embroidery_post_state( $post_states, $post ) {
		if ( User::is_current_user_can_edit( $post->ID ) && Plugin::$instance->db->is_built_with_embroidery( $post->ID ) ) {
			$post_states['embroidery'] = __( 'Embroidery', 'embroidery' );
		}
		return $post_states;
	}

	/**
	 * Body status classes.
	 *
	 * Adds CSS classes to the admin body tag.
	 *
	 * Fired by `admin_body_class` filter.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $classes Space-separated list of CSS classes.
	 *
	 * @return string Space-separated list of CSS classes.
	 */
	public function body_status_classes( $classes ) {
		global $pagenow;

		if ( in_array( $pagenow, [ 'post.php', 'post-new.php' ] ) && Utils::is_post_type_support() ) {
			$post = get_post();

			$mode_class = Plugin::$instance->db->is_built_with_embroidery( $post->ID ) ? 'embroidery-editor-active' : 'embroidery-editor-inactive';

			$classes .= ' ' . $mode_class;
		}

		return $classes;
	}

	/**
	 * Plugin action links.
	 *
	 * Adds action links to the plugin list table
	 *
	 * Fired by `plugin_action_links` filter.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param array $links An array of plugin action links.
	 *
	 * @return array An array of plugin action links.
	 */
	public function plugin_action_links( $links ) {
		$settings_link = sprintf( '<a href="%s">%s</a>', admin_url( 'admin.php?page=' . Settings::PAGE_ID ), __( 'Settings', 'embroidery' ) );

		array_unshift( $links, $settings_link );

		$links['go_pro'] = sprintf( '<a href="%s" target="_blank" class="embroidery-plugins-gopro">%s</a>', Utils::get_pro_link( 'https://embroidery.com/pro/?utm_source=wp-plugins&utm_campaign=gopro&utm_medium=wp-dash' ), __( 'Go Pro', 'embroidery' ) );

		return $links;
	}

	/**
	 * Plugin row meta.
	 *
	 * Adds row meta links to the plugin list table
	 *
	 * Fired by `plugin_row_meta` filter.
	 *
	 * @since 1.1.4
	 * @access public
	 *
	 * @param array  $plugin_meta An array of the plugin's metadata, including
	 *                            the version, author, author URI, and plugin URI.
	 * @param string $plugin_file Path to the plugin file, relative to the plugins
	 *                            directory.
	 *
	 * @return array An array of plugin row meta links.
	 */
	public function plugin_row_meta( $plugin_meta, $plugin_file ) {
		if ( EMBROIDERY_PLUGIN_BASE === $plugin_file ) {
			$row_meta = [
				'docs' => '<a href="https://go.embroidery.com/docs-admin-plugins/" aria-label="' . esc_attr( __( 'View Embroidery Documentation', 'embroidery' ) ) . '" target="_blank">' . __( 'Docs & FAQs', 'embroidery' ) . '</a>',
				'ideo' => '<a href="https://go.embroidery.com/yt-admin-plugins/" aria-label="' . esc_attr( __( 'View Embroidery Video Tutorials', 'embroidery' ) ) . '" target="_blank">' . __( 'Video Tutorials', 'embroidery' ) . '</a>',
			];

			$plugin_meta = array_merge( $plugin_meta, $row_meta );
		}

		return $plugin_meta;
	}

	/**
	 * Admin notices.
	 *
	 * Add Embroidery notices to WordPress admin screen.
	 *
	 * Fired by `admin_notices` action.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function admin_notices() {
		$upgrade_notice = Api::get_upgrade_notice();
		if ( empty( $upgrade_notice ) ) {
			return;
		}

		if ( ! current_user_can( 'update_plugins' ) ) {
			return;
		}

		if ( ! in_array( get_current_screen()->id, [ 'toplevel_page_embroidery', 'edit-embroidery_library', 'embroidery_page_embroidery-system-info', 'dashboard' ] ) ) {
			return;
		}

		// Check if have any upgrades.
		$update_plugins = get_site_transient( 'update_plugins' );
		if ( empty( $update_plugins ) || empty( $update_plugins->response[ EMBROIDERY_PLUGIN_BASE ] ) || empty( $update_plugins->response[ EMBROIDERY_PLUGIN_BASE ]->package ) ) {
			return;
		}
		$product = $update_plugins->response[ EMBROIDERY_PLUGIN_BASE ];

		// Check if have upgrade notices to show.
		if ( version_compare( EMBROIDERY_VERSION, $upgrade_notice['version'], '>=' ) ) {
			return;
		}

		$notice_id = 'upgrade_notice_' . $upgrade_notice['version'];
		if ( User::is_user_notice_viewed( $notice_id ) ) {
			return;
		}

		$details_url = self_admin_url( 'plugin-install.php?tab=plugin-information&plugin=' . $product->slug . '&section=changelog&TB_iframe=true&width=600&height=800' );
		$upgrade_url = wp_nonce_url( self_admin_url( 'update.php?action=upgrade-plugin&plugin=' . EMBROIDERY_PLUGIN_BASE ), 'upgrade-plugin_' . EMBROIDERY_PLUGIN_BASE );
		?>
		<div class="notice updated is-dismissible embroidery-message embroidery-message-dismissed" data-notice_id="<?php echo esc_attr( $notice_id ); ?>">
			<div class="embroidery-message-inner">
				<div class="embroidery-message-icon">
					<i class="eicon-embroidery-square" aria-hidden="true"></i>
				</div>
				<div class="embroidery-message-content">
					<strong><?php _e( 'Update Notification', 'embroidery' ); ?></strong>
					<p>
					<?php
						printf(
							/* translators: 1: Details URL, 2: Accessibility text, 3: Version number, 4: Update URL, 5: Accessibility text */
							__( 'There is a new version of Embroidery Page Builder available. <a href="%1$s" class="thickbox open-plugin-details-modal" aria-label="%2$s">View version %3$s details</a> or <a href="%4$s" class="update-link" aria-label="%5$s">update now</a>.', 'embroidery' ),
							esc_url( $details_url ),
							esc_attr( sprintf(
								/* translators: %s: Embroidery version */
								__( 'View Embroidery version %s details', 'embroidery' ),
								$product->new_version
							) ),
							$product->new_version,
							esc_url( $upgrade_url ),
							esc_attr( __( 'Update Embroidery Now', 'embroidery' ) )
						);
						?>
					</p>
				</div>
				<div class="embroidery-message-action">
					<a class="button embroidery-button" href="<?php echo $upgrade_url; ?>">
						<i class="dashicons dashicons-update" aria-hidden="true"></i>
						<?php _e( 'Update Now', 'embroidery' ); ?>
					</a>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Admin footer text.
	 *
	 * Modifies the "Thank you" text displayed in the admin footer.
	 *
	 * Fired by `admin_footer_text` filter.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param string $text The content that will be printed.
	 *
	 * @return string The content that will be printed.
	 */
	public function admin_footer_text( $footer_text ) {
		$current_screen = get_current_screen();
		$is_embroidery_screen = ( $current_screen && false !== strpos( $current_screen->base, 'embroidery' ) );

		if ( $is_embroidery_screen ) {
			$footer_text = sprintf(
				/* translators: %s: Link to plugin review */
				__( 'Enjoyed <strong>Embroidery</strong>? Please leave us a %s rating. We really appreciate your support!', 'embroidery' ),
				'<a href="https://wordpress.org/support/plugin/embroidery/reviews/?filter=5#new-post" target="_blank">&#9733;&#9733;&#9733;&#9733;&#9733;</a>'
			);
		}

		return $footer_text;
	}

	/**
	 * Enqueue feedback dialog scripts.
	 *
	 * Registers the feedback dialog scripts and enqueues them.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function enqueue_feedback_dialog_scripts() {
		$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

		wp_register_script(
			'embroidery-admin-feedback',
			EMBROIDERY_ASSETS_URL . 'js/admin-feedback' . $suffix . '.js',
			[
				'jquery',
				'underscore',
				'embroidery-dialog',
			],
			EMBROIDERY_VERSION,
			true
		);

		wp_enqueue_script( 'embroidery-admin-feedback' );

		wp_localize_script(
			'embroidery-admin-feedback',
			'EmbroideryAdminFeedbackArgs',
			[
				'is_tracker_opted_in' => Tracker::is_allow_track(),
				'i18n' => [
					'submit_n_deactivate' => __( 'Submit & Deactivate', 'embroidery' ),
					'skip_n_deactivate' => __( 'Skip & Deactivate', 'embroidery' ),
				],
			]
		);
	}

	/**
	 * Print deactivate feedback dialog.
	 *
	 * Display a dialog box to ask the user why he deactivated Embroidery.
	 *
	 * Fired by `admin_footer` filter.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function print_deactivate_feedback_dialog() {
		$deactivate_reasons = [
			'no_longer_needed' => [
				'title' => __( 'I no longer need the plugin', 'embroidery' ),
				'input_placeholder' => '',
			],
			'found_a_better_plugin' => [
				'title' => __( 'I found a better plugin', 'embroidery' ),
				'input_placeholder' => __( 'Please share which plugin', 'embroidery' ),
			],
			'couldnt_get_the_plugin_to_work' => [
				'title' => __( 'I couldn\'t get the plugin to work', 'embroidery' ),
				'input_placeholder' => '',
			],
			'temporary_deactivation' => [
				'title' => __( 'It\'s a temporary deactivation', 'embroidery' ),
				'input_placeholder' => '',
			],
			'other' => [
				'title' => __( 'Other', 'embroidery' ),
				'input_placeholder' => __( 'Please share the reason', 'embroidery' ),
			],
		];

		?>
		<div id="embroidery-deactivate-feedback-dialog-wrapper">
			<div id="embroidery-deactivate-feedback-dialog-header">
				<i class="eicon-embroidery-square" aria-hidden="true"></i>
				<span id="embroidery-deactivate-feedback-dialog-header-title"><?php esc_html_e( 'Quick Feedback', 'embroidery' ); ?></span>
			</div>
			<form id="embroidery-deactivate-feedback-dialog-form" method="post">
				<?php
				wp_nonce_field( '_embroidery_deactivate_feedback_nonce' );
				?>
				<input type="hidden" name="action" value="embroidery_deactivate_feedback" />

				<div id="embroidery-deactivate-feedback-dialog-form-caption"><?php esc_html_e( 'If you have a moment, please share why you are deactivating Embroidery:', 'embroidery' ); ?></div>
				<div id="embroidery-deactivate-feedback-dialog-form-body">
					<?php foreach ( $deactivate_reasons as $reason_key => $reason ) : ?>
						<div class="embroidery-deactivate-feedback-dialog-input-wrapper">
							<input id="embroidery-deactivate-feedback-<?php echo esc_attr( $reason_key ); ?>" class="embroidery-deactivate-feedback-dialog-input" type="radio" name="reason_key" value="<?php echo esc_attr( $reason_key ); ?>" />
							<label for="embroidery-deactivate-feedback-<?php echo esc_attr( $reason_key ); ?>" class="embroidery-deactivate-feedback-dialog-label"><?php echo esc_html( $reason['title'] ); ?></label>
							<?php if ( ! empty( $reason['input_placeholder'] ) ) : ?>
								<input class="embroidery-feedback-text" type="text" name="reason_<?php echo esc_attr( $reason_key ); ?>" placeholder="<?php echo esc_attr( $reason['input_placeholder'] ); ?>" />
							<?php endif; ?>
						</div>
					<?php endforeach; ?>
				</div>
			</form>
		</div>
		<?php
	}

	/**
	 * Register dashboard widgets.
	 *
	 * Adds a new Embroidery widgets to WordPress dashboard.
	 *
	 * Fired by `wp_dashboard_setup` action.
	 *
	 * @since 1.9.0
	 * @access public
	 */
	public function register_dashboard_widgets() {
		wp_add_dashboard_widget( 'e-dashboard-overview', __( 'Embroidery Overview', 'embroidery' ), [ $this, 'embroidery_dashboard_overview_widget' ] );

		// Move our widget to top.
		global $wp_meta_boxes;

		$dashboard = $wp_meta_boxes['dashboard']['normal']['core'];
		$ours = [
			'e-dashboard-overview' => $dashboard['e-dashboard-overview'],
		];

		$wp_meta_boxes['dashboard']['normal']['core'] = array_merge( $ours, $dashboard );
	}

	/**
	 * Embroidery dashboard widget.
	 *
	 * Displays the Embroidery dashboard widget.
	 *
	 * Fired by `wp_add_dashboard_widget` function.
	 *
	 * @since 1.9.0
	 * @access public
	 */
	public function embroidery_dashboard_overview_widget() {
		$embroidery_feed = Api::get_feed_data();

		$recently_edited_query_args = [
			'post_type' => 'any',
			'posts_per_page' => '3',
			'meta_key' => '_embroidery_edit_mode',
			'meta_value' => 'builder',
			'orderby' => 'modified',
		];

		$recently_edited_query = new \WP_Query( $recently_edited_query_args );
		?>
		<div class="e-dashboard-widget">
			<div class="e-overview__header">
				<div class="e-overview__logo"><i class="eicon-embroidery-square"></i></div>
				<div class="e-overview__versions">
					<span class="e-overview__version"><?php esc_html_e( 'Embroidery', 'embroidery' ); ?> v<?php echo esc_html( EMBROIDERY_VERSION ); ?></span>
					<?php
					/**
					 * Embroidery dashboard widget after the version.
					 *
					 * Fires after Embroidery version display in the dashboard widget.
					 *
					 * @since 1.9.0
					 */
					do_action( 'embroidery/admin/dashboard_overview_widget/after_version' );
					?>
				</div>
				<div class="e-overview__create">
					<a href="<?php echo esc_attr( Utils::get_create_new_post_url() ); ?>" class="button"><span aria-hidden="true" class="dashicons dashicons-plus"></span> <?php esc_html_e( 'Create New Page', 'embroidery' ); ?></a>
				</div>
			</div>
			<?php if ( $recently_edited_query->have_posts() ) : ?>
			<div class="e-overview__recently-edited">
				<h3 class="e-overview__heading"><?php esc_html_e( 'Recently Edited', 'embroidery' ); ?></h3>
				<ul class="e-overview__posts">
					<?php
					while ( $recently_edited_query->have_posts() ) :
						$recently_edited_query->the_post();

						$date = date_i18n( _x( 'M jS', 'Dashboard Overview Widget Recently Date', 'embroidery' ), get_the_time( 'U' ) );
					?>
					<li class="e-overview__post">
						 <a href="<?php echo esc_attr( Utils::get_edit_link( get_the_ID() ) ); ?>" class="e-overview__post-link"><?php the_title(); ?> <span class="dashicons dashicons-edit"></span></a> <span><?php echo $date; ?>, <?php the_time(); ?></span>
					</li>
					<?php endwhile; ?>
				</ul>
			</div>
			<?php endif; ?>
			<?php if ( ! empty( $embroidery_feed ) ) : ?>
			<div class="e-overview__feed">
				<h3 class="e-overview__heading"><?php esc_html_e( 'News & Updates', 'embroidery' ); ?></h3>
				<ul class="e-overview__posts">
					<?php foreach ( $embroidery_feed as $feed_item ) : ?>
					<li class="e-overview__post">
						<a href="<?php echo esc_url( $feed_item['url'] ); ?>" class="e-overview__post-link" target="_blank">
							<?php if ( ! empty( $feed_item['badge'] ) ) : ?>
								<span class="e-overview__badge"><?php echo esc_html( $feed_item['badge'] ); ?></span>
							<?php endif; ?>
							<?php echo esc_html( $feed_item['title'] ); ?>
						</a>
						<p class="e-overview__post-description"><?php echo esc_html( $feed_item['excerpt'] ); ?></p>
					</li>
					<?php endforeach; ?>
				</ul>
			</div>
			<?php endif; ?>
			<div class="e-overview__footer">
				<ul>
				<?php foreach ( $this->get_dashboard_overview_widget_footer_actions() as $action_id => $action ) : ?>
					<li class="e-overview__<?php echo esc_attr( $action_id ); ?>"><a href="<?php echo esc_attr( $action['link'] ); ?>" target="_blank"><?php echo esc_html( $action['title'] ); ?> <span class="screen-reader-text"><?php esc_html_e( '(opens in a new window)', 'embroidery' ); ?></span><span aria-hidden="true" class="dashicons dashicons-external"></span></a></li>
				<?php endforeach; ?>
				</ul>
			</div>
		</div>
		<?php
	}

	/**
	 * Ajax embroidery deactivate feedback.
	 *
	 * Send the user feedback when Embroidery is deactivated.
	 *
	 * Fired by `wp_ajax_embroidery_deactivate_feedback` action.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function ajax_embroidery_deactivate_feedback() {
		if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], '_embroidery_deactivate_feedback_nonce' ) ) {
			wp_send_json_error();
		}

		$reason_text = '';

		$reason_key = '';

		if ( ! empty( $_POST['reason_key'] ) ) {
			$reason_key = $_POST['reason_key'];
		}

		if ( ! empty( $_POST[ "reason_{$reason_key}" ] ) ) {
			$reason_text = $_POST[ "reason_{$reason_key}" ];
		}

		Api::send_feedback( $reason_key, $reason_text );

		wp_send_json_success();
	}

	/**
	 * @since 1.9.0
	 * @access private
	 */
	private function get_dashboard_overview_widget_footer_actions() {
		$base_actions = [
			'blog' => [
				'title' => __( 'Blog', 'embroidery' ),
				'link' => 'https://go.embroidery.com/overview-widget-blog/',
			],
			'help' => [
				'title' => __( 'Help', 'embroidery' ),
				'link' => 'https://go.embroidery.com/overview-widget-docs/',
			],
		];

		$additions_actions = [
			'go-pro' => [
				'title' => __( 'Go Pro', 'embroidery' ),
				'link' => Utils::get_pro_link( 'https://embroidery.com/pro/?utm_source=wp-overview-widget&utm_campaign=gopro&utm_medium=wp-dash' ),
			],
		];

		/**
		 * Dashboard widget footer actions.
		 *
		 * Filters the additions actions displayed in Embroidery dashboard widget.
		 *
		 * Developers can add new action links to Embroidery dashboard widget
		 * footer using this filter.
		 *
		 * @since 1.9.0
		 *
		 * @param array $additions_actions Embroidery dashboard widget footer actions.
		 */
		$additions_actions = apply_filters( 'embroidery/admin/dashboard_overview_widget/footer_actions', $additions_actions );

		$actions = $base_actions + $additions_actions;

		return $actions;
	}

	/**
	 * @since 1.9.0
	 * @access public
	 */
	public function admin_action_new_post() {
		check_admin_referer( 'embroidery_action_new_post' );

		if ( empty( $_GET['post_type'] ) ) {
			$post_type = 'post';
		} else {
			$post_type = $_GET['post_type'];
		}

		if ( ! User::is_current_user_can_edit_post_type( $post_type ) ) {
			return;
		}

		$post_data = [
			'post_type' => $post_type,
			'post_title' => __( 'Embroidery', 'embroidery' ),
		];

		$post_id = wp_insert_post( $post_data );

		$post_data['ID'] = $post_id;
		$post_data['post_title'] .= ' #' . $post_id;

		wp_update_post( $post_data );

		wp_redirect( Utils::get_edit_link( $post_id ) );
		die;
	}

	/**
	 * Admin constructor.
	 *
	 * Initializing Embroidery in WordPress admin.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_styles' ] );

		add_action( 'edit_form_after_title', [ $this, 'print_switch_mode_button' ] );
		add_action( 'save_post', [ $this, 'save_post' ] );

		add_filter( 'page_row_actions', [ $this, 'add_edit_in_dashboard' ], 10, 2 );
		add_filter( 'post_row_actions', [ $this, 'add_edit_in_dashboard' ], 10, 2 );

		add_filter( 'display_post_states', [ $this, 'add_embroidery_post_state' ], 10, 2 );

		add_filter( 'plugin_action_links_' . EMBROIDERY_PLUGIN_BASE, [ $this, 'plugin_action_links' ] );
		add_filter( 'plugin_row_meta', [ $this, 'plugin_row_meta' ], 10, 2 );

		add_action( 'admin_notices', [ $this, 'admin_notices' ] );
		add_filter( 'admin_body_class', [ $this, 'body_status_classes' ] );
		add_filter( 'admin_footer_text', [ $this, 'admin_footer_text' ] );

		// Register Dashboard Widgets.
		add_action( 'wp_dashboard_setup', [ $this, 'register_dashboard_widgets' ] );

		// Ajax.
		add_action( 'wp_ajax_embroidery_deactivate_feedback', [ $this, 'ajax_embroidery_deactivate_feedback' ] );

		// Admin Actions
		add_action( 'admin_action_embroidery_new_post', [ $this, 'admin_action_new_post' ] );
	}
}
