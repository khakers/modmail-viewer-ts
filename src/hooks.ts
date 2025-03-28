import { deLocalizeUrl } from '$lib/paraglide/runtime';
import type { Transport } from '@sveltejs/kit';
import { EJSON, Int32, Long } from 'bson';


export const reroute = (request) => deLocalizeUrl(request.url).pathname;

const reee = (value) => {
    console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    // console.log(value);
    const string = EJSON.stringify(value);
    // console.log(string);
    console.log("==========LENGTH",string.length);
    return string;
}

// For some reason these didn't work on anything but SSR.

export const transport: Transport = {
    // Document: {
    //     encode: (value) => EJSON.stringify(value),
    //     decode: (value) => EJSON.parse(value)
    // },
    // WithID: {
    //     encode: reee,
    //     decode: (value) => EJSON.parse(value)
    // },
    // ModmailThread: {
    //     encode: reee,
    //     decode: (value) => JSON.parse(value)
    // },
    // Int32: {
    //     encode: (value: Int32) => value.toString(),
    //     decode: (value) => parseInt(value)
    // },
    // Long: {
    //     encode: (value: Long) => value.toString(),
    //     decode: (value) => BigInt(value)
    // }
};