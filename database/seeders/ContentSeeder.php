<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Content;

class ContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Content::factory()->count(10)->create();
        Content::factory()->count(5)->create(['type' => 'project']);
        Content::factory()->count(3)->create(['type' => 'mix']);
        Content::factory()->count(3)->create(['type' => 'app']);
    }
}
