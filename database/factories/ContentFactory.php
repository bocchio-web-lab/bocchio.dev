<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Content>
 */
class ContentFactory extends Factory
{
    // enum ContentPhase {
    //     case NotStarted = 'not_started';
    //     case InProgress = 'in_progress';
    //     case Completed = 'completed';
    // }

    public const Tags = ['mechanical', 'electrical', 'software', 'hardware'];
    protected $title;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'published' => $this->faker->boolean(),
            'type' => $this->faker->randomElement(['app', 'mix', 'project']),
            'phase' => $this->faker->numberBetween(0, 100),
            'title' => $title = $this->faker->sentence(),
            'slug' =>  Str::slug($title),
            'description' => $this->faker->paragraph(),
            'img' => $this->faker->imageUrl(200, 200),
            'content' => $this->faker->paragraphs($this->faker->numberBetween(0, 7), true),
            'gallery' => json_encode($this->faker->randomElements([$this->faker->imageUrl(200, 200)], null)),
            'tags' => json_encode($this->faker->randomElements(self::Tags, null)),
        ];
    }
}
