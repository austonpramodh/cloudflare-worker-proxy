const parseHeaders = (headers: Headers): { [key: string]: string } => {
    const headersParsed = {};
    //@ts-ignore
    for (const key of headers.keys()) {
        headersParsed[key] = headers.get(key);
    }
    return headersParsed;
};

export default parseHeaders;
