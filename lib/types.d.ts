import { CatalogType } from "@jochlain/translations/lib";
export declare type LoaderType = {
    extension: RegExp;
    load: (content: string) => CatalogType;
};
export declare type OptionsType = {
    rootDir: string;
};
export declare type InputType = {
    [key: string]: any;
} | undefined;
