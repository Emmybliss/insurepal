import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyController::policies
 * @see app/Http/Controllers/PolicyController.php:169
 * @route '/admin/api/policy-classes/{policy_class}/policies'
 */
export const policies = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: policies.url(args, options),
    method: 'get',
})

policies.definition = {
    methods: ["get","head"],
    url: '/admin/api/policy-classes/{policy_class}/policies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyController::policies
 * @see app/Http/Controllers/PolicyController.php:169
 * @route '/admin/api/policy-classes/{policy_class}/policies'
 */
policies.url = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_class: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_class: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_class: args.policy_class,
                }

    return policies.definition.url
            .replace('{policy_class}', parsedArgs.policy_class.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::policies
 * @see app/Http/Controllers/PolicyController.php:169
 * @route '/admin/api/policy-classes/{policy_class}/policies'
 */
policies.get = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: policies.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyController::policies
 * @see app/Http/Controllers/PolicyController.php:169
 * @route '/admin/api/policy-classes/{policy_class}/policies'
 */
policies.head = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: policies.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyController::policies
 * @see app/Http/Controllers/PolicyController.php:169
 * @route '/admin/api/policy-classes/{policy_class}/policies'
 */
    const policiesForm = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: policies.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyController::policies
 * @see app/Http/Controllers/PolicyController.php:169
 * @route '/admin/api/policy-classes/{policy_class}/policies'
 */
        policiesForm.get = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: policies.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyController::policies
 * @see app/Http/Controllers/PolicyController.php:169
 * @route '/admin/api/policy-classes/{policy_class}/policies'
 */
        policiesForm.head = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: policies.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    policies.form = policiesForm
const policyClasses = {
    policies: Object.assign(policies, policies),
}

export default policyClasses