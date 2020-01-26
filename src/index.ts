import {UnpackerConfig} from "./shared/interfaces";
import {Fetcher} from "./services/fetcher";
import {SourceMapExtractor} from "./services/source-map-extractor";
import {PackScraperCli} from "./cli/cli";

const run = async () => {

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
};

run().then(() => {
    // console.log('DONE');
});
