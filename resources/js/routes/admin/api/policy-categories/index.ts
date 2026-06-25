import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyClassController::classes
 * @see app/Http/Controllers/PolicyClassController.php:123
 * @route '/admin/api/policy-categories/{policy_category}/classes'
 */
export const classes = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: classes.url(args, options),
    method: 'get',
})

classes.definition = {
    methods: ["get","head"],
    url: '/admin/api/policy-categories/{policy_category}/classes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyClassController::classes
 * @see app/Http/Controllers/PolicyClassController.php:123
 * @route '/admin/api/policy-categories/{policy_category}/classes'
 */
classes.url = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_category: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_category: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_category: args.policy_category,
                }

    return classes.definition.url
            .replace('{policy_category}', parsedArgs.policy_category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::classes
 * @see app/Http/Controllers/PolicyClassController.php:123
 * @route '/admin/api/policy-categories/{policy_category}/classes'
 */
classes.get = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: classes.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyClassController::classes
 * @see app/Http/Controllers/PolicyClassController.php:123
 * @route '/admin/api/policy-categories/{policy_category}/classes'
 */
classes.head = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: classes.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::classes
 * @see app/Http/Controllers/PolicyClassController.php:123
 * @route '/admin/api/policy-categories/{policy_category}/classes'
 */
    const classesForm = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: classes.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::classes
 * @see app/Http/Controllers/PolicyClassController.php:123
 * @route '/admin/api/policy-categories/{policy_category}/classes'
 */
        classesForm.get = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: classes.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyClassController::classes
 * @see app/Http/Controllers/PolicyClassController.php:123
 * @route '/admin/api/policy-categories/{policy_category}/classes'
 */
        classesForm.head = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: classes.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    classes.form = classesForm
const policyCategories = {
    classes: Object.assign(classes, classes),
}

export default policyCategories