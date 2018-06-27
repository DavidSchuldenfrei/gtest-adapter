import { RunStatus } from "./RunStatus";
import { StatusBarItem, window } from "vscode";

export class StatusBar {
    private _runStatus: RunStatus = RunStatus.None;
    private _statusBar: StatusBarItem | undefined;

    public get runStatus() {
        return this._runStatus;
    }

    public set runStatus(value: RunStatus) {
        if (value == this._runStatus)
            return;
        this._runStatus = value;
        switch (value)
        {
            case RunStatus.None:
                if (this._statusBar) {
                    this._statusBar.hide;
                    this._statusBar.dispose;
                    this._statusBar = undefined;
                }
                break;
            case RunStatus.Running:
                this.ensureStatusBar();
                this._statusBar && (this._statusBar.tooltip = "Stop");
                this._statusBar && (this._statusBar.command = "gtestExplorer.stop");
                break;
            case RunStatus.RunCompleted:
            this._statusBar && (this._statusBar.tooltip = "Rerun");
            this._statusBar && (this._statusBar.command = "gtestExplorer.rerun");
            break;
        }
    }

    public refresh(runStatus: RunStatus, passedCount: number, totalCount: number) {
        var prefix = runStatus == RunStatus.Running ? 'Running ' : 'Last Run ';
        var countText = 'Passed ' + passedCount + '/' + totalCount + ' ';
        var icon = runStatus == RunStatus.Running ? '$(stop)' : '$(triangle-right)';
        this.runStatus = runStatus;
        this._statusBar && (this._statusBar.text = prefix + countText + icon);
    }

    private ensureStatusBar() {
        if (!this._statusBar) {
            this._statusBar = window.createStatusBarItem();
            this._statusBar.show();
        }
    }
}