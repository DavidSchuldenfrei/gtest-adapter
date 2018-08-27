import { GTestWrapper } from "./GTestWrapper";
import { TestTreeDataProvider } from "./TestTreeDataProvider";
import { ExtensionContext, window, commands, TreeView, Uri, Position, Selection, Range } from "vscode";
import { Status, TestNode } from "./TestNode";
import { StatusBar } from "./StatusBar";
import { RunStatus } from "./RunStatus";

export class Controller {
    private _gtestWrapper: GTestWrapper;
    private _currentTestName = "*";
    private _currentNode: TestNode | undefined;
    private _tree: TestTreeDataProvider;
    private _statusBar: StatusBar;
    private _treeView: TreeView<TestNode>;

    constructor(context: ExtensionContext) {
        this._gtestWrapper = new GTestWrapper(this);
        this._tree = new TestTreeDataProvider(context, this);
        this._statusBar = new StatusBar();

        this._treeView = window.createTreeView('gtestExplorer', { treeDataProvider : this._tree});

        context.subscriptions.push(commands.registerCommand('gtestExplorer.refresh', () => this.reloadAll()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.run', () => this.runCurrentTest()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.runAll', () => this.runAllTests()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.debug', () => this.debugTest()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.stop', () => this.stopRun()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.rerun', () => this.rerun()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.switchConfig', () => this.switchConfig()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.search', () => this.search()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.gotoTest', () => this.gotoTest()));
    }

    private gotoTest() {
        this.initCurrent();
        if (this._currentNode) {
            var currentNode = this._currentNode;
            while (currentNode.children.length) {
                currentNode = currentNode.children[0];
            }
            if (currentNode.location) {
                var location = currentNode.location;
                window.showTextDocument(Uri.file(currentNode.location.file)).then(editor => { 
                    var position = new Position(location.line - 1, 0);
                    editor.selections = [new Selection(position, position)];
                    editor.revealRange(new Range(position, position));
                });
            }
        }
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
        this._currentNode = undefined;
        this._tree.clearResults(this._currentNode);
        this._gtestWrapper.runAllTests();
    }

    private runCurrentTest() {
        this.initCurrent();
        this._tree.clearResults(this._currentNode);
        this._gtestWrapper.runTestByName(this._currentTestName);
    }

    private rerun() {
        this._tree.clearResults(this._currentNode);
        this._gtestWrapper.runTestByName(this._currentTestName);
    }

    private stopRun() {
        this._gtestWrapper.stopRun();
    }

    private debugTest() {
        this.initCurrent();
        this._gtestWrapper.debugTest(this._currentTestName);
    }

    private switchConfig() {
        this._gtestWrapper.switchConfig();
    }

    private initCurrent() {
        var nodes = this._treeView.selection;
        if (nodes.length > 0) {
            this._currentTestName = nodes[0].fullName;
            this._currentNode = nodes[0];
        } else {
            this._currentTestName = "*";
            this._currentNode = undefined;
        }
    }

    private async search() {
        var search = await window.showInputBox(
            { 
                prompt: "Please enter a search string", 
                placeHolder: "Enter (part of) the node to search for. You can use * as a wildcard."
            });
        if (search) {
            var node = this._tree.searchTreeItem(search);
            if (!node) {
                window.showWarningMessage("Test not found.")
            } else {
                this._treeView.reveal(node);
            }
        }
    }
}