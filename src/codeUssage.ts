import {UnpackerConfig} from "./shared/interfaces";
import {Fetcher} from "./services/fetcher";
import {Utils} from "./shared/utils";
import {PackScraperCli} from "./cli/cli";
import {SourceMapExtractor} from "./services/source-map-extractor";

const scripts = [
    "example.com/script123.js"
];

const run = async () => {

    const cli: PackScraperCli = new PackScraperCli();
    const config: UnpackerConfig = cli.parseConfig();

    config.unpackMode = true;
    config.fetchMode = false;
    config.outDir = 'example';
    config.additionalScripts = scripts;
    // config.additionalScripts = scripts;
    if (cli.configIsValid(config)) {

        if (config.fetchMode) {
            const fetcher: Fetcher = new Fetcher(config);
            await fetcher.getFiles();
        }

        if (config.unpackMode) {
            const utils: Utils = new Utils(config);
            const extractor: SourceMapExtractor =
                new SourceMapExtractor(config);
            await extractor.unpack();
        }

    }
};

run().then(() => {
    console.log('DONE');
});