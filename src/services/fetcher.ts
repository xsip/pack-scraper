import {FileData, FileDataList, UnpackerConfig} from "../shared/interfaces";
import {Utils} from "../shared/utils";
import * as request from "request-promise";
import * as fs from "fs";
import {JSDOM} from "jsdom";


export class Fetcher {

    private utils: Utils;
    private sourceMapsToLoad: FileData[] = [];

    private inMemoryJsFiles: FileDataList = {};

    constructor(private config: UnpackerConfig) {
        this.utils = new Utils(this.config);

    }

    addAdditionalScriptsToQueue() {
        if (this.config.additionalScripts) {
            this.config.additionalScripts.map(s => {
                let splitName: string[] = s.split('/');
                this.sourceMapsToLoad.push({url: s, name: splitName[splitName.length - 1], isExtern: false});
            });
        }
    }

    addScriptsFromDocumentToQueue(document: Document) {
        let scripts: HTMLScriptElement[] = Array.prototype.slice.call(
            document.querySelectorAll('script[src]'));

        for (let e of scripts) {
            console.log(e.src);
            if (e.src.indexOf('.js') !== -1) {
                if (!this.utils.containsDomain(e)) {
                    this.sourceMapsToLoad.push({
                        url: this.utils.replaceLastSlash(this.config.page) + '/' + e.src,
                        name: e.src
                    });
                } else {
                    let splitName: string[] = e.src.split('/');
                    this.sourceMapsToLoad.push({url: e.src, name: splitName[splitName.length - 1], isExtern: true});
                }


            }
        }
    }

    private copyFileMessage(f: FileData, dir: string, isSourceMap: boolean) {
        console.log(`copying ${this.utils.cyanText(f.url + (isSourceMap && !f.isFromSourceMappingUrl ? '.map' : ''))
            } to local destination ${this.utils.cyanText(dir + '/' + f.name + (isSourceMap && !f.isFromSourceMappingUrl ? '.map' : ''))}`);
    }

    private copyFileFailedMessage(f: FileData, dir: string, isSourceMap: boolean) {
        console.log(this.utils.redText(`copying ${f.url + (isSourceMap && !f.isFromSourceMappingUrl ? '.map' : '')
            } to local destination ${dir + '/' + f.name + (isSourceMap && !f.isFromSourceMappingUrl ? '.map' : '')} failed`));
    }

    private noSourceMapForFileMessage(f: FileData) {
        console.log(this.utils.redText(`${f.url} doesn't have any sourcemap data provided.`));
    }

    private async getFile(f: FileData, isSourceMap?: boolean) {
        try {
            return await request(f.url + (isSourceMap && !f.isFromSourceMappingUrl ? '.map' : ''))
        } catch (e) {
            return undefined;
        }
    }

    private async getAndSafeFile(f: FileData, dir: string, isSourceMap: boolean) {
        try {
            this.copyFileMessage(f, dir, isSourceMap);
            const data: string = await request(f.url + (isSourceMap && !f.isFromSourceMappingUrl ? '.map' : ''));
            fs.writeFileSync(`${dir}/${f.name}${isSourceMap && !f.isFromSourceMappingUrl ? '.map' : ''}`, data, 'utf-8');
        } catch (e) {
            this.copyFileFailedMessage(f, dir, isSourceMap);
        }
    }

    private async safeFileFromData(f: FileData, dir: string, isSourceMap: boolean) {
        try {
            this.copyFileMessage(f, dir, isSourceMap);
            fs.writeFileSync(`${dir}/${f.name}${isSourceMap ? '.map' : ''}`, f.data, 'utf-8');
        } catch (e) {
            this.copyFileFailedMessage(f, dir, isSourceMap);
        }
    }

    private fileExists(f: FileData, dir: string, isSourceMap: boolean) {
        return fs.existsSync(`${dir}/${f.name}${isSourceMap ? '.map' : ''}`)
    }

    async downloadJsFilesIfNeeded(f: FileData) {
        if (f.data && this.config.includeJsFiles) {
            this.safeFileFromData(f, this.utils.workDataDirectory, false);
        } else if (!f.data && this.config.includeJsFiles) {
            if (this.fileExists(f, this.utils.workDataDirectory, false)) {
                if (!this.config.ignoreExisting) {
                    await this.getAndSafeFile(f, this.utils.workDataDirectory, false);
                } else {
                    console.log(this.utils.cyanText(`${this.utils.workDataDirectory}/${f.name} is already existing`));
                }
            } else {
                await this.getAndSafeFile(f, this.utils.workDataDirectory, false);
            }
        }
    }


    async fetchMethodTry(f: FileData) {

        if (this.fileExists(f, this.utils.sourcemapsDirectory, true)) {
            if (!this.config.ignoreExisting) {
                await this.getAndSafeFile(f, this.utils.sourcemapsDirectory, true);
            } else {
                console.log(this.utils.redText(`${this.utils.sourcemapsDirectory}/${f.name}${!f.isFromSourceMappingUrl ? '.map ' : ''}is already existing`));
            }
        } else {
            await this.getAndSafeFile(f, this.utils.sourcemapsDirectory, true);
        }
    }

    extractSourceMappingUrl(data: string): string {
        const res = data.match(/sourceMappingURL=(.*)/g) || [""];
        // .map gets appended by getAndSafeFile
        return res[0].replace('sourceMappingURL=', ''); // .replace('.map', '');
    }

    removeFileFromUrl(data: string) {
        const res = data.split(/\/(?=[^\/]+$)/);
        return res ? (res[0] + '/') : '';
    }

    async fetchMethodParse(file: FileData) {

        this.inMemoryJsFiles[file.url] = {
            name: file.name,
            url: file.url,
            isExtern: file.isExtern,
            data: await this.getFile(file, false)
        };

        if (this.inMemoryJsFiles[file.url].data && this.inMemoryJsFiles[file.url].data.indexOf('sourceMappingURL') !== -1) {
            let extracted: string = this.extractSourceMappingUrl(this.inMemoryJsFiles[file.url].data);
            if (extracted !== '') {
                console.log(extracted);
                await this.downloadJsFilesIfNeeded(file);

                await this.fetchMethodTry(
                    {
                        url: this.removeFileFromUrl(file.url) + extracted,
                        name: extracted,
                        isExtern: file.isExtern,
                        isFromSourceMappingUrl: true,
                    });

            } else {
                this.noSourceMapForFileMessage(file);
            }
        } else {
            this.noSourceMapForFileMessage(file);
        }

    }

    async getFiles() {
        try {
            if (this.config.page) {
                const fullIndexHtml: string = await request(this.config.page);

                fs.writeFileSync(this.utils.outputDirectory + '/' + this.config.page.replace(/\//g, '') + '.html', fullIndexHtml, 'utf-8');

                const dom = new JSDOM(fullIndexHtml);
                const document: Document = dom.window.document;

                this.addScriptsFromDocumentToQueue(document);
            }

            this.addAdditionalScriptsToQueue();

            // await jsFilesToDownload.map(async file => {
            for (let file of this.sourceMapsToLoad) {
                if (this.config.fetchMethod === 'try' || !this.config.fetchMethod) {
                    await this.downloadJsFilesIfNeeded(file);
                    await this.fetchMethodTry(file);
                } else {
                    await this.fetchMethodParse(file);
                }

            }
            // });

        } catch (e) {
            console.log('error enccoured!!', e);
        }
    }
}