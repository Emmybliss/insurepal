<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DynamicField extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'customer_id',
        'entity_type',
        'entity_id',
        'field_name',
        'field_label',
        'field_type',
        'field_options',
        'field_value',
        'validation_rules',
        'is_required',
        'display_order',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'field_options' => 'array',
            'validation_rules' => 'array',
            'metadata' => 'array',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    // Field type constants
    const TYPE_TEXT = 'text';

    const TYPE_NUMBER = 'number';

    const TYPE_EMAIL = 'email';

    const TYPE_DATE = 'date';

    const TYPE_DATETIME = 'datetime';

    const TYPE_SELECT = 'select';

    const TYPE_RADIO = 'radio';

    const TYPE_CHECKBOX = 'checkbox';

    const TYPE_TEXTAREA = 'textarea';

    const TYPE_FILE = 'file';

    const TYPE_URL = 'url';

    const TYPE_PHONE = 'phone';

    const TYPE_CURRENCY = 'currency';

    // Entity type constants
    const ENTITY_POLICY = 'policy';

    const ENTITY_CUSTOMER = 'customer';

    const ENTITY_QUOTE = 'quote';

    const ENTITY_CLAIM = 'claim';

    /**
     * Relationship to tenant (owns this dynamic field)
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relationship to policy (when field is specific to a policy)
     */
    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    /**
     * Relationship to customer (when field is specific to a customer)
     * Note: This is different from tenant - customer is an end user, tenant is the broker/underwriter
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Polymorphic relationship to any entity (policy, customer, quote, etc.)
     */
    public function entity(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEntity($query, string $entityType, int $entityId)
    {
        return $query->where('entity_type', $entityType)
            ->where('entity_id', $entityId);
    }

    public function scopeForPolicy($query, int $policyId)
    {
        return $query->where('policy_id', $policyId)
            ->orWhere(function ($q) use ($policyId) {
                $q->where('entity_type', self::ENTITY_POLICY)
                    ->where('entity_id', $policyId);
            });
    }

    public function scopeForCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId)
            ->orWhere(function ($q) use ($customerId) {
                $q->where('entity_type', self::ENTITY_CUSTOMER)
                    ->where('entity_id', $customerId);
            });
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('field_label');
    }

    public function scopeByType($query, string $fieldType)
    {
        return $query->where('field_type', $fieldType);
    }

    /**
     * Helper methods
     */
    public function isSelectType(): bool
    {
        return in_array($this->field_type, [self::TYPE_SELECT, self::TYPE_RADIO, self::TYPE_CHECKBOX]);
    }

    public function getFormattedValue(): mixed
    {
        return match ($this->field_type) {
            self::TYPE_DATE => $this->field_value ? date('Y-m-d', strtotime($this->field_value)) : null,
            self::TYPE_DATETIME => $this->field_value ? date('Y-m-d H:i:s', strtotime($this->field_value)) : null,
            self::TYPE_NUMBER, self::TYPE_CURRENCY => $this->field_value ? (float) $this->field_value : null,
            self::TYPE_CHECKBOX => (bool) $this->field_value,
            default => $this->field_value,
        };
    }

    public function validateValue($value): bool
    {
        if ($this->is_required && empty($value)) {
            return false;
        }

        if (! empty($this->validation_rules)) {
            // Custom validation logic can be implemented here
            // Using Laravel's Validator
            $validator = \Validator::make(
                ['value' => $value],
                ['value' => $this->validation_rules]
            );

            return $validator->passes();
        }

        return true;
    }

    /**
     * Get available field types
     */
    public static function getAvailableFieldTypes(): array
    {
        return [
            self::TYPE_TEXT => 'Text',
            self::TYPE_NUMBER => 'Number',
            self::TYPE_EMAIL => 'Email',
            self::TYPE_DATE => 'Date',
            self::TYPE_DATETIME => 'Date & Time',
            self::TYPE_SELECT => 'Dropdown',
            self::TYPE_RADIO => 'Radio Buttons',
            self::TYPE_CHECKBOX => 'Checkbox',
            self::TYPE_TEXTAREA => 'Text Area',
            self::TYPE_FILE => 'File Upload',
            self::TYPE_URL => 'URL',
            self::TYPE_PHONE => 'Phone Number',
            self::TYPE_CURRENCY => 'Currency',
        ];
    }

    /**
     * Get available entity types
     */
    public static function getAvailableEntityTypes(): array
    {
        return [
            self::ENTITY_POLICY => 'Policy',
            self::ENTITY_CUSTOMER => 'Customer',
            self::ENTITY_QUOTE => 'Quote',
            self::ENTITY_CLAIM => 'Claim',
        ];
    }
}
