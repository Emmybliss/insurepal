import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\FinancialNoteController::policies
 * @see app/Http/Controllers/FinancialNoteController.php:204
 * @route '/api/customers/{customer}/policies'
 */
export const policies = (args: { customer: string | number } | [customer: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: policies.url(args, options),
    method: 'get',
})

policies.definition = {
    methods: ["get","head"],
    url: '/api/customers/{customer}/policies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::policies
 * @see app/Http/Controllers/FinancialNoteController.php:204
 * @route '/api/customers/{customer}/policies'
 */
policies.url = (args: { customer: string | number } | [customer: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { customer: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    customer: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        customer: args.customer,
                }

    return policies.definition.url
            .replace('{customer}', parsedArgs.customer.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::policies
 * @see app/Http/Controllers/FinancialNoteController.php:204
 * @route '/api/customers/{customer}/policies'
 */
policies.get = (args: { customer: string | number } | [customer: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: policies.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialNoteController::policies
 * @see app/Http/Controllers/FinancialNoteController.php:204
 * @route '/api/customers/{customer}/policies'
 */
policies.head = (args: { customer: string | number } | [customer: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: policies.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::policies
 * @see app/Http/Controllers/FinancialNoteController.php:204
 * @route '/api/customers/{customer}/policies'
 */
    const policiesForm = (args: { customer: string | number } | [customer: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: policies.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::policies
 * @see app/Http/Controllers/FinancialNoteController.php:204
 * @route '/api/customers/{customer}/policies'
 */
        policiesForm.get = (args: { customer: string | number } | [customer: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: policies.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialNoteController::policies
 * @see app/Http/Controllers/FinancialNoteController.php:204
 * @route '/api/customers/{customer}/policies'
 */
        policiesForm.head = (args: { customer: string | number } | [customer: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: policies.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    policies.form = policiesForm
const customers = {
    policies: Object.assign(policies, policies),
}

export default customers