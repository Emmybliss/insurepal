export type RouteQueryOptions = Record<string, any>;

export type RouteDefinition<T = any> = {
    url: string;
    method: string;
    methods?: string[];
};

export type RouteFormDefinition<T = any> = {
    action: string;
    method: string;
};

export function queryParams(params?: Record<string, any>): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    });
    const str = searchParams.toString();
    return str ? `?${str}` : '';
}

export function applyUrlDefaults(url: string, defaults?: Record<string, any>): string {
    if (!defaults) return url;
    let result = url;
    Object.entries(defaults).forEach(([key, value]) => {
        result = result.replace(`{${key}}`, String(value));
    });
    return result;
}
