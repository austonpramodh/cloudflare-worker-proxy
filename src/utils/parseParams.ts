const parseParams = (rawUrl:string, fwdUrlKey:string) => {
  const url = new URL(rawUrl);
  const parsedParams = {};
  let fwdUrl = "";
  //@ts-ignore
  for (const key of url.searchParams.keys()) {
      if (key === fwdUrlKey) {
          fwdUrl = url.searchParams.get(key);
      } else {
          parsedParams[key] = url.searchParams.get(key);
      }
  }
  return { params: parsedParams, fwdUrl };
};

export default parseParams;