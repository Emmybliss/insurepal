import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyTypeController::index
 * @see app/Http/Controllers/PolicyTypeController.php:14
 * @route '/admin/policy-types'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/policy-types',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::index
 * @see app/Http/Controllers/PolicyTypeController.php:14
 * @route '/admin/policy-types'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::index
 * @see app/Http/Controllers/PolicyTypeController.php:14
 * @route '/admin/policy-types'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyTypeController::index
 * @see app/Http/Controllers/PolicyTypeController.php:14
 * @route '/admin/policy-types'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::index
 * @see app/Http/Controllers/PolicyTypeController.php:14
 * @route '/admin/policy-types'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::index
 * @see app/Http/Controllers/PolicyTypeController.php:14
 * @route '/admin/policy-types'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyTypeController::index
 * @see app/Http/Controllers/PolicyTypeController.php:14
 * @route '/admin/policy-types'
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
* @see \App\Http\Controllers\PolicyTypeController::create
 * @see app/Http/Controllers/PolicyTypeController.php:35
 * @route '/admin/policy-types/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/policy-types/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::create
 * @see app/Http/Controllers/PolicyTypeController.php:35
 * @route '/admin/policy-types/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::create
 * @see app/Http/Controllers/PolicyTypeController.php:35
 * @route '/admin/policy-types/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyTypeController::create
 * @see app/Http/Controllers/PolicyTypeController.php:35
 * @route '/admin/policy-types/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::create
 * @see app/Http/Controllers/PolicyTypeController.php:35
 * @route '/admin/policy-types/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::create
 * @see app/Http/Controllers/PolicyTypeController.php:35
 * @route '/admin/policy-types/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyTypeController::create
 * @see app/Http/Controllers/PolicyTypeController.php:35
 * @route '/admin/policy-types/create'
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
* @see \App\Http\Controllers\PolicyTypeController::store
 * @see app/Http/Controllers/PolicyTypeController.php:40
 * @route '/admin/policy-types'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/policy-types',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::store
 * @see app/Http/Controllers/PolicyTypeController.php:40
 * @route '/admin/policy-types'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::store
 * @see app/Http/Controllers/PolicyTypeController.php:40
 * @route '/admin/policy-types'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::store
 * @see app/Http/Controllers/PolicyTypeController.php:40
 * @route '/admin/policy-types'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::store
 * @see app/Http/Controllers/PolicyTypeController.php:40
 * @route '/admin/policy-types'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PolicyTypeController::show
 * @see app/Http/Controllers/PolicyTypeController.php:48
 * @route '/admin/policy-types/{policy_type}'
 */
export const show = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/policy-types/{policy_type}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::show
 * @see app/Http/Controllers/PolicyTypeController.php:48
 * @route '/admin/policy-types/{policy_type}'
 */
show.url = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{policy_type}', parsedArgs.policy_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::show
 * @see app/Http/Controllers/PolicyTypeController.php:48
 * @route '/admin/policy-types/{policy_type}'
 */
show.get = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyTypeController::show
 * @see app/Http/Controllers/PolicyTypeController.php:48
 * @route '/admin/policy-types/{policy_type}'
 */
show.head = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::show
 * @see app/Http/Controllers/PolicyTypeController.php:48
 * @route '/admin/policy-types/{policy_type}'
 */
    const showForm = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::show
 * @see app/Http/Controllers/PolicyTypeController.php:48
 * @route '/admin/policy-types/{policy_type}'
 */
        showForm.get = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyTypeController::show
 * @see app/Http/Controllers/PolicyTypeController.php:48
 * @route '/admin/policy-types/{policy_type}'
 */
        showForm.head = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PolicyTypeController::edit
 * @see app/Http/Controllers/PolicyTypeController.php:57
 * @route '/admin/policy-types/{policy_type}/edit'
 */
export const edit = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/policy-types/{policy_type}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::edit
 * @see app/Http/Controllers/PolicyTypeController.php:57
 * @route '/admin/policy-types/{policy_type}/edit'
 */
edit.url = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return edit.definition.url
            .replace('{policy_type}', parsedArgs.policy_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::edit
 * @see app/Http/Controllers/PolicyTypeController.php:57
 * @route '/admin/policy-types/{policy_type}/edit'
 */
edit.get = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyTypeController::edit
 * @see app/Http/Controllers/PolicyTypeController.php:57
 * @route '/admin/policy-types/{policy_type}/edit'
 */
edit.head = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::edit
 * @see app/Http/Controllers/PolicyTypeController.php:57
 * @route '/admin/policy-types/{policy_type}/edit'
 */
    const editForm = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::edit
 * @see app/Http/Controllers/PolicyTypeController.php:57
 * @route '/admin/policy-types/{policy_type}/edit'
 */
        editForm.get = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyTypeController::edit
 * @see app/Http/Controllers/PolicyTypeController.php:57
 * @route '/admin/policy-types/{policy_type}/edit'
 */
        editForm.head = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PolicyTypeController::update
 * @see app/Http/Controllers/PolicyTypeController.php:64
 * @route '/admin/policy-types/{policy_type}'
 */
export const update = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/policy-types/{policy_type}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::update
 * @see app/Http/Controllers/PolicyTypeController.php:64
 * @route '/admin/policy-types/{policy_type}'
 */
update.url = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{policy_type}', parsedArgs.policy_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::update
 * @see app/Http/Controllers/PolicyTypeController.php:64
 * @route '/admin/policy-types/{policy_type}'
 */
update.put = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\PolicyTypeController::update
 * @see app/Http/Controllers/PolicyTypeController.php:64
 * @route '/admin/policy-types/{policy_type}'
 */
update.patch = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::update
 * @see app/Http/Controllers/PolicyTypeController.php:64
 * @route '/admin/policy-types/{policy_type}'
 */
    const updateForm = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::update
 * @see app/Http/Controllers/PolicyTypeController.php:64
 * @route '/admin/policy-types/{policy_type}'
 */
        updateForm.put = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\PolicyTypeController::update
 * @see app/Http/Controllers/PolicyTypeController.php:64
 * @route '/admin/policy-types/{policy_type}'
 */
        updateForm.patch = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\PolicyTypeController::destroy
 * @see app/Http/Controllers/PolicyTypeController.php:72
 * @route '/admin/policy-types/{policy_type}'
 */
export const destroy = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/policy-types/{policy_type}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::destroy
 * @see app/Http/Controllers/PolicyTypeController.php:72
 * @route '/admin/policy-types/{policy_type}'
 */
destroy.url = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{policy_type}', parsedArgs.policy_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::destroy
 * @see app/Http/Controllers/PolicyTypeController.php:72
 * @route '/admin/policy-types/{policy_type}'
 */
destroy.delete = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::destroy
 * @see app/Http/Controllers/PolicyTypeController.php:72
 * @route '/admin/policy-types/{policy_type}'
 */
    const destroyForm = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::destroy
 * @see app/Http/Controllers/PolicyTypeController.php:72
 * @route '/admin/policy-types/{policy_type}'
 */
        destroyForm.delete = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\PolicyTypeController::toggleStatus
 * @see app/Http/Controllers/PolicyTypeController.php:85
 * @route '/admin/policy-types/{policy_type}/toggle-status'
 */
export const toggleStatus = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleStatus.url(args, options),
    method: 'post',
})

toggleStatus.definition = {
    methods: ["post"],
    url: '/admin/policy-types/{policy_type}/toggle-status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyTypeController::toggleStatus
 * @see app/Http/Controllers/PolicyTypeController.php:85
 * @route '/admin/policy-types/{policy_type}/toggle-status'
 */
toggleStatus.url = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return toggleStatus.definition.url
            .replace('{policy_type}', parsedArgs.policy_type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyTypeController::toggleStatus
 * @see app/Http/Controllers/PolicyTypeController.php:85
 * @route '/admin/policy-types/{policy_type}/toggle-status'
 */
toggleStatus.post = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleStatus.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyTypeController::toggleStatus
 * @see app/Http/Controllers/PolicyTypeController.php:85
 * @route '/admin/policy-types/{policy_type}/toggle-status'
 */
    const toggleStatusForm = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyTypeController::toggleStatus
 * @see app/Http/Controllers/PolicyTypeController.php:85
 * @route '/admin/policy-types/{policy_type}/toggle-status'
 */
        toggleStatusForm.post = (args: { policy_type: string | number } | [policy_type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleStatus.url(args, options),
            method: 'post',
        })
    
    toggleStatus.form = toggleStatusForm
const policyTypes = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
}

export default policyTypes