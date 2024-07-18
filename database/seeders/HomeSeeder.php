<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Home;

class HomeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('homes')->insert([
            'slug' => '/mixes/who-am-i',
            'title' => 'Who am I?',
            'description' => implode('', [
                '<p>Hi! My name is Tommaso and I am a mechanical engineering student at Politecnico di Milano.</p>',
                '<p>In addition to my university studies, I developed a great passion for IT and programming in my free time.</p>',
                '<p><b>I always want to create new things, try my hand at new challenges, and many times I get carried away until I succeed or am fully satisfied.</b></p>',
                '<p>Finally, I strongly believe in contact with nature as a source of inspiration, and this is probably why I practice Orienteering...</p>',
            ]),
            'img' => 'https://nelsontreehouse.com/wp-content/uploads/2021/10/DJI_0247.jpg',
        ]);

        DB::table('homes')->insert([
            'slug' => '/projects',
            'title' => 'Site\'s content',
            'description' => implode('', [
                '<p>The site is structured over three main sections:</p>',
                '<ul>
                    <li>Projects: <b>brief overview of all the projects I\'m currently working on</b></li>
                    <li>Portals: <b>WebApps built to support particular features of some project</b></li>
                </ul>',
                '<p>Unless stated otherwise, all articles, portals and site itself are to be considered free to use.</p>',
                '<p><b>I encourage spreading any idea you find on my site you may find worthy of sharing.</b></p>',
            ]),
            'img' => 'https://nelsontreehouse.com/wp-content/uploads/2021/10/DJI_0247.jpg',
        ]);

        DB::table('homes')->insert([
            'slug' => '/mixes/what-s-the-aim',
            'title' => 'What\'s the aim?',
            'description' => implode('', [
                '<p>This site was born from the desire to have my own space where I could share my ideas and projects with others.</p>',
                '<p>I believe that social media are for some aspect restrictive and impose you too many limitations.</p>',
                '<p><b>So, my main aim has always been to create a web space that was totally personal</b> and that I could organize in complete autonomy. While developing it, I realized his <b>enormous potential</b>, that was much more than a simple board of articles and posts...</p>',
            ]),
            'img' => 'https://nelsontreehouse.com/wp-content/uploads/2021/10/DJI_0247.jpg',
        ]);
    }
}
