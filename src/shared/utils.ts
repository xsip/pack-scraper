import {UnpackerConfig} from "./interfaces";
import * as fs from "fs";
import * as util from "util";

export class Utils {

    appDirectory: string = '';
    outputDirectory: string = '';
    workDataDirectory: string = '';
    sourcemapsDirectory: string = '';

    public evalModule(source: any) {
        return eval(`
        let module = {};@
        let __webpack_public_path__ = '';
        ${source}
        module; 
    `);
    }

    public dataUriToBuffer(uri: string) {
        if (!/^data\:/i.test(uri)) {
            throw new TypeError(
                '`uri` does not appear to be a Data URI (must begin with "data:")'
            );
        }

        // strip newlines
        uri = uri.replace(/\r?\n/g, '');

        // split the URI up into the "metadata" and the "data" portions
        let firstComma = uri.indexOf(',');
        if (-1 === firstComma || firstComma <= 4) {
            throw new TypeError('malformed data: URI');
        }

        // remove the "data:" scheme and parse the metadata
        let meta = uri.substring(5, firstComma).split(';');

        let type = meta[0] || 'text/plain';
        let typeFull = type;
        let base64 = false;
        let charset = '';
        for (let i = 1; i < meta.length; i++) {
            if ('base64' == meta[i]) {
                base64 = true;
            } else {
                typeFull += ';' + meta[i];
                if (0 == meta[i].indexOf('charset=')) {
                    charset = meta[i].substring(8);
                }
            }
        }
        // defaults to US-ASCII only if type is not provided
        if (!meta[0] && !charset.length) {
            typeFull += ';charset=US-ASCII';
            charset = 'US-ASCII';
        }

        // get the encoded data portion and decode URI-encoded chars
        let data = unescape(uri.substring(firstComma + 1));

        let encoding: BufferEncoding  = base64 ? 'base64' : 'ascii';
        const buffer: Buffer = Buffer.from ? Buffer.from(data, encoding) : new Buffer(data, encoding);

        // set `.type` and `.typeFull` properties to MIME type
        // buffer.type = type;
        // buffer.typeFull = typeFull;

        // set the `.charset` property
        // buffer.charset = charset;

        return buffer;
    }

    cyanText = (t: string) => '\x1b[36m' + t + '\x1b[0m';
    redText = (t: string) => '\x1b[31m' + t + '\x1b[0m';

    constructor(private config?: UnpackerConfig) {
        if(config) {
            this.setConfig(config);
        }

    }

    setConfig(config: UnpackerConfig) {
        this.config = config;
        this.outputDirectory = this.computeOutputDirectory();
        this.workDataDirectory = `${this.outputDirectory}/workData`;
        this.sourcemapsDirectory = `${this.workDataDirectory}/maps`;
        this.appDirectory = `${this.workDataDirectory}/unpacked`;
        this.createDirectoryStructure();
    }

    private computeOutputDirectory(): string {
        let pageToFetchCopy: string = `${this.config.page}`;
        if (this.config.outDir !== '') {
            return this.config.outDir;
        }
        return pageToFetchCopy.replace(/\//g, '');

    }

    private createDirectoryStructure(): void {
        this.createDirIfNotExisting(this.outputDirectory);
        this.createDirIfNotExisting(this.workDataDirectory);
        this.createDirIfNotExisting(this.sourcemapsDirectory);
        this.createDirIfNotExisting(this.appDirectory);
    }

    public createDirIfNotExisting = (dir: string): void => {
        try {
            fs.mkdirSync(dir);
        } catch (e) {
        }

    };

    public containsDomain = (e: HTMLScriptElement): boolean => {
        return e.src.indexOf('http://') !== -1 || e.src.indexOf('https://') !== -1 || e.src.indexOf('www.') !== -1;
    };
    public replaceLastSlash = (url: string): string => {
        if (url[url.length - 1] === '/') {
            return url.substr(0, url.length - 1);
        }
        return url;
    };
}