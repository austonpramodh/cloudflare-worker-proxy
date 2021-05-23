import urlJoin from "url-join";
import { parseUrl } from "query-string";
import isUrl from "is-url";
import getCookie from "./utils/extractCookie";
import { oneOf } from "./utils/validationUtils";
const fwdUrlKey = process.env.FORWARD_URL_KEY;
const setCookieKey = "Set-Cookie";
const cookieMaxAge = process.env.COOKIE_MAX_AGE;
const defaultProxyUrl = process.env.DEFAULT_PROXY_URL;
const noCookieKey = process.env.NO_COOKIE_KEY;
const resetCookieKey = process.env.RESET_COOKIE_KEY;
const forwardedUrlIndicatorKey = process.env.FORWARDED_URL_INDICATOR_KEY;

const fetchResponse = async (url: string, request: RequestInit): Promise<Response> => {
    return fetch(url, { ...request, redirect: "manual" });
};

export async function handleRequest(request: Request): Promise<Response> {
    try {
        //check if cookie reset needed
        const cookieResetNeeded =
            request.headers.get(resetCookieKey) === "true" || parseUrl(request.url).query[resetCookieKey] === "true";
        //parse params
        //checking if undefined helps in avoiding addtion of undefined
        //key in params of newly forming url
        const params = request.url.split("?")[1] === undefined ? "" : request.url.split("?")[1];
        //get the x-forward-url
        let fwdUrl = request.headers.get(fwdUrlKey) || (parseUrl(request.url).query[fwdUrlKey] as string);
        //check if x-forward-url is present, if not check for cookie
        if (fwdUrl === undefined) {
            const fwdCookieUrl = cookieResetNeeded ? undefined : getCookie(request, fwdUrlKey);
            fwdUrl = fwdCookieUrl || defaultProxyUrl;
            // throw { errCode: 4001, errMsg: "ooops, you forgot to use x-forward-url for forwarding the request..." };
        } else {
            //check if x-forward-url is valid, if not throw error
            if (!isUrl(fwdUrl)) throw { errCode: 4002, errMsg: "ooops, you gave a wrong url to forward..." };
        }

        // get path
        const path = new URL(request.url).pathname;

        //add path to fwdUrl and get final url
        const finalFwdUrl = urlJoin(fwdUrl, path) + (params ? `?${params}` : "");

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

        // Handle redirected responses
        if (oneOf([301, 302], fwdResponse.status)) {
            // replace forward url in the location domain
            // replace the domain with the host domain

            // Get domain in location
            const redirectedLocation = mutableFwdResponse.headers.get("location");
            //parse the path and concat the path with hostDomain
            const redirectedUrl = new URL(redirectedLocation);
            const hostUrl = new URL(request.url);

            // form new location
            mutableFwdResponse.headers.set(
                "location",
                `${hostUrl.origin}${redirectedUrl.pathname}${redirectedUrl.search || ""}`,
            );
            // Handle domain redirection
            // check if redirection wants to change the forward url domain
            // if not replace the forward url domain as the subsequent request will go to redirected url
            if (fwdUrl.toLowerCase() !== redirectedUrl.origin.toLowerCase()) fwdUrl = redirectedUrl.origin;
        }
        //set the cookie so that subsequent requests get forwarded to same url
        if (cookieResetNeeded) {
            const expiryDate = new Date(Number(new Date()) - 500000);
            mutableFwdResponse.headers.set(setCookieKey, `${fwdUrlKey}=${fwdUrl}; Expires=${expiryDate}`);
        } else {
            //check if setting cookie is not needed
            const noCookieNeeded =
                request.headers.get(noCookieKey) === "true" || parseUrl(request.url).query[noCookieKey] === "true";

            if (noCookieNeeded != true)
                mutableFwdResponse.headers.set(setCookieKey, `${fwdUrlKey}=${fwdUrl}; Max-Age=${cookieMaxAge}`);
        }
        //set a header to indicate that the request is forwarded
        mutableFwdResponse.headers.set(forwardedUrlIndicatorKey, finalFwdUrl);
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
