<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Project;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('projects')->insert([
            'published' => true,
            'project_phase' => 'completed',
            'slug' => Str::slug('Tree House'),
            'title' => 'Tree House',
            'description' => 'This is the first project.',
            'img' => 'https://nelsontreehouse.com/wp-content/uploads/2021/10/DJI_0247.jpg',
            'content' => 'This is the content of the first project.',
            'gallery' => json_encode(['https://nelsontreehouse.com/wp-content/uploads/2021/10/DJI_0247.jpg', 'https://media.newyorker.com/photos/661e7b9dee3bbf86940d41d9/master/pass/Keeley-Treehouse.jpg']),
            'tags' => json_encode(['mechanical', 'software']),
        ]);

        Project::factory()->count(10)->create();

    }
}
