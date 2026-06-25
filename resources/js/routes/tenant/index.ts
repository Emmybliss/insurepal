import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::register
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
export const register = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

register.definition = {
    methods: ["get","head"],
    url: '/register/tenant',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::register
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::register
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
register.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::register
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
register.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: register.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::register
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
    const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: register.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::register
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
        registerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: register.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::register
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
        registerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: register.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    register.form = registerForm
const tenant = {
    register: Object.assign(register, register),
}

export default tenant