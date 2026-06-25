import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::plans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
export const plans = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: plans.url(options),
    method: 'get',
})

plans.definition = {
    methods: ["get","head"],
    url: '/plans',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::plans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
plans.url = (options?: RouteQueryOptions) => {
    return plans.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::plans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
plans.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: plans.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::plans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
plans.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: plans.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::plans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
    const plansForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: plans.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::plans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
        plansForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: plans.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::plans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
        plansForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: plans.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    plans.form = plansForm
const subscription = {
    plans: Object.assign(plans, plans),
}

export default subscription