import {Utils} from "../shared/utils";

export class CliLabels {
    private utils: Utils = new Utils();

    constructor() {

    }

    fetchmodeRequiresPageOrAdditionalScrips =
        this.utils.cyanText(`Fetchmode requires page OR additionalScripts to be set!`);
    fetchModeUsingAdditionalScriptsOnlyRequiresOutDr =
        this.utils.cyanText(`Fetchmode using additionalScripts requires outDir to be set!`);
}