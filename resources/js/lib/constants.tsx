export const NIGERIAN_STATES = [
    'Abia',
    'Abuja (FCT)',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
];

export const DEFAULT_COUNTRY = 'Nigeria';

export const getImageUrl = () => {
    const appUrl = import.meta.env.APP_URL || 'http://insurepal-ai-saas.test';
    return `${appUrl}/storage/`;
};

export const getAppUrl = () => {
    return (window as any).appUrl || 'http://insurepal-ai-saas.test/';
};

export const getSafeExcerpt = (html: string, maxLength = 100) => {
    // Strip tags and decode entities
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';

    // Truncate safely
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
};

export const samplePolicyData = {
    certificate_number: 'CERT-2025-0001',
    policy_number: 'POL-2025-567890',
    customer_name: 'John Doe',
    customer_address: '45 Marine Road, Victoria Island, Lagos',
    customer_phone: '+234 812 345 6789',
    customer_email: 'johndoe@example.com',
    customer_dob: '1990-05-15',
    customer_id_number: 'ID-123456789',
    customer_occupation: 'Software Engineer',
    customer_type: 'Individual',
    customer_state: 'Lagos',
    customer_city: 'Lagos',
    customer_zip: '100001',
    customer_country: 'Nigeria',
    commission_amount: '₦25,000.00',
    product_name: 'Comprehensive Motor Insurance',
    policy_type: 'Motor',
    policy_class: 'Private',
    effective_date: '2025-01-01',
    expiry_date: '2025-12-31',
    premium_amount: '₦150,000.00',
    total_amount: '₦175,000.00',
    coverage_details: {
        coverage_type: 'Comprehensive',
        sum_assured: '₦5,000,000.00',
        deductible: '₦50,000.00',
        additional_benefits: 'Roadside assistance, Medical cover',
    },
    tenant_name: 'Insure Pal Insurance Ltd.',
    tenant_address: '123 Insurance Street, Lagos, Nigeria',
    tenant_phone: '+234 800 123 4567',
    tenant_email: 'info@insurepal.com',
    tenant_license_number: 'LIC-2025-INSUREPAL',
    tenant_type: 'Insurance Company',
    tenant_industry: 'Insurance',
    tenant_contact_person: 'Jane Smith',
    terms_conditions: 'Subject to standard terms and conditions of Insure Pal Insurance Ltd.',
    approved_at: '2025-01-02',
    issued_at: '2025-01-02',
    created_at: '2025-01-01',
    reference_number: 'REF-INS-2025-7890',
    date_today: new Date().toLocaleDateString(),
    date_issue: new Date().toLocaleDateString(),
    certificate_id: 'C-INS-2025-0001',
};
