import { handleRequest } from "./handler";

addEventListener("fetch", (event) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore need to check this issue
    event.respondWith(handleRequest(event.request));
});
