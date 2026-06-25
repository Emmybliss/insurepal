/**
 * Tests for certificate utilities
 * Verifies that data mapping and placeholder replacement work correctly
 */

import {
    getAvailableFields,
    mapPolicyDataForCertificate,
    processTemplateElements,
    replacePlaceholders,
    validatePolicyData,
    type PolicyData,
} from '../certificateUtils';

describe('Certificate Utils', () => {
    const mockPolicy = {
        policy_number: 'POL-2025-001',
        policy_product: { name: 'Auto Insurance' },
        effective_date: '2025-01-01',
        expiry_date: '2025-12-31',
        premium_amount: 150000,
        total_amount: 5000000,
        status: 'active',
        customer: {
            type: 'individual',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+234 800 123 4567',
            address: '123 Main Street, Lagos',
            date_of_birth: '1990-01-01',
            occupation: 'Software Engineer',
        },
    };

    const mockCorporatePolicy = {
        policy_number: 'POL-2025-002',
        policy_product: { name: 'Business Insurance' },
        effective_date: '2025-01-01',
        expiry_date: '2025-12-31',
        premium_amount: 500000,
        total_amount: 20000000,
        status: 'active',
        customer: {
            type: 'corporate',
            company_name: 'Acme Corp',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@acmecorp.com',
            phone: '+234 800 987 6543',
            address: '456 Business Avenue, Lagos',
            registration_number: 'RC123456',
            industry: 'Technology',
        },
    };

    describe('mapPolicyDataForCertificate', () => {
        it('should map individual customer policy data correctly', () => {
            const result = mapPolicyDataForCertificate(mockPolicy, mockPolicy.customer);

            expect(result.policy_number).toBe('POL-2025-001');
            expect(result.policy_type).toBe('Auto Insurance');
            expect(result.customer_name).toBe('John Doe');
            expect(result.customer_email).toBe('john.doe@example.com');
            expect(result.customer_phone).toBe('+234 800 123 4567');
            expect(result.customer_occupation).toBe('Software Engineer');
            expect(result.policy_premium).toBe('₦150,000.00');
            expect(result.policy_coverage).toBe('₦5,000,000.00');
            expect(result.date_today).toBeDefined();
            expect(result.certificate_id).toMatch(/^CERT-\d{4}-\d{6}$/);
        });

        it('should map corporate customer policy data correctly', () => {
            const result = mapPolicyDataForCertificate(mockCorporatePolicy, mockCorporatePolicy.customer);

            expect(result.policy_number).toBe('POL-2025-002');
            expect(result.policy_type).toBe('Business Insurance');
            expect(result.customer_name).toBe('Acme Corp');
            expect(result.corporate_company_name).toBe('Acme Corp');
            expect(result.corporate_registration_number).toBe('RC123456');
            expect(result.corporate_industry).toBe('Technology');
            expect(result.policy_premium).toBe('₦500,000.00');
            expect(result.policy_coverage).toBe('₦20,000,000.00');
        });

        it('should handle missing data gracefully', () => {
            const emptyPolicy = {};
            const result = mapPolicyDataForCertificate(emptyPolicy, {});

            expect(result.policy_number).toBe('');
            expect(result.customer_name).toBe('');
            expect(result.policy_premium).toBe('');
            expect(result.date_today).toBeDefined();
        });
    });

    describe('replacePlaceholders', () => {
        const testData: PolicyData = {
            policy_number: 'POL-2025-001',
            customer_name: 'John Doe',
            policy_premium: '₦150,000.00',
            'policy.coverage': '₦5,000,000.00',
            'customer.email': 'john.doe@example.com',
        };

        it('should replace simple placeholders', () => {
            const text = 'Policy Number: {{policy_number}}';
            const result = replacePlaceholders(text, testData);
            expect(result).toBe('Policy Number: POL-2025-001');
        });

        it('should replace multiple placeholders', () => {
            const text = 'Policy {{policy_number}} for {{customer_name}} - Premium: {{policy_premium}}';
            const result = replacePlaceholders(text, testData);
            expect(result).toBe('Policy POL-2025-001 for John Doe - Premium: ₦150,000.00');
        });

        it('should handle dot notation placeholders', () => {
            const text = 'Coverage: {{policy.coverage}}';
            const result = replacePlaceholders(text, testData);
            expect(result).toBe('Coverage: ₦5,000,000.00');
        });

        it('should handle missing placeholders', () => {
            const text = 'Missing: {{nonexistent_field}}';
            const result = replacePlaceholders(text, testData);
            expect(result).toBe('Missing: {{nonexistent_field}}');
        });

        it('should handle empty or invalid text', () => {
            expect(replacePlaceholders('', testData)).toBe('');
            expect(replacePlaceholders(null as any, testData)).toBe('');
            expect(replacePlaceholders(undefined as any, testData)).toBe('');
        });
    });

    describe('processTemplateElements', () => {
        const testData: PolicyData = {
            policy_number: 'POL-2025-001',
            customer_name: 'John Doe',
            policy_premium: '₦150,000.00',
        };

        it('should process text elements with content property', () => {
            const elements = [
                {
                    type: 'text',
                    content: 'Policy: {{policy_number}}',
                    text: 'Some text',
                },
            ];

            const result = processTemplateElements(elements, testData);
            expect(result[0].content).toBe('Policy: POL-2025-001');
        });

        it('should process text elements with text property', () => {
            const elements = [
                {
                    type: 'text',
                    text: 'Customer: {{customer_name}}',
                },
            ];

            const result = processTemplateElements(elements, testData);
            expect(result[0].text).toBe('Customer: John Doe');
        });

        it('should process database_field elements', () => {
            const elements = [
                {
                    type: 'database_field',
                    fieldName: 'policy_number',
                    fieldLabel: 'Policy Number',
                    fontSize: 16,
                    fontFamily: 'Arial',
                },
            ];

            const result = processTemplateElements(elements, testData);
            expect(result[0].text).toBe('POL-2025-001');
            expect(result[0].fieldName).toBe('policy_number');
            expect(result[0].fontSize).toBe(16);
            expect(result[0].fontFamily).toBe('Arial');
        });

        it('should process placeholder elements', () => {
            const elements = [
                {
                    type: 'placeholder',
                    text: '{{policy_premium}}',
                },
            ];

            const result = processTemplateElements(elements, testData);
            expect(result[0].text).toBe('₦150,000.00');
        });

        it('should handle missing fieldName in database_field', () => {
            const elements = [
                {
                    type: 'database_field',
                    fieldName: undefined,
                    fieldLabel: 'Policy Number',
                },
            ];

            const result = processTemplateElements(elements, testData);
            expect(result[0].text).toBe('{{field_name}}');
            expect(result[0].fieldName).toBe('field_name');
        });

        it('should handle empty elements array', () => {
            const result = processTemplateElements([], testData);
            expect(result).toEqual([]);
        });

        it('should handle null/undefined elements', () => {
            const result = processTemplateElements([null, undefined] as any, testData);
            expect(result).toEqual([null, undefined]);
        });
    });

    describe('validatePolicyData', () => {
        const testData: PolicyData = {
            policy_number: 'POL-2025-001',
            customer_name: 'John Doe',
            policy_premium: '₦150,000.00',
            policy_coverage: '',
            customer_email: 'john@example.com',
        };

        it('should validate required fields', () => {
            const requiredFields = ['policy_number', 'customer_name', 'policy_premium'];
            const result = validatePolicyData(testData, requiredFields);

            expect(result.isValid).toBe(true);
            expect(result.missingFields).toEqual([]);
        });

        it('should identify missing fields', () => {
            const requiredFields = ['policy_number', 'customer_name', 'policy_coverage', 'nonexistent_field'];
            const result = validatePolicyData(testData, requiredFields);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('policy_coverage');
            expect(result.missingFields).toContain('nonexistent_field');
        });

        it('should handle empty required fields array', () => {
            const result = validatePolicyData(testData, []);
            expect(result.isValid).toBe(true);
            expect(result.missingFields).toEqual([]);
        });
    });

    describe('getAvailableFields', () => {
        it('should return all available fields', () => {
            const fields = getAvailableFields();

            expect(fields.length).toBeGreaterThan(0);
            expect(fields.every((field) => field.field && field.label && field.category)).toBe(true);
        });

        it('should include policy fields', () => {
            const fields = getAvailableFields();
            const policyFields = fields.filter((f) => f.category === 'Policy');

            expect(policyFields.length).toBeGreaterThan(0);
            expect(policyFields.some((f) => f.field === 'policy_number')).toBe(true);
        });

        it('should include customer fields', () => {
            const fields = getAvailableFields();
            const customerFields = fields.filter((f) => f.category === 'Customer');

            expect(customerFields.length).toBeGreaterThan(0);
            expect(customerFields.some((f) => f.field === 'customer_name')).toBe(true);
        });

        it('should include corporate fields', () => {
            const fields = getAvailableFields();
            const corporateFields = fields.filter((f) => f.category === 'Corporate');

            expect(corporateFields.length).toBeGreaterThan(0);
            expect(corporateFields.some((f) => f.field === 'corporate_company_name')).toBe(true);
        });

        it('should include common fields', () => {
            const fields = getAvailableFields();
            const commonFields = fields.filter((f) => f.category === 'Common');

            expect(commonFields.length).toBeGreaterThan(0);
            expect(commonFields.some((f) => f.field === 'date_today')).toBe(true);
        });
    });
});
