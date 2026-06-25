import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\MessageController::index
 * @see app/Http/Controllers/MessageController.php:15
 * @route '/messages'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/messages',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::index
 * @see app/Http/Controllers/MessageController.php:15
 * @route '/messages'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::index
 * @see app/Http/Controllers/MessageController.php:15
 * @route '/messages'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MessageController::index
 * @see app/Http/Controllers/MessageController.php:15
 * @route '/messages'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MessageController::index
 * @see app/Http/Controllers/MessageController.php:15
 * @route '/messages'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MessageController::index
 * @see app/Http/Controllers/MessageController.php:15
 * @route '/messages'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MessageController::index
 * @see app/Http/Controllers/MessageController.php:15
 * @route '/messages'
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
* @see \App\Http\Controllers\MessageController::create
 * @see app/Http/Controllers/MessageController.php:91
 * @route '/messages/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/messages/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::create
 * @see app/Http/Controllers/MessageController.php:91
 * @route '/messages/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::create
 * @see app/Http/Controllers/MessageController.php:91
 * @route '/messages/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MessageController::create
 * @see app/Http/Controllers/MessageController.php:91
 * @route '/messages/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MessageController::create
 * @see app/Http/Controllers/MessageController.php:91
 * @route '/messages/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MessageController::create
 * @see app/Http/Controllers/MessageController.php:91
 * @route '/messages/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MessageController::create
 * @see app/Http/Controllers/MessageController.php:91
 * @route '/messages/create'
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
* @see \App\Http\Controllers\MessageController::store
 * @see app/Http/Controllers/MessageController.php:103
 * @route '/messages'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/messages',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MessageController::store
 * @see app/Http/Controllers/MessageController.php:103
 * @route '/messages'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::store
 * @see app/Http/Controllers/MessageController.php:103
 * @route '/messages'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MessageController::store
 * @see app/Http/Controllers/MessageController.php:103
 * @route '/messages'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MessageController::store
 * @see app/Http/Controllers/MessageController.php:103
 * @route '/messages'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\MessageController::show
 * @see app/Http/Controllers/MessageController.php:148
 * @route '/messages/{message}'
 */
export const show = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/messages/{message}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::show
 * @see app/Http/Controllers/MessageController.php:148
 * @route '/messages/{message}'
 */
show.url = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { message: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { message: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    message: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        message: typeof args.message === 'object'
                ? args.message.id
                : args.message,
                }

    return show.definition.url
            .replace('{message}', parsedArgs.message.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::show
 * @see app/Http/Controllers/MessageController.php:148
 * @route '/messages/{message}'
 */
show.get = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MessageController::show
 * @see app/Http/Controllers/MessageController.php:148
 * @route '/messages/{message}'
 */
show.head = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MessageController::show
 * @see app/Http/Controllers/MessageController.php:148
 * @route '/messages/{message}'
 */
    const showForm = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MessageController::show
 * @see app/Http/Controllers/MessageController.php:148
 * @route '/messages/{message}'
 */
        showForm.get = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MessageController::show
 * @see app/Http/Controllers/MessageController.php:148
 * @route '/messages/{message}'
 */
        showForm.head = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\MessageController::edit
 * @see app/Http/Controllers/MessageController.php:171
 * @route '/messages/{message}/edit'
 */
export const edit = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/messages/{message}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::edit
 * @see app/Http/Controllers/MessageController.php:171
 * @route '/messages/{message}/edit'
 */
edit.url = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { message: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { message: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    message: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        message: typeof args.message === 'object'
                ? args.message.id
                : args.message,
                }

    return edit.definition.url
            .replace('{message}', parsedArgs.message.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::edit
 * @see app/Http/Controllers/MessageController.php:171
 * @route '/messages/{message}/edit'
 */
edit.get = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MessageController::edit
 * @see app/Http/Controllers/MessageController.php:171
 * @route '/messages/{message}/edit'
 */
edit.head = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MessageController::edit
 * @see app/Http/Controllers/MessageController.php:171
 * @route '/messages/{message}/edit'
 */
    const editForm = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MessageController::edit
 * @see app/Http/Controllers/MessageController.php:171
 * @route '/messages/{message}/edit'
 */
        editForm.get = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MessageController::edit
 * @see app/Http/Controllers/MessageController.php:171
 * @route '/messages/{message}/edit'
 */
        editForm.head = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\MessageController::update
 * @see app/Http/Controllers/MessageController.php:191
 * @route '/messages/{message}'
 */
export const update = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/messages/{message}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\MessageController::update
 * @see app/Http/Controllers/MessageController.php:191
 * @route '/messages/{message}'
 */
update.url = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { message: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { message: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    message: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        message: typeof args.message === 'object'
                ? args.message.id
                : args.message,
                }

    return update.definition.url
            .replace('{message}', parsedArgs.message.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::update
 * @see app/Http/Controllers/MessageController.php:191
 * @route '/messages/{message}'
 */
update.put = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\MessageController::update
 * @see app/Http/Controllers/MessageController.php:191
 * @route '/messages/{message}'
 */
update.patch = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\MessageController::update
 * @see app/Http/Controllers/MessageController.php:191
 * @route '/messages/{message}'
 */
    const updateForm = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MessageController::update
 * @see app/Http/Controllers/MessageController.php:191
 * @route '/messages/{message}'
 */
        updateForm.put = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\MessageController::update
 * @see app/Http/Controllers/MessageController.php:191
 * @route '/messages/{message}'
 */
        updateForm.patch = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\MessageController::destroy
 * @see app/Http/Controllers/MessageController.php:242
 * @route '/messages/{message}'
 */
export const destroy = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/messages/{message}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\MessageController::destroy
 * @see app/Http/Controllers/MessageController.php:242
 * @route '/messages/{message}'
 */
destroy.url = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { message: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { message: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    message: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        message: typeof args.message === 'object'
                ? args.message.id
                : args.message,
                }

    return destroy.definition.url
            .replace('{message}', parsedArgs.message.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::destroy
 * @see app/Http/Controllers/MessageController.php:242
 * @route '/messages/{message}'
 */
destroy.delete = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\MessageController::destroy
 * @see app/Http/Controllers/MessageController.php:242
 * @route '/messages/{message}'
 */
    const destroyForm = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MessageController::destroy
 * @see app/Http/Controllers/MessageController.php:242
 * @route '/messages/{message}'
 */
        destroyForm.delete = (args: { message: number | { id: number } } | [message: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\MessageController::markAsRead
 * @see app/Http/Controllers/MessageController.php:261
 * @route '/messages/mark-as-read'
 */
export const markAsRead = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(options),
    method: 'post',
})

markAsRead.definition = {
    methods: ["post"],
    url: '/messages/mark-as-read',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MessageController::markAsRead
 * @see app/Http/Controllers/MessageController.php:261
 * @route '/messages/mark-as-read'
 */
markAsRead.url = (options?: RouteQueryOptions) => {
    return markAsRead.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::markAsRead
 * @see app/Http/Controllers/MessageController.php:261
 * @route '/messages/mark-as-read'
 */
markAsRead.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsRead.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MessageController::markAsRead
 * @see app/Http/Controllers/MessageController.php:261
 * @route '/messages/mark-as-read'
 */
    const markAsReadForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markAsRead.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MessageController::markAsRead
 * @see app/Http/Controllers/MessageController.php:261
 * @route '/messages/mark-as-read'
 */
        markAsReadForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markAsRead.url(options),
            method: 'post',
        })
    
    markAsRead.form = markAsReadForm
/**
* @see \App\Http\Controllers\MessageController::markAsUnread
 * @see app/Http/Controllers/MessageController.php:276
 * @route '/messages/mark-as-unread'
 */
export const markAsUnread = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsUnread.url(options),
    method: 'post',
})

markAsUnread.definition = {
    methods: ["post"],
    url: '/messages/mark-as-unread',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MessageController::markAsUnread
 * @see app/Http/Controllers/MessageController.php:276
 * @route '/messages/mark-as-unread'
 */
markAsUnread.url = (options?: RouteQueryOptions) => {
    return markAsUnread.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::markAsUnread
 * @see app/Http/Controllers/MessageController.php:276
 * @route '/messages/mark-as-unread'
 */
markAsUnread.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markAsUnread.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MessageController::markAsUnread
 * @see app/Http/Controllers/MessageController.php:276
 * @route '/messages/mark-as-unread'
 */
    const markAsUnreadForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markAsUnread.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MessageController::markAsUnread
 * @see app/Http/Controllers/MessageController.php:276
 * @route '/messages/mark-as-unread'
 */
        markAsUnreadForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markAsUnread.url(options),
            method: 'post',
        })
    
    markAsUnread.form = markAsUnreadForm
/**
* @see \App\Http\Controllers\MessageController::bulkDelete
 * @see app/Http/Controllers/MessageController.php:290
 * @route '/messages/bulk-delete'
 */
export const bulkDelete = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDelete.url(options),
    method: 'post',
})

bulkDelete.definition = {
    methods: ["post"],
    url: '/messages/bulk-delete',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MessageController::bulkDelete
 * @see app/Http/Controllers/MessageController.php:290
 * @route '/messages/bulk-delete'
 */
bulkDelete.url = (options?: RouteQueryOptions) => {
    return bulkDelete.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::bulkDelete
 * @see app/Http/Controllers/MessageController.php:290
 * @route '/messages/bulk-delete'
 */
bulkDelete.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkDelete.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MessageController::bulkDelete
 * @see app/Http/Controllers/MessageController.php:290
 * @route '/messages/bulk-delete'
 */
    const bulkDeleteForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkDelete.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MessageController::bulkDelete
 * @see app/Http/Controllers/MessageController.php:290
 * @route '/messages/bulk-delete'
 */
        bulkDeleteForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkDelete.url(options),
            method: 'post',
        })
    
    bulkDelete.form = bulkDeleteForm
/**
* @see \App\Http\Controllers\MessageController::downloadAttachment
 * @see app/Http/Controllers/MessageController.php:312
 * @route '/messages/{message}/attachments/{index}'
 */
export const downloadAttachment = (args: { message: number | { id: number }, index: string | number } | [message: number | { id: number }, index: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadAttachment.url(args, options),
    method: 'get',
})

downloadAttachment.definition = {
    methods: ["get","head"],
    url: '/messages/{message}/attachments/{index}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MessageController::downloadAttachment
 * @see app/Http/Controllers/MessageController.php:312
 * @route '/messages/{message}/attachments/{index}'
 */
downloadAttachment.url = (args: { message: number | { id: number }, index: string | number } | [message: number | { id: number }, index: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    message: args[0],
                    index: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        message: typeof args.message === 'object'
                ? args.message.id
                : args.message,
                                index: args.index,
                }

    return downloadAttachment.definition.url
            .replace('{message}', parsedArgs.message.toString())
            .replace('{index}', parsedArgs.index.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MessageController::downloadAttachment
 * @see app/Http/Controllers/MessageController.php:312
 * @route '/messages/{message}/attachments/{index}'
 */
downloadAttachment.get = (args: { message: number | { id: number }, index: string | number } | [message: number | { id: number }, index: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadAttachment.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MessageController::downloadAttachment
 * @see app/Http/Controllers/MessageController.php:312
 * @route '/messages/{message}/attachments/{index}'
 */
downloadAttachment.head = (args: { message: number | { id: number }, index: string | number } | [message: number | { id: number }, index: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadAttachment.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MessageController::downloadAttachment
 * @see app/Http/Controllers/MessageController.php:312
 * @route '/messages/{message}/attachments/{index}'
 */
    const downloadAttachmentForm = (args: { message: number | { id: number }, index: string | number } | [message: number | { id: number }, index: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: downloadAttachment.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MessageController::downloadAttachment
 * @see app/Http/Controllers/MessageController.php:312
 * @route '/messages/{message}/attachments/{index}'
 */
        downloadAttachmentForm.get = (args: { message: number | { id: number }, index: string | number } | [message: number | { id: number }, index: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadAttachment.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MessageController::downloadAttachment
 * @see app/Http/Controllers/MessageController.php:312
 * @route '/messages/{message}/attachments/{index}'
 */
        downloadAttachmentForm.head = (args: { message: number | { id: number }, index: string | number } | [message: number | { id: number }, index: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: downloadAttachment.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    downloadAttachment.form = downloadAttachmentForm
const messages = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
markAsRead: Object.assign(markAsRead, markAsRead),
markAsUnread: Object.assign(markAsUnread, markAsUnread),
bulkDelete: Object.assign(bulkDelete, bulkDelete),
downloadAttachment: Object.assign(downloadAttachment, downloadAttachment),
}

export default messages