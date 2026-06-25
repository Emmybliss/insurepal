import axios from 'axios';

// API helper functions for hierarchical data fetching
export const policyApi = {
    // Get categories by policy type
    getCategoriesByType: async (policyTypeId: number | string) => {
        const response = await axios.get(`/admin/api/policy-types/${policyTypeId}/categories`);
        return response.data;
    },

    // Get classes by policy category
    getClassesByCategory: async (policyCategoryId: number | string) => {
        const response = await axios.get(`/admin/api/policy-categories/${policyCategoryId}/classes`);
        return response.data;
    },

    // Get policies by policy class
    getPoliciesByClass: async (policyClassId: number | string) => {
        const response = await axios.get(`/admin/api/policy-classes/${policyClassId}/policies`);
        return response.data;
    },

    // Calculate premium for a policy
    calculatePremium: async (policyId: number | string, sumAssured: number, factors?: Record<string, any>) => {
        const response = await axios.post('/admin/api/policies/calculate-premium', {
            policy_id: policyId,
            sum_assured: sumAssured,
            factors: factors,
        });
        return response.data;
    },
};

// Error handler for API calls
export const handleApiError = (error: any) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API Error:', error.response.data);
        return error.response.data.message || 'An error occurred';
    } else if (error.request) {
        // The request was made but no response was received
        console.error('Network Error:', error.request);
        return 'Network error. Please check your connection.';
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message);
        return error.message;
    }
};

// Types for API responses
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

export interface PolicyHierarchyItem {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
}

export interface PremiumCalculation {
    premium: number;
    commission: number;
    breakdown?: {
        base_premium: number;
        multipliers: number;
        factors: number;
        total: number;
    };
}
