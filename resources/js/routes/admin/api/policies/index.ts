import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyController::calculatePremium
 * @see app/Http/Controllers/PolicyController.php:152
 * @route '/admin/api/policies/calculate-premium'
 */
export const calculatePremium = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calculatePremium.url(options),
    method: 'post',
})

calculatePremium.definition = {
    methods: ["post"],
    url: '/admin/api/policies/calculate-premium',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyController::calculatePremium
 * @see app/Http/Controllers/PolicyController.php:152
 * @route '/admin/api/policies/calculate-premium'
 */
calculatePremium.url = (options?: RouteQueryOptions) => {
    return calculatePremium.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::calculatePremium
 * @see app/Http/Controllers/PolicyController.php:152
 * @route '/admin/api/policies/calculate-premium'
 */
calculatePremium.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: calculatePremium.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyController::calculatePremium
 * @see app/Http/Controllers/PolicyController.php:152
 * @route '/admin/api/policies/calculate-premium'
 */
    const calculatePremiumForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: calculatePremium.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyController::calculatePremium
 * @see app/Http/Controllers/PolicyController.php:152
 * @route '/admin/api/policies/calculate-premium'
 */
        calculatePremiumForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: calculatePremium.url(options),
            method: 'post',
        })
    
    calculatePremium.form = calculatePremiumForm
const policies = {
    calculatePremium: Object.assign(calculatePremium, calculatePremium),
}

export default policies