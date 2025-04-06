
// Converts a string with emojis into an array of codepoint strings for tewmoji file names
export function codepointsFromEmoji(emoji: string) {
    const codepoints = [];
    for (const codepoint of emoji) {
        codepoints.push(codepoint.codePointAt(0)?.toString(16));
    }
    // console.log(codepoints);
    return codepoints;
}

// if there are multiple codepoints, return them seperated by '-' (e.g. 1f4a9-1f4a9)
export function codepointStringFromEmoji(codepoints: string): string {
    return codepointsFromEmoji(codepoints).join('-');
}