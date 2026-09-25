<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EmailThread extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'account_id',
        'subject',
        'subject_normalized',
        'first_message_at',
        'last_message_at',
        'participant_addresses',
        'status',
        'is_unread',
        'related_type',
        'related_id',
        'customer_id',
        'policy_id',
        'claim_id',
        'quote_id',
        'invoice_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'first_message_at' => 'datetime',
            'last_message_at' => 'datetime',
            'participant_addresses' => 'array',
            'is_unread' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(EmailAccount::class, 'account_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(EmailMessage::class, 'email_thread_id')->orderBy('received_at', 'asc');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(EmailMessage::class, 'email_thread_id')->latestOfMany('received_at');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class, 'policy_id');
    }

    public function claim(): BelongsTo
    {
        return $this->belongsTo(Claim::class, 'claim_id');
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class, 'quote_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function scopeTrash($query)
    {
        return $query->where('status', 'trash');
    }

    public function scopeUnread($query)
    {
        return $query->where('is_unread', true);
    }
}
