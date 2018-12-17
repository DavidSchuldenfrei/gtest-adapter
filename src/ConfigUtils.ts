import { workspace} from 'vscode';
import { CppDebugConfig } from "./CppDebugConfig";
import { existsSync } from 'fs';
import { resolve } from 'path';

function getPlatform(): string {
    if (process.platform === 'win32')
        return 'windows';
    else if (process.platform === 'darwin')
        return 'osx';
    else return 'linux';
}

function appExistsSync(app: string) : boolean
{
    let exists = existsSync(app);
    if (!exists)
    {
        const platform = getPlatform();
        const extensions_exist = (extensions : string[]) => {
            for (const ext of extensions)
            {
                if (!app.endsWith(ext))
                {
                    if (existsSync(app + ext)) return true;
                }
            }
            return false;
        }
         if (platform === "windows")
        {
            return extensions_exist(['.exe']);
        }
    }
    return exists;
}

export class ConfigUtils {
    public static isValid(workspaceFolder: string, config: CppDebugConfig) {
        var program = ConfigUtils.getDebugProgram(config);
        if (!program)
            return false;
        program = ConfigUtils.expandEnv(program, workspaceFolder);
        return appExistsSync(resolve(workspaceFolder, program));
    }

    public static getDebugProgram(debugConfig: CppDebugConfig): string | undefined {
        let program = debugConfig.program;
        const platform = getPlatform();
        if (debugConfig[platform] && debugConfig[platform].program)
            program = debugConfig[platform].program;
        return program;
    }

    public static expandEnv(path: string, workspaceFolder: string): string {
        path = path.replace("${workspaceFolder}", workspaceFolder);
        path = path.replace("${workspaceRoot}", workspaceFolder); //Deprecated but might still be used.
        return path;
    }

    public static getConfigs() {
        let debugConfigNames = workspace.getConfiguration("gtest-adapter").get<string | string[]>("debugConfig");
        if (!debugConfigNames) {
            return undefined;
        }
        if (! Array.isArray(debugConfigNames)) {
            debugConfigNames = [debugConfigNames];
        }
        return new Set(debugConfigNames);
    }

    public static getDebugConfig(): CppDebugConfig[] | undefined {
        let debugConfigNames = workspace.getConfiguration("gtest-adapter").get<string | string[]>("debugConfig");
        if (!debugConfigNames) {
            return undefined;
        }
        if (! Array.isArray(debugConfigNames)) {
            debugConfigNames = [debugConfigNames];
        }
        const namesSet = ConfigUtils.getConfigs();
        if (!namesSet) {
            return undefined;
        }
        const debugConfigs = workspace.getConfiguration("launch", null).get("configurations") as Array<CppDebugConfig>;
        return debugConfigs.filter(config => namesSet.has(config.name));
    }

}