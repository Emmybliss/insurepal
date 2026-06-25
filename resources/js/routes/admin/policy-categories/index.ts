import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyCategoryController::index
 * @see app/Http/Controllers/PolicyCategoryController.php:15
 * @route '/admin/policy-categories'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/policy-categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::index
 * @see app/Http/Controllers/PolicyCategoryController.php:15
 * @route '/admin/policy-categories'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::index
 * @see app/Http/Controllers/PolicyCategoryController.php:15
 * @route '/admin/policy-categories'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyCategoryController::index
 * @see app/Http/Controllers/PolicyCategoryController.php:15
 * @route '/admin/policy-categories'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::index
 * @see app/Http/Controllers/PolicyCategoryController.php:15
 * @route '/admin/policy-categories'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::index
 * @see app/Http/Controllers/PolicyCategoryController.php:15
 * @route '/admin/policy-categories'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyCategoryController::index
 * @see app/Http/Controllers/PolicyCategoryController.php:15
 * @route '/admin/policy-categories'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\PolicyCategoryController::create
 * @see app/Http/Controllers/PolicyCategoryController.php:44
 * @route '/admin/policy-categories/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/policy-categories/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::create
 * @see app/Http/Controllers/PolicyCategoryController.php:44
 * @route '/admin/policy-categories/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::create
 * @see app/Http/Controllers/PolicyCategoryController.php:44
 * @route '/admin/policy-categories/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyCategoryController::create
 * @see app/Http/Controllers/PolicyCategoryController.php:44
 * @route '/admin/policy-categories/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::create
 * @see app/Http/Controllers/PolicyCategoryController.php:44
 * @route '/admin/policy-categories/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::create
 * @see app/Http/Controllers/PolicyCategoryController.php:44
 * @route '/admin/policy-categories/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyCategoryController::create
 * @see app/Http/Controllers/PolicyCategoryController.php:44
 * @route '/admin/policy-categories/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\PolicyCategoryController::store
 * @see app/Http/Controllers/PolicyCategoryController.php:53
 * @route '/admin/policy-categories'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/policy-categories',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::store
 * @see app/Http/Controllers/PolicyCategoryController.php:53
 * @route '/admin/policy-categories'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::store
 * @see app/Http/Controllers/PolicyCategoryController.php:53
 * @route '/admin/policy-categories'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::store
 * @see app/Http/Controllers/PolicyCategoryController.php:53
 * @route '/admin/policy-categories'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::store
 * @see app/Http/Controllers/PolicyCategoryController.php:53
 * @route '/admin/policy-categories'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PolicyCategoryController::show
 * @see app/Http/Controllers/PolicyCategoryController.php:61
 * @route '/admin/policy-categories/{policy_category}'
 */
export const show = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/policy-categories/{policy_category}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::show
 * @see app/Http/Controllers/PolicyCategoryController.php:61
 * @route '/admin/policy-categories/{policy_category}'
 */
show.url = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{policy_category}', parsedArgs.policy_category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::show
 * @see app/Http/Controllers/PolicyCategoryController.php:61
 * @route '/admin/policy-categories/{policy_category}'
 */
show.get = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyCategoryController::show
 * @see app/Http/Controllers/PolicyCategoryController.php:61
 * @route '/admin/policy-categories/{policy_category}'
 */
show.head = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::show
 * @see app/Http/Controllers/PolicyCategoryController.php:61
 * @route '/admin/policy-categories/{policy_category}'
 */
    const showForm = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::show
 * @see app/Http/Controllers/PolicyCategoryController.php:61
 * @route '/admin/policy-categories/{policy_category}'
 */
        showForm.get = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyCategoryController::show
 * @see app/Http/Controllers/PolicyCategoryController.php:61
 * @route '/admin/policy-categories/{policy_category}'
 */
        showForm.head = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\PolicyCategoryController::edit
 * @see app/Http/Controllers/PolicyCategoryController.php:70
 * @route '/admin/policy-categories/{policy_category}/edit'
 */
export const edit = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/policy-categories/{policy_category}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::edit
 * @see app/Http/Controllers/PolicyCategoryController.php:70
 * @route '/admin/policy-categories/{policy_category}/edit'
 */
edit.url = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return edit.definition.url
            .replace('{policy_category}', parsedArgs.policy_category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::edit
 * @see app/Http/Controllers/PolicyCategoryController.php:70
 * @route '/admin/policy-categories/{policy_category}/edit'
 */
edit.get = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyCategoryController::edit
 * @see app/Http/Controllers/PolicyCategoryController.php:70
 * @route '/admin/policy-categories/{policy_category}/edit'
 */
edit.head = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::edit
 * @see app/Http/Controllers/PolicyCategoryController.php:70
 * @route '/admin/policy-categories/{policy_category}/edit'
 */
    const editForm = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::edit
 * @see app/Http/Controllers/PolicyCategoryController.php:70
 * @route '/admin/policy-categories/{policy_category}/edit'
 */
        editForm.get = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyCategoryController::edit
 * @see app/Http/Controllers/PolicyCategoryController.php:70
 * @route '/admin/policy-categories/{policy_category}/edit'
 */
        editForm.head = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\PolicyCategoryController::update
 * @see app/Http/Controllers/PolicyCategoryController.php:81
 * @route '/admin/policy-categories/{policy_category}'
 */
export const update = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/policy-categories/{policy_category}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::update
 * @see app/Http/Controllers/PolicyCategoryController.php:81
 * @route '/admin/policy-categories/{policy_category}'
 */
update.url = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{policy_category}', parsedArgs.policy_category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::update
 * @see app/Http/Controllers/PolicyCategoryController.php:81
 * @route '/admin/policy-categories/{policy_category}'
 */
update.put = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\PolicyCategoryController::update
 * @see app/Http/Controllers/PolicyCategoryController.php:81
 * @route '/admin/policy-categories/{policy_category}'
 */
update.patch = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::update
 * @see app/Http/Controllers/PolicyCategoryController.php:81
 * @route '/admin/policy-categories/{policy_category}'
 */
    const updateForm = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::update
 * @see app/Http/Controllers/PolicyCategoryController.php:81
 * @route '/admin/policy-categories/{policy_category}'
 */
        updateForm.put = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\PolicyCategoryController::update
 * @see app/Http/Controllers/PolicyCategoryController.php:81
 * @route '/admin/policy-categories/{policy_category}'
 */
        updateForm.patch = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\PolicyCategoryController::destroy
 * @see app/Http/Controllers/PolicyCategoryController.php:89
 * @route '/admin/policy-categories/{policy_category}'
 */
export const destroy = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/policy-categories/{policy_category}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::destroy
 * @see app/Http/Controllers/PolicyCategoryController.php:89
 * @route '/admin/policy-categories/{policy_category}'
 */
destroy.url = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{policy_category}', parsedArgs.policy_category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::destroy
 * @see app/Http/Controllers/PolicyCategoryController.php:89
 * @route '/admin/policy-categories/{policy_category}'
 */
destroy.delete = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::destroy
 * @see app/Http/Controllers/PolicyCategoryController.php:89
 * @route '/admin/policy-categories/{policy_category}'
 */
    const destroyForm = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::destroy
 * @see app/Http/Controllers/PolicyCategoryController.php:89
 * @route '/admin/policy-categories/{policy_category}'
 */
        destroyForm.delete = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\PolicyCategoryController::toggleStatus
 * @see app/Http/Controllers/PolicyCategoryController.php:102
 * @route '/admin/policy-categories/{policy_category}/toggle-status'
 */
export const toggleStatus = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleStatus.url(args, options),
    method: 'post',
})

toggleStatus.definition = {
    methods: ["post"],
    url: '/admin/policy-categories/{policy_category}/toggle-status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyCategoryController::toggleStatus
 * @see app/Http/Controllers/PolicyCategoryController.php:102
 * @route '/admin/policy-categories/{policy_category}/toggle-status'
 */
toggleStatus.url = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return toggleStatus.definition.url
            .replace('{policy_category}', parsedArgs.policy_category.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyCategoryController::toggleStatus
 * @see app/Http/Controllers/PolicyCategoryController.php:102
 * @route '/admin/policy-categories/{policy_category}/toggle-status'
 */
toggleStatus.post = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleStatus.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyCategoryController::toggleStatus
 * @see app/Http/Controllers/PolicyCategoryController.php:102
 * @route '/admin/policy-categories/{policy_category}/toggle-status'
 */
    const toggleStatusForm = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyCategoryController::toggleStatus
 * @see app/Http/Controllers/PolicyCategoryController.php:102
 * @route '/admin/policy-categories/{policy_category}/toggle-status'
 */
        toggleStatusForm.post = (args: { policy_category: string | number } | [policy_category: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleStatus.url(args, options),
            method: 'post',
        })
    
    toggleStatus.form = toggleStatusForm
const policyCategories = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
}

export default policyCategories