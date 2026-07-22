import policies from './policies';
import policyCategories from './policy-categories';
import policyClasses from './policy-classes';
import policyTypes from './policy-types';
const api = {
    policyTypes: Object.assign(policyTypes, policyTypes),
    policyCategories: Object.assign(policyCategories, policyCategories),
    policies: Object.assign(policies, policies),
    policyClasses: Object.assign(policyClasses, policyClasses),
};

export default api;
