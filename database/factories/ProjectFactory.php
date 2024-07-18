<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    // enum ProjectPhase {
    //     case NotStarted = 'not_started';
    //     case InProgress = 'in_progress';
    //     case Completed = 'completed';
    // }

    public const ProjectPhases = ['not_started', 'in_progress', 'completed'];
    public const Tags = ['mechanical', 'electrical', 'software', 'hardware'];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'published' => $this->faker->boolean(),
            'project_phase' => $this->faker->randomElement(self::ProjectPhases),
            'slug' =>  Str::slug($this->faker->unique()->sentence(2)),
            'title' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'img' => $this->faker->imageUrl(200, 200),
            'content' => $this->faker->paragraphs($this->faker->numberBetween(0, 7), true),
            'gallery' => json_encode($this->faker->randomElements([$this->faker->imageUrl(200, 200)], null)),
            'tags' => json_encode($this->faker->randomElements(self::Tags, null)),
        ];
    }
}
