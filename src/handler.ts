import urlJoin from "url-join";
const fwdUrlKey = "x-forward-url";

const fetchResponse = async (url: string, { headers, method, body }: RequestInit): Promise<Response> => {
    return fetch(url, { method, headers, body });
};

export async function handleRequest(request: Request): Promise<Response> {
    //parse params
    const params = request.url.split("?")[1];
    // get path
    const path = new URL(request.url).pathname;
    //add path to fwdUrl and get final url
    const fwdUrl = request.headers.get(fwdUrlKey);
    const finalFwdUrl = urlJoin(fwdUrl, path) + `?${params}`;
    //check if post method, if yes, append body to new request
    const requestBody = request.method.toLocaleLowerCase() === "post" ? await request.text() : undefined;
    //fwd whole header to new request
    const fwdResponse = await fetchResponse(finalFwdUrl, {
        headers: request.headers,
        body: requestBody,
        method: request.method.toUpperCase(),
    });

    const fwdBody = await fwdResponse.text();

    return new Response(fwdBody, {
        status: 200,
        headers: fwdResponse.headers,
    });
}
