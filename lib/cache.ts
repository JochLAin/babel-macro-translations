import { CatalogType } from "@jochlain/translations/lib/types";

const CACHE: { [key: string]: CatalogType } = {};

export const set = (key: string, value: CatalogType) => Object.assign(CACHE, { [key]: value });
export const get = (key: string) => CACHE[key];
