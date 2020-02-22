/**
 * Grabs the cookie with name from the request headers
 * @param {Request} request incoming Request
 * @param {string} name of the cookie to grab
 */
function getCookie(request: Request, name: string): string {
    let result: string = null;
    const cookieString = request.headers.get("Cookie");
    if (cookieString) {
        const cookies = cookieString.split(";");
        cookies.forEach((cookie) => {
            const cookieName = cookie.split("=")[0].trim();
            if (cookieName === name) {
                const cookieVal = cookie.split("=")[1];
                result = cookieVal;
            }
        });
    }
    return result;
}

export default getCookie;
