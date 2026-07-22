<?php

namespace Database\Seeders;

use App\Models\AiMessage;
use App\Models\Conversation;
use App\Models\ToolExecution;
use App\Models\User;
use Illuminate\Database\Seeder;

class AiDataSeeder extends Seeder
{
    public function run(User $brokerAdmin, User $underwriterAdmin): void
    {
        $this->command->info('Seeding AI assistant data...');

        // Conversation 1: Policy inquiry (broker)
        $policyConv = Conversation::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'user_id' => $brokerAdmin->id,
            'title' => 'Policy details for John Adebayo',
            'context_type' => 'policy',
            'context_id' => null,
            'metadata' => ['source' => 'dashboard'],
        ]);

        AiMessage::create([
            'conversation_id' => $policyConv->id,
            'role' => 'user',
            'content' => 'Can you show me the policy details for John Adebayo?',
            'metadata' => ['sent_at' => now()->subMinutes(30)],
        ]);
        AiMessage::create([
            'conversation_id' => $policyConv->id,
            'role' => 'assistant',
            'content' => "I found John Adebayo's policy. Here are the details:\n\n- **Policy Number**: POLI-2024-0001\n- **Type**: Motor Comprehensive\n- **Status**: Active\n- **Premium**: ₦85,000\n- **Sum Insured**: ₦2,500,000\n- **Effective**: Jan 15, 2024 - Jan 14, 2025\n\nWould you like me to check the claims history or generate a renewal quote?",
            'metadata' => ['tool_used' => 'search_policy', 'processing_time_ms' => 1200],
        ]);

        ToolExecution::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'user_id' => $brokerAdmin->id,
            'conversation_id' => $policyConv->id,
            'tool_name' => 'search_policy',
            'parameters' => ['query' => 'John Adebayo'],
            'status' => 'completed',
            'result' => ['policy_number' => 'POLI-2024-0001', 'status' => 'active', 'found' => true],
        ]);

        // Conversation 2: Claim filing (broker)
        $claimConv = Conversation::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'user_id' => $brokerAdmin->id,
            'title' => 'Filing a claim for Aisha Mohammed',
            'context_type' => 'claim',
            'context_id' => null,
            'metadata' => ['source' => 'claims_page'],
        ]);

        AiMessage::create([
            'conversation_id' => $claimConv->id,
            'role' => 'user',
            'content' => 'I need to file a claim for Aisha Mohammed - she had a car accident.',
            'metadata' => ['sent_at' => now()->subHours(2)],
        ]);
        AiMessage::create([
            'conversation_id' => $claimConv->id,
            'role' => 'assistant',
            'content' => "I can help you file a claim for Aisha Mohammed. Let me first search for her policy information.\n\nI found her policy. Here's what I need to proceed:\n\n1. **Date and time of incident**\n2. **Location of accident**\n3. **Description of damages**\n4. **Third party involvement**\n5. **Police report number** (if available)\n\nWould you like me to start the claim filing process?",
            'metadata' => ['tool_used' => 'search_customer', 'processing_time_ms' => 900],
        ]);

        ToolExecution::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'user_id' => $brokerAdmin->id,
            'conversation_id' => $claimConv->id,
            'tool_name' => 'search_customer',
            'parameters' => ['query' => 'Aisha Mohammed'],
            'status' => 'completed',
            'result' => ['customer_name' => 'Aisha Mohammed', 'policy_active' => true, 'found' => true],
        ]);

        // Conversation 3: Quote generation (underwriter)
        $quoteConv = Conversation::create([
            'tenant_id' => $underwriterAdmin->tenant_id,
            'user_id' => $underwriterAdmin->id,
            'title' => 'Generate fleet insurance quote',
            'context_type' => 'quote',
            'context_id' => null,
            'metadata' => ['source' => 'quotes_page'],
        ]);

        AiMessage::create([
            'conversation_id' => $quoteConv->id,
            'role' => 'user',
            'content' => 'Generate a fleet insurance quote for Lagos Transport Co. - 10 commercial vehicles.',
            'metadata' => ['sent_at' => now()->subDay()],
        ]);
        AiMessage::create([
            'conversation_id' => $quoteConv->id,
            'role' => 'assistant',
            'content' => "I'll help you generate a fleet insurance quote for Lagos Transport Co.\n\nBased on the information available:\n\n- **Customer**: Lagos Transport Co.\n- **Vehicles**: 10 commercial buses\n- **Estimated Value**: ₦25,000,000\n- **Suggested Premium**: ₦450,000\n- **Commission**: ₦45,000\n\nHere's a draft quote I've prepared. Would you like me to:\n1. Adjust coverage details\n2. Set a validity period\n3. Send it to the customer\n\nOr would you like to review and approve it first?",
            'metadata' => ['tool_used' => 'generate_quote', 'processing_time_ms' => 2500],
            'tool_calls' => [['name' => 'generate_quote', 'arguments' => ['customer' => 'Lagos Transport Co.', 'type' => 'fleet', 'vehicles' => 10]]],
        ]);

        ToolExecution::create([
            'tenant_id' => $underwriterAdmin->tenant_id,
            'user_id' => $underwriterAdmin->id,
            'conversation_id' => $quoteConv->id,
            'tool_name' => 'generate_quote',
            'parameters' => ['customer' => 'Lagos Transport Co.', 'type' => 'fleet', 'vehicles' => 10],
            'status' => 'completed',
            'result' => ['quote_number' => 'QT2025-0004', 'premium' => 450000, 'status' => 'draft'],
        ]);

        // Conversation 4: Follow-up with pending tool approval
        $pendingConv = Conversation::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'user_id' => $brokerAdmin->id,
            'title' => 'Premium adjustment for TechHub Nigeria',
            'context_type' => 'general',
            'context_id' => null,
            'metadata' => ['source' => 'dashboard'],
        ]);

        AiMessage::create([
            'conversation_id' => $pendingConv->id,
            'role' => 'user',
            'content' => 'Adjust the premium on TechHub Nigeria Ltd policy - they requested a discount.',
            'metadata' => ['sent_at' => now()->subMinutes(15)],
        ]);
        AiMessage::create([
            'conversation_id' => $pendingConv->id,
            'role' => 'assistant',
            'content' => "I've prepared a premium adjustment for TechHub Nigeria Ltd. The current premium is ₦180,000. A 10% discount would bring it to ₦162,000.\n\nThis action requires your approval before I can proceed. Please review and approve the change above.",
            'metadata' => ['tool_used' => 'generate_quote', 'processing_time_ms' => 1800],
            'tool_calls' => [['name' => 'generate_quote', 'arguments' => ['customer' => 'TechHub Nigeria Ltd', 'action' => 'adjust_premium', 'discount_percent' => 10]]],
        ]);

        ToolExecution::create([
            'tenant_id' => $brokerAdmin->tenant_id,
            'user_id' => $brokerAdmin->id,
            'conversation_id' => $pendingConv->id,
            'tool_name' => 'generate_quote',
            'parameters' => ['customer' => 'TechHub Nigeria Ltd', 'action' => 'adjust_premium', 'discount_percent' => 10],
            'status' => 'pending',
            'result' => null,
        ]);

        $this->command->info('✅ AI assistant data seeded successfully!');
        $this->command->line('  • '.Conversation::count().' conversations created');
        $this->command->line('  • '.AiMessage::count().' messages created');
        $this->command->line('  • '.ToolExecution::count().' tool executions created');
    }
}
