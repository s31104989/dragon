<?php
/**
 * Plugin Name:       Dragon
 * Description:       The WordPress plugin that colors the difference between two texts.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            Shigotoron
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       dragon
 *
 * @package           create-block
 */

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function create_block_dragon_block_init()
{
    register_block_type(__DIR__ . '/build',
        ["attributes" =>
            ["oldCode" => ["type" => "string",
                "default" => ""],
                "newCode" => ["type" => "string",
                "default" => ""]]]
    );
}
add_action('init', 'create_block_dragon_block_init');
