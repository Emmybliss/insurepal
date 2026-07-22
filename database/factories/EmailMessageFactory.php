<?php

namespace Database\Factories;

use App\Models\EmailAccount;
use App\Models\EmailFolder;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmailMessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id' => EmailAccount::factory(),
            'folder_id' => EmailFolder::factory(),
            'message_id_remote' => fake()->unique()->regexify('[A-Za-z0-9]{40}'),
            'thread_id' => fake()->regexify('[A-Za-z0-9]{40}'),
            'subject' => fake()->sentence(),
            'body_html' => '<p>'.fake()->paragraphs(3, true).'</p>',
            'body_text' => fake()->paragraphs(3, true),
            'from_address' => fake()->safeEmail(),
            'from_name' => fake()->name(),
            'to_recipients' => [['name' => fake()->name(), 'email' => fake()->safeEmail()]],
            'cc_recipients' => [],
            'bcc_recipients' => [],
            'received_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'is_read' => fake()->boolean(30),
            'is_flagged' => fake()->boolean(10),
            'is_draft' => false,
            'size' => fake()->numberBetween(1024, 5242880),
            'in_reply_to' => null,
        ];
    }

    public function unread(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_read' => false,
        ]);
    }

    public function flagged(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_flagged' => true,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_draft' => true,
            'received_at' => null,
            'from_address' => $attributes['from_address'] ?? fake()->safeEmail(),
        ]);
    }

    public function inFolder(EmailFolder $folder): static
    {
        return $this->state(fn (array $attributes) => [
            'account_id' => $folder->account_id,
            'folder_id' => $folder->id,
        ]);
    }
}
