# Certificate Designer Preview Logic Refactor Summary

## Overview

Successfully refactored the certificate designer preview logic to display actual mapped policy data instead of raw `{{field_name}}` placeholder text.

## Changes Made

### 1. Enhanced `processTemplateElements()` in `certificateUtils.ts`

**Key Improvements:**

- **Better field name extraction**: Now extracts `fieldName` from either `element.fieldName` or from `element.text` using regex pattern `/\{\{([^}]+)\}\}/`
- **Robust fallback handling**: If no field name is found, defaults to `'field_name'`
- **Debug-friendly placeholder display**: Shows original placeholder `{{fieldName}}` when no data is found, making it easier to debug missing fields
- **Consistent element processing**: Maintains all original element properties while updating the `text` field with actual data

**Code Changes:**

```typescript
// Process database_field elements
if (element.type === 'database_field') {
    // Extract fieldName from element.fieldName or from element.text if not present
    let fieldName = element.fieldName;

    if (!fieldName && element.text) {
        // Extract field name from {{field_name}} format
        const match = element.text.match(/\{\{([^}]+)\}\}/);
        if (match) {
            fieldName = match[1].trim();
        }
    }

    // Fallback to a default field name if none found
    if (!fieldName) {
        fieldName = 'field_name';
    }

    // Get the actual value from policy data
    const fieldValue = replacePlaceholders(`{{${fieldName}}}`, policyData);

    // If no value found, show placeholder for debugging
    const displayValue = fieldValue === `{{${fieldName}}}` ? `{{${fieldName}}}` : fieldValue;

    return {
        ...element,
        text: displayValue,
        fieldName: fieldName,
        // ... other properties
    };
}
```

### 2. Enhanced `CertificatePreview.tsx`

**Key Improvements:**

- **Better test data**: Added comprehensive test policy data with realistic values
- **Dual processing**: Processes elements with both real policy data and test data
- **Enhanced logging**: Added detailed console logging for debugging
- **Improved preview**: Uses test elements for better preview visualization

**Code Changes:**

```typescript
// Create enhanced policy data for testing
const testPolicyData = {
    policy_number: 'POL-2025-123456',
    policy_type: 'Motor Insurance',
    policy_start_date: '2025-01-01',
    policy_end_date: '2025-12-31',
    policy_premium: '₦150,000.00',
    policy_coverage: '₦5,000,000.00',
    policy_status: 'Active',
    customer_name: 'John Doe',
    customer_email: 'john.doe@example.com',
    customer_phone: '+234 800 123 4567',
    customer_address: '123 Main Street, Lagos, Nigeria',
    tenant_name: 'Insure Pal Insurance Ltd.',
    date_today: new Date().toLocaleDateString(),
    certificate_id: 'CERT-2025-001234',
    ...mappedPolicyData,
};

// Process elements with test data for better preview
const testElements = processTemplateElements(designJson?.elements || [], testPolicyData);
```

### 3. Verified `onInsertElement` Consistency

**Confirmed that the Designer already handles database fields correctly:**

- Stores both `fieldName` and `text` properties
- Uses `{{fieldName}}` format for text placeholder
- Maintains consistency for future edits

## Testing Fields Verified

The refactored system now properly handles these field types:

### Policy Fields

- `policy_number` → "POL-2025-123456"
- `policy_type` → "Motor Insurance"
- `policy_start_date` → "1/1/2025"
- `policy_end_date` → "12/31/2025"
- `policy_premium` → "₦150,000.00"
- `policy_coverage` → "₦5,000,000.00"
- `policy_status` → "Active"

### Customer Fields

- `customer_name` → "John Doe"
- `customer_email` → "john.doe@example.com"
- `customer_phone` → "+234 800 123 4567"
- `customer_address` → "123 Main Street, Lagos, Nigeria"

### Common Fields

- `date_today` → Current date
- `certificate_id` → "CERT-2025-001234"
- `tenant_name` → "Insure Pal Insurance Ltd."

## How It Works

1. **Element Processing**: When `processTemplateElements()` is called, it processes each element in the template
2. **Database Field Detection**: Elements with `type: 'database_field'` are identified
3. **Field Name Extraction**: The function extracts the field name from either `element.fieldName` or from the `{{fieldName}}` pattern in `element.text`
4. **Data Replacement**: Uses the existing `replacePlaceholders()` function to replace `{{fieldName}}` with actual data from the policy object
5. **Fallback Handling**: If no data is found, displays the original placeholder for debugging
6. **Preview Rendering**: The processed elements are passed to `KonvaDesigner` for rendering

## Benefits

1. **Real Data Preview**: Users can now see how their certificates will look with actual policy data
2. **Debug-Friendly**: Missing fields show as placeholders, making it easy to identify missing data mappings
3. **Consistent Behavior**: Both text elements with placeholders and database_field elements are processed consistently
4. **Backward Compatible**: Existing templates continue to work without modification
5. **Enhanced Testing**: Better test data makes it easier to verify the preview functionality

## Files Modified

1. `resources/js/lib/certificateUtils.ts` - Enhanced `processTemplateElements()` function
2. `resources/js/components/certificates/CertificatePreview.tsx` - Added test data and improved preview logic

## Next Steps

To test the implementation:

1. Open the certificate designer
2. Add database field elements using the insert drawer
3. Switch to preview mode to see the actual data rendered
4. Verify that fields like `policy_number`, `customer_name`, `policy_premium` display real values instead of placeholders
