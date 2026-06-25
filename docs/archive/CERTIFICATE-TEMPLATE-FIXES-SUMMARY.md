# Certificate Template Element Fixes - Summary

## Overview

This document summarizes all the fixes applied to resolve undefined errors and improve database field support in certificate template elements across the React/TypeScript codebase.

## Issues Fixed

### 1. Undefined Property Access Errors

**Problem**: Elements were accessing properties without safe optional chaining, causing runtime errors when properties were missing.

**Files Fixed**:

- `resources/js/components/Designer/KonvaDesigner.tsx`
- `resources/js/components/Designer/PropertyPanel.tsx`
- `resources/js/components/certificates/CertificatePreview.tsx`

**Changes**:

- Added safe optional chaining (`?.`) and fallback values (`?? ''`) for all element properties
- Ensured text elements handle missing `text`, `fontSize`, `fontFamily`, `align` properties gracefully
- Added default values for database field properties

### 2. Database Field Element Support

**Problem**: `database_field` elements were not properly supported in certificate generation and lacked consistent structure.

**Files Fixed**:

- `resources/js/types/designer/index.ts` - Added `text` property to `DatabaseFieldElement` interface
- `resources/js/components/Designer/KonvaDesigner.tsx` - Added safe rendering for database fields
- `resources/js/components/certificates/CertificatePreview.tsx` - Added database field processing
- `resources/js/components/Designer/PropertyPanel.tsx` - Added safe property access for database fields
- `resources/js/components/Designer/InsertDrawer.tsx` - Updated field creation with complete structure
- `resources/js/components/Designer/ElementsLibrary.tsx` - Updated field creation with complete structure
- `resources/js/pages/DocumentTemplates/Designer.tsx` - Updated field creation with complete structure

### 3. Data Mapping and Placeholder Replacement

**Problem**: Certificate generation lacked proper data mapping and placeholder replacement for database fields.

**New Files Created**:

- `resources/js/lib/certificateUtils.ts` - Comprehensive utility functions for certificate data processing
- `resources/js/lib/__tests__/certificateUtils.test.ts` - Test suite for utility functions

**Features Added**:

- `mapPolicyDataForCertificate()` - Maps policy data to standardized format
- `replacePlaceholders()` - Replaces placeholders with actual data
- `processTemplateElements()` - Processes all template elements for certificate generation
- `validatePolicyData()` - Validates required fields are present
- `getAvailableFields()` - Returns list of available fields for insert drawer

## Detailed Changes

### KonvaDesigner.tsx

```typescript
// Before
text={element.text}
fontSize={element.fontSize}
fontFamily={element.fontFamily}

// After
text={element.text || ''}
fontSize={element.fontSize || 16}
fontFamily={element.fontFamily || 'Arial'}
```

### CertificatePreview.tsx

```typescript
// Before
const elements = (designJson?.elements || []).map((el: any) => {
    if (el.type === 'text' && el.content) {
        el = {
            ...el,
            content: el.content.replace(/\{\{(.*?)\}\}/g, (_, key) => policyData[key.trim()] ?? ''),
        };
    }
    return el;
});

// After
const mappedPolicyData = mapPolicyDataForCertificate(policyData, policyData.customer, policyData.tenant);
const elements = processTemplateElements(designJson?.elements || [], mappedPolicyData);
```

### DatabaseFieldElement Type

```typescript
// Before
export interface DatabaseFieldElement extends BaseElement {
    type: 'database_field';
    fieldName: string;
    fieldLabel: string;
    fontSize: number;
    fontFamily: string;
    fontStyle?: string;
    fill: string;
    width: number;
    height?: number;
    align?: 'left' | 'center' | 'right';
}

// After
export interface DatabaseFieldElement extends BaseElement {
    type: 'database_field';
    fieldName: string;
    fieldLabel: string;
    text: string; // Added required text property
    fontSize: number;
    fontFamily: string;
    fontStyle?: string;
    fill: string;
    width: number;
    height?: number;
    align?: 'left' | 'center' | 'right';
}
```

## New Utility Functions

### mapPolicyDataForCertificate()

Maps policy, customer, and tenant data to a standardized format with proper field names and formatting.

### replacePlaceholders()

Replaces `{{field_name}}` placeholders in text with actual data values, supporting both dot notation and underscore notation.

### processTemplateElements()

Processes all template elements (text, database_field, placeholder) and replaces placeholders with actual data.

### validatePolicyData()

Validates that all required fields are present in the policy data.

### getAvailableFields()

Returns a comprehensive list of available fields for the insert drawer, organized by category.

## Testing

Created comprehensive test suite covering:

- Data mapping for individual and corporate customers
- Placeholder replacement with various field formats
- Template element processing
- Data validation
- Field availability

## Benefits

1. **No More Undefined Errors**: All element properties now have safe fallbacks
2. **Consistent Database Field Support**: Database fields work reliably across all components
3. **Robust Data Mapping**: Comprehensive data mapping handles various data formats
4. **Better User Experience**: Templates render without errors even with missing data
5. **Maintainable Code**: Centralized utility functions make future updates easier
6. **Type Safety**: Improved TypeScript types prevent future issues

## Backward Compatibility

All changes maintain backward compatibility:

- Existing templates continue to work
- Old field formats are still supported
- Graceful degradation for missing properties
- No breaking changes to existing APIs

## Usage Examples

### Creating a Database Field

```typescript
const databaseField = {
    type: 'database_field',
    fieldName: 'policy_number',
    fieldLabel: 'Policy Number',
    text: '{{policy_number}}',
    fontSize: 16,
    fontFamily: 'Arial',
    fontStyle: 'normal',
    fill: '#000000',
    width: 200,
    height: 50,
    align: 'left',
};
```

### Processing Template Elements

```typescript
import { processTemplateElements, mapPolicyDataForCertificate } from '@/lib/certificateUtils';

const mappedData = mapPolicyDataForCertificate(policy, customer, tenant);
const processedElements = processTemplateElements(templateElements, mappedData);
```

### Validating Policy Data

```typescript
import { validatePolicyData } from '@/lib/certificateUtils';

const validation = validatePolicyData(policyData, ['policy_number', 'customer_name']);
if (!validation.isValid) {
    console.log('Missing fields:', validation.missingFields);
}
```

## Conclusion

All certificate template element rendering and processing issues have been resolved. The application now:

- Handles missing properties gracefully
- Supports database fields fully in certificate generation
- Provides robust data mapping and placeholder replacement
- Maintains backward compatibility
- Includes comprehensive testing

The fixes ensure that certificate generation works reliably with dynamic database fields and handles edge cases gracefully.
