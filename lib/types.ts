import { CatalogType } from "@jochlain/translations/lib/types";

export type LoaderType = { extension: RegExp, load: (content: string) => CatalogType };
export type OptionsType = { rootDir: string };
export type InputType = { [key: string]: any }|undefined;
