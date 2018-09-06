import { workspace } from "vscode";

export class CodeLensSettings {
    public static gotoTestTitle = "Go to Test";
    public static runTitle = "Run";
    public static debugTitle = "Debug";
    public static codelensEnabled: boolean | undefined = true;

    public static refresh() {
        var changed = false;
        var config = workspace.getConfiguration();
        var value = config.get<string>("gtest-adapter.gotoTestTitle");
        if (value) {
            if (CodeLensSettings.gotoTestTitle != value)
                changed = true;
            CodeLensSettings.gotoTestTitle = value;
        }
        value = config.get<string>("gtest-adapter.runTitle");
        if (value) {
            if (CodeLensSettings.runTitle != value)
                changed = true;
            CodeLensSettings.runTitle = value;
        }
        value = config.get<string>("gtest-adapter.debugTitle");
        if (value) {
            if (CodeLensSettings.debugTitle != value)
                changed = true;
            CodeLensSettings.debugTitle = value;
        }
        var value2 = config.get<boolean>("gtest-adapter.showCodeLens");
        if (value2 !== undefined) {
            if (CodeLensSettings.codelensEnabled != value2)
                changed = true;
            CodeLensSettings.codelensEnabled = config.get<boolean>("gtest-adapter.showCodeLens");
        }
        return changed;
    }

}