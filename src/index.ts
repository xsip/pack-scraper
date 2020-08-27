import {PackScraperCli} from './cli/cli';
import {UnpackerConfig} from './shared/interfaces';
import {SourceMapExtractor} from './services/source-map-extractor';
import {Fetcher} from './services/fetcher';

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const run = async () => {

    const cli: PackScraperCli = new PackScraperCli();
    const config: UnpackerConfig = cli.parseConfig();
    const fetcher: Fetcher = new Fetcher(config);
    console.log(config);

    if (config.preSetup) {
        await fetcher.chromiumFetcher.launch();
        /*await new Promise(resolve => {
            rl.question('Press any key to continue...', (answer) => {
                rl.close();
                resolve(true);
            });
        });*/
        const pages = await fetcher.chromiumFetcher.browser.pages();
        await new Promise(resolve => {
            pages[0].on('close', () => {
                resolve(true);
            })
        });

    }

    if (cli.configIsValid(config)) {
        console.log('config is valid');
        if (config.fetchMode) {
            console.log('fetchmode on');

            await fetcher.getFiles();
        }

        if (config.unpackMode) {
            const extractor: SourceMapExtractor =
                new SourceMapExtractor(config);
            await extractor.unpack();
        }
        await fetcher.chromiumFetcher.end();
    } else {
        await fetcher.chromiumFetcher.end();
    }
};

run().then(() => {
    // console.log('DONE');
});
