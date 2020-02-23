import urlJoin from "url-join";
import { parseUrl } from "query-string";
import isUrl from "is-url";
import getCookie from "./utils/extractCookie";
const fwdUrlKey = process.env.FORWARD_URL_KEY;
const setCookieKey = "Set-Cookie";
const cookieMaxAge = process.env.COOKIE_MAX_AGE;
const defaultProxyUrl = process.env.DEFAULT_PROXY_URL;
const isForwardedHeaderIndicatorKey = process.env.IS_FORWARDED_INDICATOR_KEY;

const fetchResponse = async (url: string, { headers, method, body }: RequestInit): Promise<Response> => {
    return fetch(url, { method, headers, body });
};

export async function handleRequest(request: Request): Promise<Response> {
    try {
        //parse params
        //checking if undefined helps in avoiding addtion of undefined
        //key in params of newly forming url
        const params = request.url.split("?")[1] === undefined ? "" : request.url.split("?")[1];
        //get the x-forward-url
        let fwdUrl = request.headers.get(fwdUrlKey) || (parseUrl(request.url).query[fwdUrlKey] as string);

        //check if x-forward-url is present, if not check for cookie
        if (fwdUrl === undefined) {
            const fwdCookieUrl = getCookie(request, fwdUrlKey);
            fwdUrl = fwdCookieUrl || defaultProxyUrl;
            // throw { errCode: 4001, errMsg: "ooops, you forgot to use x-forward-url for forwarding the request..." };
        } else {
            //check if x-forward-url is valid, if not throw error
            if (!isUrl(fwdUrl)) throw { errCode: 4002, errMsg: "ooops, you gave a wrong url to forward..." };
        }

        // get path
        const path = new URL(request.url).pathname;

        //add path to fwdUrl and get final url
        const finalFwdUrl = urlJoin(fwdUrl, path) + `?${params}`;

        //check if post method, if yes, append body to new request
        const requestMethod = request.method.toLocaleLowerCase();
        const requestBody =
            requestMethod === "post" || requestMethod === "put" || requestMethod === "patch" ? request.body : undefined;

        //fwd whole header to new request and get the response
        const fwdResponse = await fetchResponse(finalFwdUrl, {
            headers: request.headers,
            body: requestBody,
            method: request.method.toUpperCase(),
        });
        // Make the headers mutable by re-constructing the Response.
        const mutableFwdResponse = new Response(fwdResponse.body, fwdResponse);
        //set the cookie so that subsequent requests get forwarded to same url
        mutableFwdResponse.headers.set(setCookieKey, `${fwdUrlKey}=${fwdUrl}; Max-Age=${cookieMaxAge}`);
        //set a header to indicate that the request is forwarded
        mutableFwdResponse.headers.set(isForwardedHeaderIndicatorKey, "true");
        //return the whole response obtained
        return mutableFwdResponse;
    } catch (error) {
        //Error Handling for missing url or any other kind of errors.
        return new Response(JSON.stringify(error), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
