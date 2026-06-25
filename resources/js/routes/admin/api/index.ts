import policyTypes from './policy-types'
import policyCategories from './policy-categories'
import policies from './policies'
import policyClasses from './policy-classes'
const api = {
    policyTypes: Object.assign(policyTypes, policyTypes),
policyCategories: Object.assign(policyCategories, policyCategories),
policies: Object.assign(policies, policies),
policyClasses: Object.assign(policyClasses, policyClasses),
}

export default api