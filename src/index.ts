import {UnpackerConfig} from "./shared/interfaces";
import {Fetcher} from "./services/fetcher";
import {SourceMapExtractor} from "./services/source-map-extractor";
import {PackScraperCli} from "./cli/cli";
import {ChromiumFetcher} from './services/chromium.fetcher';
import * as fs from 'fs';
/*const run = async () => {

    const cli: PackScraperCli = new PackScraperCli();
    const config: UnpackerConfig = cli.parseConfig();

    if (cli.configIsValid(config)) {

        if (config.fetchMode) {
            const fetcher: Fetcher = new Fetcher(config);
            await fetcher.getFiles();
        }

        if (config.unpackMode) {
            const extractor: SourceMapExtractor =
                new SourceMapExtractor(config);
            await extractor.unpack();
        }
    }
};*/

const test = async () => {
    const cli: PackScraperCli = new PackScraperCli();
    const config: UnpackerConfig = cli.parseConfig();
    const chromium = new ChromiumFetcher(config);
    const res = await chromium.getAllJsFiles();
    fs.writeFileSync('res.json', JSON.stringify(res, null, 2), 'utf-8');
}
test().then(() => {
    // console.log('DONE');
});
