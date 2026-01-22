import { getRequestEvent, query } from "$app/server";

export const getDiscordUser = query(async () => {
    const req = getRequestEvent();
    return req.locals.user;
});

