import checkIfJson from "./utils/checkIfJson";
import objectToQueryString from "./utils/objectToQueryString";
import parseHeaders from "./utils/parseHeaders";
import parseParams from "./utils/parseParams";

const fwdUrlKey = "fwdUrl";

const fetchResponse = async (url: string, { headers, method, body }: RequestInit): Promise<Response> => {
    return fetch(url, { method, headers, body });
};

export async function handleRequest(request: Request): Promise<Response> {
    //get the url from query params
    const parsedParams = parseParams(request.url, fwdUrlKey);
    //gte the headers
    // const parsedHeaders = parseHeaders(request.headers);
    //get request body
    const requestBody = request.method.toLocaleLowerCase() === "post" ? await request.text() : undefined;
    //fetch the request
    //handle fwdUrl Missing param
    const fwdResponse = await fetchResponse(parsedParams.fwdUrl + "?" + objectToQueryString(parsedParams.params), {
        headers: request.headers,
        method: request.method,
        body: requestBody,
    });
    const fwdBody = await fwdResponse.text();
    const fwdHeaders = parseHeaders(fwdResponse.headers);

    return new Response(fwdBody, {
        status: 200,
        headers: {
            ...fwdHeaders,
            "content-type": checkIfJson(fwdBody) ? "application/json" : "text/html;charset=UTF-8",
        },
    });
}
