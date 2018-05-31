import {DebugConfiguration} from 'vscode'

export interface CppDebugConfig extends DebugConfiguration{
    program: string;
    args?: string[];
}