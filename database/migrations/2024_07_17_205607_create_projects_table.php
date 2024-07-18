<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->boolean('published')->default(false)->nullable(false);
            $table->enum('project_phase', ['not_started', 'in_progress', 'completed'])->default('not_started')->nullable(false);
            $table->string('slug')->nullable(false);
            $table->string('title')->nullable(false);
            $table->text('description')->nullable(true);
            $table->string('img')->nullable(true);
            $table->longText('content')->nullable(true);
            $table->json('gallery')->nullable(true);
            $table->json('tags')->default('[]');
            $table->timestamps();

            $table->unique('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
