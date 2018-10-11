import { workspace } from 'vscode';

export class SchemeSetup {
    private static _failed = {
        "scope": "googletest.failed",
        "settings": {
            "foreground": "#f00"
        }
    };
    private static _passed = {
        "scope": "googletest.passed",
        "settings": {
            "foreground": "#0f0"
        }
    };
    private static _run = {
        "scope": "googletest.run",
        "settings": {
            "foreground": "#0f0"
        }
    };

    public static Setup() {
        var config = workspace.getConfiguration();
        var colorCustomizations: any = config.get("editor.tokenColorCustomizations");
        if (!colorCustomizations) {
            colorCustomizations = {                
            };
        }
        var rules = colorCustomizations.textMateRules;
        if (!rules) {
            rules = [];
            colorCustomizations.textMateRules = rules;
        }
        var changed = false;
        changed = this.AddScopeToRules(this._failed, rules) || changed;
        changed = this.AddScopeToRules(this._passed, rules) || changed;
        changed = this.AddScopeToRules(this._run, rules) || changed;

        if (changed) {
            config.update("editor.tokenColorCustomizations", colorCustomizations);
        }
    }
    
    private static AddScopeToRules(scope: Scope, rules: Scope[]) {
        for (var i = 0; i < rules.length; i++) {
            if (rules[i].scope == scope.scope) {
                return false;       
            }
        }
        rules.push(scope);
        return true;
    }
}

class Scope {
    constructor(public scope: string) {}
}