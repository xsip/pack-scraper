import {UnpackerConfig} from "../shared/interfaces";

type CommandList = {
    [K in keyof UnpackerConfig]: string;
}
const cyan = (t: string) => '\x1b[36m' + t + '\x1b[0m';
const red = (t: string) => '\x1b[31m' + t + '\x1b[0m';

export class CliHelp {
    private commands: CommandList = {};

    constructor() {
        this.describeCommands();
        this.logo();
    }
    logo() {
        console.log(red(`

  _____           _           _____                                
 |  __ \\         | |         / ____|                               
 | |__) |_ _  ___| | _______| (___   ___ _ __ __ _ _ __   ___ _ __ 
 |  ___/ _\` |/ __| |/ /______\\___ \\ / __| '__/ _\` | '_ \\ / _ \\ '__|
 | |  | (_| | (__|   <       ____) | (__| | | (_| | |_) |  __/ |   
 |_|   \\__,_|\\___|_|\\_\\     |_____/ \\___|_|  \\__,_| .__/ \\___|_|   
                                                  | |              
                                                  |_|              
                                                        
        `));
    }

    private describeCommands() {
        this.commands.fetchMode = `If this argument is included, fetchMode is activated`;
        this.commands.unpackMode = `If this argument is included, unpackMode is activated.\nFetchMode and UnpackMode can be set at the same execution cycle, but fetch has a higher priority and runs first`;
        this.commands.additionalScripts = `A list of additional script files of which the sourcemaps should be loaded too seperated by a comma.`;
        this.commands.outDir = `Sets the output root directory of written files. Subdirectorys may be created tho!\nIf this param is not set, the dirname gets resolved by transforming the page param`;
        this.commands.ignoreExisting = `Prevent re download of already existing files by adding this param.`;
        this.commands.includeJsFiles = `Also download and save js files`;
        this.commands.page = `The destination page to parse`;
        this.commands.fetchMethod = `Can be 'try' or 'parse'.(default try)\nIf fetchMethod is try, then the script trys to download map files by adding .map to js files name.\nIn parse mode, js files get downloaded first -even when includeJsFiles is unset - to parse them and detect sourcemap file names.`;
    }

    logCommands() {
        for (let key in this.commands) {
            console.log(`${red(key + ':\n')}${cyan(this.commands[key])}`);
        }
    }

    logCommand(key: string) {
        if (this.commands[key]) {
            console.log(`${red(key + ':\n')}${cyan(this.commands[key])}`);
        } else {
            console.log(`${red(key + ':\n')}${cyan('<unknown command - no info provided>')}`);
        }

    }

    getCopyAllScriptsGenerator() {
        const script = `
let getAllScripts = (host) => {
	let tmp = [];
	([].slice.call(document.getElementsByTagName('script'))).map(s => {
		if(s.src.indexOf(host) !== -1) {
		tmp.push(s.src);
		}
	});
	return tmp;
}

let getAllLinks = (host) => {
	let tmp = [];
	([].slice.call(document.getElementsByTagName('link'))).map(s => {
		if(s.href.indexOf(host) !== -1) {
		tmp.push(s.href);
		}
	});
	return tmp;
}


let getAll = (host) => {
return [...getAllScripts(host), ...getAllLinks(host)];
}
console.log(\`execute copy(getAll('<part-of-url>').join(',')) and paste to additionalScripts\`);
`;
    }
}