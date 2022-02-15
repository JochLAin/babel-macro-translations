const CACHE: { [key: string]: any } = {};

export const set = (key: string, value: any) => Object.assign(CACHE, { [key]: value });
export const get = (key: string) => CACHE[key];
