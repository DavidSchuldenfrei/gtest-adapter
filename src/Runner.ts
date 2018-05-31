import { execSync } from "child_process";
import * as vscode from "vscode";

export class Runner {
    public static RunProgram(cmd: string) : string {
        return execSync(cmd, { encoding: "utf8" });
    }

    public static Debug(arg: string) {
        this.RunProgram("");
    }

    public static RunInTerminal(cmd: string) {
        if (Runner.terminal) {
            Runner.terminal.dispose();
        }
        Runner.terminal = vscode.window.createTerminal();
        Runner.terminal.show();
        Runner.terminal.sendText(cmd);
    }

    private static terminal: vscode.Terminal;
}