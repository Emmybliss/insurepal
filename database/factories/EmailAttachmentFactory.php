<?php

namespace Database\Factories;

use App\Models\EmailMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmailAttachmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'message_id' => EmailMessage::factory(),
            'filename' => fake()->word().'.'.fake()->fileExtension(),
            'mime_type' => fake()->mimeType(),
            'size_bytes' => fake()->numberBetween(1024, 10485760),
            'storage_path' => 'email-attachments/'.fake()->sha256(),
            'content_id' => null,
        ];
    }

    public function inline(): static
    {
        $cid = fake()->word().'@'.fake()->domainName();

        return $this->state(fn (array $attributes) => [
            'content_id' => $cid,
        ]);
    }
}
