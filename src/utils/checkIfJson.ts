function checkIfJson(body): boolean {
    let isJson = false;
    try {
        JSON.parse(body);
        isJson = true;
    } catch (error) {
        isJson = false;
    }

    return isJson;
}

export default checkIfJson;
