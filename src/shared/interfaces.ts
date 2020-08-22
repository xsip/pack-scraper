export interface UnpackerConfig {
    page?: string;
    includeJsFiles?: boolean;
    fetchMethod?: 'try' | 'parse';
    useChromium?: boolean;
    recursiveLinkClick?: boolean;
    recursiveClickTimeout?: number;
    recursiveClickSection?: string;
    fromCache?: boolean;
    cookies?: any;
    ignoreExisting?: boolean;
    unpackMode?: boolean;
    fetchMode?: boolean;
    outDir?: string;
    additionalScripts?: string[];
}

export interface FileData {
    url: string;
    name: string;
    data?: string;
    isExtern?: boolean;
    isFromSourceMappingUrl?: boolean
}

export interface FileDataList {
    [index: string]: FileData;
}

export interface SourceMap {
    sources?:  string[];
    sourcesContent?: string[]
}

export interface FileAndExt {
    file: string;
    ext: string;
    folder?: string;
}
