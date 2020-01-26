import {FileAndExt, SourceMap, UnpackerConfig} from "../shared/interfaces";
import {Utils} from "../shared/utils";
import * as path from 'path';
import * as fse from 'fs-extra';
import * as glob from 'glob';

export class SourceMapExtractor {
    private utils: Utils;
    private sourceMapQuery: string;
    private prefix: string = 'webpack:///';

    constructor(private config: UnpackerConfig) {
        this.utils = new Utils(this.config);
        this.sourceMapQuery = this.utils.replaceLastSlash(this.utils.sourcemapsDirectory) + '/*.map';
    }

    private async forEachSourcemap(sourceMapFileList: string[], todo: (map: string) => Promise<any>) {
        for (let sourceMapFilePath of sourceMapFileList) {
            await todo(sourceMapFilePath);
        }
    }

    private async forEachSourcemapFile(sourceMap: SourceMap, todo: (source: string, content: string) => Promise<any>) {
        let index = -1;
        for (let fileName of sourceMap.sources) {
            index++;
            await todo(fileName, sourceMap.sourcesContent[index]);

        }
    }

    private getOutputFilePathAndExtension(fileName: string): FileAndExt {

        const relativeFilePath = path.relative(this.prefix, fileName).replace(/\\/g, '/');
        const parts = relativeFilePath.match(/([0-9a-zA-Z_/.\-@]+?)(\?\w{4})?$/);

        if (!parts || parts[2]) {
            // ignore special path
            // ignore filename ends with hash
            // console.log(`ignore file: ${fileName}`);
            return {file: '', ext: '', folder: ''};
        }

        const folder = path.resolve(path.join(this.utils.appDirectory, path.dirname(parts[1])));
        const filename = path.basename(parts[1]);
        const extname = path.extname(filename);
        let absPath = path.resolve(path.join(folder, filename));
        return {file: absPath, ext: extname, folder};

    }

    private mapFileContent(fileData: FileAndExt, content: string): string| Buffer {

        let source: string | Buffer = content;

        switch (fileData.ext) {
            // plain text files
            case '.glsl':
                source = this.utils.evalModule(content).exports;
                break;

            // base64 files
            case '.jpg':
            case '.gif':
            case '.png':
            case '.obj':
                const exports = this.utils.evalModule(content).exports;
                try {
                    source = this.utils.dataUriToBuffer(exports);
                } catch (e) {
                    console.info(`It's not a binary file: ${fileData.file}`);
                    fileData.file = fileData.file + '.js';
                }

                break;
            default:
        }
        return source;
    }

    public async unpack() {
        let sourceMapFilePaths = glob.sync(this.sourceMapQuery);

        if (!sourceMapFilePaths.length) {
            console.warn(this.utils.redText(`No Sourcemnaps found in ${this.utils.sourcemapsDirectory}`));
            return;
        }

        await this.forEachSourcemap(sourceMapFilePaths, async (sourceMapFilePath) => {

            try {

                const mapSource: SourceMap = JSON.parse(fse.readFileSync(path.resolve(sourceMapFilePath)));
                console.info(this.utils.cyanText(`extracting files from ${this.utils.redText(sourceMapFilePath)}`));

                await this.forEachSourcemapFile(mapSource, async (fileName: string, fileContent: string) => {

                    const outputFileData = this.getOutputFilePathAndExtension(fileName);

                    if (outputFileData.file === '') {
                        console.log(`${this.utils.cyanText('ignoring file')} ${this.utils.redText(fileName)}`);
                        return;
                    }

                    console.info(this.utils.cyanText(`creating file ${this.utils.redText(outputFileData.file)}`));

                    fileContent = this.mapFileContent(outputFileData, fileContent) as any;
                    fse.ensureDirSync(outputFileData.folder);
                    fse.writeFileSync(outputFileData.file, fileContent);

                })

            } catch (e) {
                console.info(this.utils.cyanText(`invalid sourcemap found: ${this.utils.redText(sourceMapFilePath)}`));
            }

            /*

            const consumer = await new SourceMapConsumer(mapSource.toString());
            const fileNamesFromSourcemapFile = consumer.sources; // _absoluteSources
            const sourcesFromSourceMapFile = consumer.sourcesContent;
            this.extractWithInternalSourceContent(sourcesFromSourceMapFile, fileNamesFromSourcemapFile);
            */
        });


    }
}