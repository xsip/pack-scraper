
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
    sources?: string[];
    sourcesContent?: string[]
}

export interface FileAndExt {
    file: string;
    ext: string;
    folder?: string;
}


export const BaseUnpackerConfig = {
    page: String(),
    includeJsFiles: Boolean(),
    fetchMethod: String(),
    useChromium: Boolean(),
    recursiveLinkClick: Boolean(),
    recursiveClickTimeout: 0,
    recursiveClickSection: String(),
    fromCache: Boolean(),
    cookies: [String()],
    ignoreExisting: Boolean(),
    unpackMode: Boolean(),
    fetchMode: Boolean(),
    outDir: String(),
    additionalScripts: [String()],
    chromiumDir: String(),
    preSetup: Boolean(),
}
type UnpackerConfig = typeof BaseUnpackerConfig;
export {UnpackerConfig};
