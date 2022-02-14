import { CatalogType } from "@jochlain/translations/lib/types";
export declare const set: (key: string, value: CatalogType) => {
    [key: string]: CatalogType;
} & {
    [x: string]: CatalogType;
};
export declare const get: (key: string) => CatalogType;
