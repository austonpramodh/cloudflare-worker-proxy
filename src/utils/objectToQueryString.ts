function objectToQueryString(obj: object): string {
    return Object.keys(obj)
        .map((key) => key + "=" + obj[key])
        .join("&");
}

export default objectToQueryString;
