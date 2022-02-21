import { CatalogType } from "@jochlain/translations/lib";

export type LoaderType = { extension: RegExp, load: (content: string) => CatalogType };
export type OptionsType = { rootDir: string };
export type InputType = { [key: string]: any }|undefined;
