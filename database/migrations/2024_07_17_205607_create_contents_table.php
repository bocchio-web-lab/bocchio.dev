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
        Schema::create('contents', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['app', 'mix', 'project'])->nullable(false);
            $table->boolean('published')->default(false)->nullable(false);
            $table->integer('phase')->default(0)->nullable(true);
            $table->string('slug')->nullable(false);
            $table->string('title')->nullable(false);
            $table->text('description')->nullable(true);
            $table->string('img')->nullable(true);
            $table->longText('content')->nullable(true);
            $table->json('gallery')->nullable(true);
            $table->json('tags')->nullable(true);
            $table->timestamps();

            $table->unique('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contents');
    }
};
