import { error as skError, type RequestEvent } from "@sveltejs/kit";

/**
 * Sends an error response with the specified status and message.
 *
 * This function constructs an error object that includes the provided message and the requestId
 * extracted from the given request event. It then delegates further error handling to the skError function.
 *
 * @param status - The HTTP status code to associate with the error.
 * @param message - A descriptive error message.
 * @param event - The RequestEvent containing details about the current request, including the requestId.
 * 
 * @throws {HttpError} This error instructs SvelteKit to initiate HTTP error handling.
 * @throws {Error} If the provided status is invalid (not between 400 and 599).
 */
export function error(status: number, message: string, event: RequestEvent): never {

    const error: App.Error = {
        message: message,
        requestId: event.locals.requestId
    }

    skError(status, error)
}