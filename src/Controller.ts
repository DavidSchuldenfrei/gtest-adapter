import { GTestWrapper } from "./GTestWrapper";
import { TestTreeDataProvider } from "./TestTreeDataProvider";
import { ExtensionContext, window, commands } from "vscode";
import { Status, TestNode } from "./TestNode";
import { StatusBar } from "./StatusBar";
import { RunStatus } from "./RunStatus";

export class Controller {
    private _gtestWrapper: GTestWrapper;
    private _currentTestName = "*";
    private _tree: TestTreeDataProvider;
    private _statusBar: StatusBar;

    constructor(context: ExtensionContext) {
        this._gtestWrapper = new GTestWrapper(this);
        this._tree = new TestTreeDataProvider(context, this);
        this._statusBar = new StatusBar();

        window.createTreeView('gtestExplorer', { treeDataProvider : this._tree});

        context.subscriptions.push(commands.registerCommand('gtestExplorer.refresh', () => this.reloadAll()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.run', () => this.runCurrentTest()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.runAll', () => this.runAllTests()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.debug', () => this.debugTest()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.stop', () => this.stopRun()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.rerun', () => this.rerun()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.switchConfig', () => this.switchConfig()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.setCurrent', (item: TestNode) => this._tree.current = item));
    }

    public reloadAll() {
        this._tree.reload();
        this._gtestWrapper.reload();
    }

    public setTestStatus(testName: string, testStatus: Status) {
        this._tree.setTestStatus(testName, testStatus);
    }

    public refreshDisplay(runStatus: RunStatus, passedCount: number, totalCount: number) {
        this._tree.refresh();
        this._statusBar.refresh(runStatus, passedCount, totalCount);
    }

    public loadTestsRoot(): Thenable<TestNode | undefined> {
        return this._gtestWrapper.loadTestsRootAsync();
    }

    private runAllTests() {
        this._currentTestName = "*";
        this._gtestWrapper.runAllTests();
    }

    private runCurrentTest() {
        this._currentTestName = this.getCurrentTestName();
        this._gtestWrapper.runTestByName(this._currentTestName);
    }

    private rerun() {
        this._gtestWrapper.runTestByName(this._currentTestName);
    }

    private stopRun() {
        this._gtestWrapper.stopRun();
    }

    private debugTest() {
        this._gtestWrapper.debugTest(this.getCurrentTestName());
    }

    private switchConfig() {
        this._gtestWrapper.switchConfig();
    }

    private getCurrentTestName() {
        var node = this._tree.current;
        if (node) {
            return node.fullName;
        } else {
            return "*";
        }
    }
}