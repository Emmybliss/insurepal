import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyCategoryController::categories
 * @see app/Http/Controllers/PolicyCategoryController.php:112
 * @route '/admin/api/policy-types/{policy_type}/categories'
 */
export const categories = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: categories.url(args, options),
    method: 'get',
})

categories.definition = {
    methods: ["get","head"],
    url: '/admin/api/policy-types/{policy_type}/categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::categories
 * @see app/Http/Controllers/PolicyCategoryController.php:112
 * @route '/admin/api/policy-types/{policy_type}/categories'
 */
categories.url = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_type: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_type: args.policy_type,
                }

    return categories.definition.url
            .replace('{policy_type}', parsedArgs.policy_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::categories
 * @see app/Http/Controllers/PolicyCategoryController.php:112
 * @route '/admin/api/policy-types/{policy_type}/categories'
 */
categories.get = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: categories.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyCategoryController::categories
 * @see app/Http/Controllers/PolicyCategoryController.php:112
 * @route '/admin/api/policy-types/{policy_type}/categories'
 */
categories.head = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: categories.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::categories
 * @see app/Http/Controllers/PolicyCategoryController.php:112
 * @route '/admin/api/policy-types/{policy_type}/categories'
 */
    const categoriesForm = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: categories.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::categories
 * @see app/Http/Controllers/PolicyCategoryController.php:112
 * @route '/admin/api/policy-types/{policy_type}/categories'
 */
        categoriesForm.get = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: categories.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyCategoryController::categories
 * @see app/Http/Controllers/PolicyCategoryController.php:112
 * @route '/admin/api/policy-types/{policy_type}/categories'
 */
        categoriesForm.head = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: categories.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    categories.form = categoriesForm
const policyTypes = {
    categories: Object.assign(categories, categories),
}

export default policyTypes