import {UnpackerConfig} from "../shared/interfaces";
import {Fetcher} from "../services/fetcher";
import {Utils} from "../shared/utils";
import {CliHelp} from "./cli-help";
import {SourceMapExtractor} from '../services/source-map-extractor';

export class PackScraperCli {
    cliHelp: CliHelp = new CliHelp();
    utils: Utils = new Utils({});

    constructor() {
    }

    private createEmptyConfigObject(): UnpackerConfig {
        return {} as UnpackerConfig;
    }

    private fixCommandName(st: string): string {
        if (st.indexOf('-') !== -1) {
            let data2 = st.split('-');
            return data2.map((d, i) => i !== 0 ? d.charAt(0).toUpperCase() + d.slice(1) : d).join('');
        }
        return st;
    }

    private handleHelpCommand(p: any): void {
        if (p.indexOf('=') !== -1) {
            let data = p.split(/=(.+)/);
            data[1] = this.fixCommandName(data[1]);
            if (data[1].indexOf(',')) {
                data[1].split(',').map(d => this.cliHelp.logCommand(d));
            } else {
                this.cliHelp.logCommand(data[1]);
            }

        } else {
            this.cliHelp.logCommands();
        }

        process.exit(0);
    }

    public parseConfig(): UnpackerConfig {
        let config: UnpackerConfig = this.createEmptyConfigObject();
        process.argv.map(p => {
            if (p.indexOf('help') !== -1) {
                this.handleHelpCommand(p);
            } else if (p.indexOf('additional-scripts') !== -1 || p.indexOf('additionalScripts') !== -1) {
                let data = p.split(/=(.+)/);
                data[0] = this.fixCommandName(data[0]);
                config[data[0]] = data[1].split(',');
            }
            else {
                if (p.indexOf('=') !== -1) {
                    let data = p.split(/=(.+)/);
                    data[0] = this.fixCommandName(data[0]);
                    config[data[0]] = data[1];
                } else {
                    config[this.fixCommandName(p)] = true;
                }
            }


        });
        return config;
    }

    public configIsValid(config: UnpackerConfig): boolean {
        if (!config.fetchMode && !config.unpackMode) {
            this.cliHelp.logCommands();
            process.exit(0);
        }
        if (config.fetchMode && !config.page) {
            if (!config.additionalScripts) {
                console.error(this.utils.cyanText(`Fetchmode requires page OR additionalScripts to be set!`));
                return false;
            }
            if (!config.outDir) {
                console.error(this.utils.cyanText(`Fetchmode using additionalScripts requires outDir to be set!`));
                return false;
            }

        }
        if (config.unpackMode && (!config.page && !config.outDir)) {
            console.error(this.utils.cyanText(`Unpackmode requires page OR outDir to be set!
            (if outDir is not set, outDir get's selected by transforming page)`));
            return false;
        }
        return true;
    }
}

const run = async () => {

    const cli: PackScraperCli = new PackScraperCli();
    const config: UnpackerConfig = cli.parseConfig();

    if (cli.configIsValid(config)) {
        console.log('config is valid');
        if (config.fetchMode) {
            console.log('fetchmode on');
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
