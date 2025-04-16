
/**
 * Constructs a URL string with the specified search parameters.
 *
 * @param url - The base URL object to which the search parameters will be added.
 * @param params - An array of key-value pairs representing the search parameters to set.
 *                 Each pair is a tuple where the first element is the parameter name
 *                 and the second element is the parameter value.
 * @returns The URL string with the appended search parameters.
 */
export function urlWithSearchParams(url: URL, params: Array<[string, string]>) {
    for (const param of params) {
        url.searchParams.set(param[0], param[1]);
    }
    return url.toString();
}

/**
 * Clears all search parameters from the given URL and returns the updated URL as a string.
 *
 * @param baseUrl - The base URL from which search parameters should be removed.
 * @returns The URL as a string with all search parameters cleared.
 */
export function clearSearchParams(baseUrl: string) {
    const url = new URL(baseUrl);
    url.search = '';
    return url.toString();
}