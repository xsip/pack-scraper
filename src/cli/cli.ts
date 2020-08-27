import {BaseUnpackerConfig, UnpackerConfig} from '../shared/interfaces';
import {Utils} from '../shared/utils';
import {CliHelp} from './cli-help';


export class PackScraperCli {
    cliHelp: CliHelp = new CliHelp();
    utils: Utils = new Utils({} as any);

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

    private fixCommandValue(commandKey: string, commandValue: string) {
        switch (typeof BaseUnpackerConfig[commandKey]) {
            case 'string': {
                return commandValue;
                break;
            }
            case 'object': {
                if (Array.isArray(BaseUnpackerConfig[commandKey])) {
                    return commandValue.split(',')
                }

                break;
            }
            case 'boolean': {
                return commandValue === 'false' ? false : true;
                break;
            }
            case 'number': {
                return parseInt(commandValue, 0);
                break;
            }
        }
    }

    public parseConfig(): UnpackerConfig {
        let config: UnpackerConfig = this.createEmptyConfigObject();
        process.argv.map(processArg => {
            if (processArg.indexOf('help') !== -1) {
                this.handleHelpCommand(processArg);
            }
            let data = processArg.split(/=(.+)/);
            data[0] = this.fixCommandName(data[0]);
            config[data[0]] = this.fixCommandValue(data[0], data[1] ? data[1] : '');
            /*else if (processArg.indexOf('additional-scripts') !== -1 || processArg.indexOf('additionalScripts') !== -1) {
                let data = processArg.split(/=(.+)/);
                data[0] = this.fixCommandName(data[0]);
                config[data[0]] = data[1].split(',');
            } else {
                if (processArg.indexOf('=') !== -1) {
                    let data = processArg.split(/=(.+)/);
                    data[0] = this.fixCommandName(data[0]);
                    config[data[0]] = data[1];
                } else {
                    if (processArg.indexOf('recursiveClickTimeout') || processArg.indexOf('recursiveClickSection')) {
                        config[this.fixCommandName(processArg)] = false;
                    }
                    config[this.fixCommandName(processArg)] = true;
                }
            }*/


        });
        return config;
        // return this.fixConfig(config);
    }

    private fixConfig(config: UnpackerConfig) {
        if (config.fetchMethod && config.useChromium && config.recursiveLinkClick) {
            if (!config.recursiveClickTimeout) {
                config.recursiveClickTimeout = 1000;
            }
            if (!config.recursiveClickSection) {
                config.recursiveClickSection = undefined;
            }
        }
        return config
    }

    public configIsValid(config: UnpackerConfig): boolean {
        if (!config.fetchMode && !config.unpackMode) {
            this.cliHelp.logCommands();
            process.exit(0);
        }
        if (config.fetchMode && !config.page && !config.fromCache) {
            if (!config.additionalScripts) {
                console.error(this.utils.cyanText(`Fetchmode requires page, fromCache OR additionalScripts to be set!`));
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

        console.log(config);
        return true;
    }
}
