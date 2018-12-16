import { GTestWrapper } from "./GTestWrapper";
import { TestTreeDataProvider } from "./TestTreeDataProvider";
import { ExtensionContext, window, commands, TreeView, Uri, Position, Selection, Range, languages, workspace, ConfigurationChangeEvent, tasks, TaskEndEvent, TaskGroup } from "vscode";
import { Status, TestNode, LineInfo } from "./TestNode";
import { StatusBar } from "./StatusBar";
import { RunStatus } from "./RunStatus";
import { TestCodeCodeLensProvider } from "./TestCodeCodeLensProvider";
import { CodeLensSettings } from "./CodeLensSettings";
import { resolve } from "url";
import { basename, sep } from "path";
import { existsSync } from "fs";
import { SchemeSetup } from "./SchemeSetup";

export class Controller {
    private _gtestWrapper: GTestWrapper;
    private _currentTestName = "*";
    private _currentNode: TestNode | undefined;
    private _tree: TestTreeDataProvider;
    private _statusBar: StatusBar;
    private _treeView: TreeView<TestNode>;
    private _testLocations: Map<string, Map<string, Map<number, LineInfo>>>;
    private _codeLensProvider: TestCodeCodeLensProvider = new TestCodeCodeLensProvider();
    private _lineInfosToResfresh: Set<LineInfo> = new Set();
    private _testPathResolveRoot: Map<string, string | undefined> = new Map();

    constructor(context: ExtensionContext) {
        this._gtestWrapper = new GTestWrapper(this);
        this._tree = new TestTreeDataProvider(context, this);
        this._statusBar = new StatusBar();

        this._treeView = window.createTreeView('gtestExplorer', { treeDataProvider : this._tree});
        this._testLocations = new Map();

        context.subscriptions.push(commands.registerCommand('gtestExplorer.refresh', () => this.reloadAll()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.run', this.runCurrentTest, this));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.runAll', () => this.runAllTests()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.debug', this.debugTest, this));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.stop', () => this.stopRun()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.rerun', () => this.rerun()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.switchConfig', () => this.switchConfig()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.search', () => this.search()));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.gotoCode', this.gotoCode, this));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.runTestByNode', node => this.runTestByNode(node)));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.debugTestByNode', node => this.debugTestByNode(node)));
        context.subscriptions.push(commands.registerCommand('gtestExplorer.gotoTree', node => this.gotoTree(node)));

        context.subscriptions.push(this._codeLensProvider);
        context.subscriptions.push(languages.registerCodeLensProvider({language: "cpp", scheme: "file"}, this._codeLensProvider));

        CodeLensSettings.refresh();
        context.subscriptions.push(workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) => {
            if (CodeLensSettings.refresh()) {
                this._codeLensProvider.onDidChangeCodeLensesEmitter.fire();
            }
        }));

        tasks.onDidEndTask(function(event: TaskEndEvent) { 
            if ((event.execution.task.group == TaskGroup.Build || event.execution.task.group == TaskGroup.Rebuild) && workspace.getConfiguration().get<boolean>("gtest-adapter.refreshAfterBuild")) {
                commands.executeCommand("gtestExplorer.refresh").then(() => {
                    if (workspace.getConfiguration().get<boolean>("gtest-adapter.runAfterBuild")) {
                        commands.executeCommand("gtestExplorer.runAll");
                    }
                });
            }
        });
        SchemeSetup.Setup();
    }

    private gotoCode(node: TestNode) {
        this.initCurrent(node);
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
        var node = this._tree.setTestStatus(testName, testStatus);
        if (node && node.location) {
            var configName = this.getNodeConfigName(node);
            var locations = this._testLocations.get(configName);
            if (locations) {
                var file = locations.get(node.location.file);
                if (file) {
                    var line = file.get(node.location.line);
                    if (line) {
                        line.notifyNodeStatus(testStatus);
                        this._lineInfosToResfresh.add(line);
                    }
                }
            }
        } 
    }

    public refreshDisplay(runStatus: RunStatus, passedCount: number, totalCount: number) {
        this._tree.refresh();
        this._statusBar.refresh(runStatus, passedCount, totalCount);
        if (runStatus == RunStatus.RunCompleted) {
            this._lineInfosToResfresh.forEach(line => line.refresh());
            this._lineInfosToResfresh.clear();
        }
        this._codeLensProvider.onDidChangeCodeLensesEmitter.fire();
    }

    public loadTestsRoot(): Thenable<TestNode | undefined> {        
        return this._gtestWrapper.loadTestsRootAsync();
    }

    public async notifyTreeLoaded(root: TestNode) {
        let treeTestLocations: Map<string, Map<number, LineInfo>> = new Map();
        this._testLocations.set(root.name, treeTestLocations);
        this.addNodeToLocations(treeTestLocations, root);
        var prefix = await this.findPrefix(Array.from(treeTestLocations.keys()));
        this._testPathResolveRoot.set(root.name, prefix.root);
        if (prefix.root) {
            var folder = prefix.root
            var newTestLocations = new Map();
            treeTestLocations.forEach((value, key) => newTestLocations.set(this.resolveNative(folder, key.substr(3 * prefix.parentFoldersCount)), value));
            this._testLocations.set(root.name, newTestLocations);
            this.fixLocations(prefix.root, prefix.parentFoldersCount, root);
        }
    }

    public notifyAllTreesLoaded() {
        let configs = Array.from(this._testLocations.keys());
        if (configs.length == 0)
            return;
        let mainConfig: string | undefined = "";
        if (configs.length == 1) {
            mainConfig = configs[0];
        } else {
            mainConfig = workspace.getConfiguration("gtest-adapter").get<string>("mainConfig");
            if (!mainConfig) {
                mainConfig = configs[0];
            }
        }
        this._codeLensProvider.testLocations = this._testLocations.get(mainConfig);
    }

    private fixLocations(rootFolder: string, depth: number, root: TestNode) {
        if (root.location) {
            root.location.file = this.resolveNative(rootFolder, root.location.file.substr(3 * depth));
        }
        root.children.forEach(child => this.fixLocations(rootFolder, depth, child));
    }

    private resolveNative(from: string, to: string) {
        var result = resolve(from, to);
        if (sep == '\\') {
            result = result.replace(/\//g,"\\");
        }
        return result;
    }

    private async findPrefix(locations: string[]) {
        locations = locations.sort((a, b) => this.getParentFoldersCount(a) - this.getParentFoldersCount(b));
        var candidates: string[] = [];
        if (locations.length == 0)
            return { root: undefined, parentFoldersCount: 0 };
        var location = locations[0];
        var parentFoldersCount = this.getParentFoldersCount(location);
        location = location.substr(3 * parentFoldersCount);
        var files = await workspace.findFiles("**/" + location);
        if (files.length == 0) {
            var fileName = basename(location);
            files = await workspace.findFiles("**/" + fileName);
            files = files.filter(file => file.fsPath.endsWith(location));
        }
        files.forEach(file => {
            candidates.push(file.fsPath.substr(0, file.fsPath.length - location.length));
        });
        for (var i = 1; i < locations.length; ++i) {
            if (candidates.length < 2) {
                break;
            }
            var location = locations[i].substr(3 * parentFoldersCount);
            candidates = candidates.filter(candidate => existsSync(resolve(candidate, location)));        
        }
        if (candidates.length == 1)
            return { root: candidates[0], parentFoldersCount: parentFoldersCount };
        return { root: undefined, parentFoldersCount: parentFoldersCount };
    }

    private getParentFoldersCount(location: string) {
        var depth = 0;
        var current = location;
        while (current.startsWith("..")) {
            depth++;
            current = current.substr(3);
        }
        return depth;
    }

    private addNodeToLocations(treeTestLocations: Map<string, Map<number, LineInfo>>, node: TestNode) {
        if (node.location) {
            var file = treeTestLocations.get(node.location.file);
            if (!file) {
                file = new Map();
                treeTestLocations.set(node.location.file, file);
            }            
            var line = file.get(node.location.line);
            if (!line) {
                line = new LineInfo();
                file.set(node.location.line, line);
            }
            line.addNode(node);
        }
        node.children.forEach(child => this.addNodeToLocations(treeTestLocations, child));
    }

    private runAllTests() {
        this._currentTestName = "*";
        this._currentNode = undefined;
        this._tree.clearResults(this._currentNode);
        this._lineInfosToResfresh.clear();
        this._gtestWrapper.runAllTests(this._testPathResolveRoot);
    }

    private runCurrentTest(node: TestNode) {
        this.initCurrent(node);
        if (this._currentNode) {
            this.runTestByNode(this._currentNode);
        }
    }

    private runTestByNode(node: TestNode) {
        this._tree.clearResults(node);
        this._lineInfosToResfresh.clear();
        var configName = this.getNodeConfigName(node);
        this._gtestWrapper.runTestByName(configName, node.fullName, this._testPathResolveRoot.get(configName));
    }

    private getNodeConfigName(node: TestNode): string {
        if (!node.parent)
            return node.name;
        return this.getNodeConfigName(node.parent);
    }

    private debugTestByNode(node: TestNode) {
        this._gtestWrapper.debugTest(this.getNodeConfigName(node), node.fullName);
    }

    private rerun() {
        if (this._currentNode) {
            this._tree.clearResults(this._currentNode);
            this._lineInfosToResfresh.clear();
            var configName = this.getNodeConfigName(this._currentNode);
            this._gtestWrapper.runTestByName(configName, this._currentTestName, this._testPathResolveRoot.get(configName));
        }
    }

    private stopRun() {
        this._gtestWrapper.stopRun();
    }

    private debugTest(node: TestNode) {
        this.initCurrent(node);
        this._gtestWrapper.debugTest(this.getNodeConfigName(node), this._currentTestName);
    }

    private switchConfig() {
        this._gtestWrapper.switchConfig();
    }

    private initCurrent(node: TestNode) {
        if (node) {
            this._currentTestName = node.fullName;
            this._currentNode = node;
        } else {
            var nodes = this._treeView.selection;
            if (nodes.length > 0) {
                this._currentTestName = nodes[0].fullName;
                this._currentNode = nodes[0];
            } else {
                this._currentTestName = "*";
                this._currentNode = undefined;
            }
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

    private gotoTree(node: TestNode) {
        this._treeView.reveal(node);
    }
}