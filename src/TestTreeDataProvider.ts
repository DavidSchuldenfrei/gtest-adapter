import { EventEmitter, TreeDataProvider, TreeItem, Event, DebugConfiguration, ExtensionContext, workspace, debug } from 'vscode';
import { TestNode, Status } from "./TestNode";
import {resolve } from "path";
import { TestTreeItem } from './TestTreeItem';
import { execSync, spawn } from "child_process"

export class TestTreeDataProvider implements TreeDataProvider<TestNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    private _current: TestNode | undefined;
    private _root: TestNode | undefined;
    private _leaves: any;

    constructor(private readonly context: ExtensionContext) {
        this._leaves = {};
    }

    public reload(): any {
        this._root = undefined;
        this._leaves = {};
        this.refresh();
    }

    public getTreeItem(element: TestNode): TreeItem {
        return new TestTreeItem(element, this.context);
    }

    public getChildren(element?: TestNode): TestNode[] | Thenable<TestNode[]> {
        if (element) {
            return element.children;
        }
        if (this._root)
            return [this._root];

        return this.loadTestLines().then((fullNames: string[]) => {
            return this.loadTests(fullNames);
        });
    }

    public get current(): TestNode | undefined {
        return this._current;
    }

    public set current(value: TestNode | undefined) {
        this._current = value;
    }

    public runAllTests() {
        this.runTestByName('*');
    }

    public runTest() {
        if (this._current) {
            const testName = (this._current as TestNode).fullName;
            this.runTestByName(testName);
        } else {
            this.runAllTests();
        }
    }

    private runTestByName(testName: string) {
        let args: ReadonlyArray<string> = ['--gtest_filter=' + testName];
        var runner = spawn(this.getTestsApp(), args, { detached: true, cwd: this.getWorkspaceFolder() });
        runner.stdout.on('data', data => {
            var dataStr = '';
            if (typeof (data) == 'string') {
                dataStr = data as string;
            } else {
                dataStr = (data as Buffer).toString();
            }
            var lines = dataStr.split(/[\r\n]+/g);
            lines.forEach(line => {
                if (line.startsWith('[       OK ]')) {
                    var node = this.findNode(TestTreeDataProvider.getTestName(line));
                    if (node) {
                        node.status = Status.Passed;
                    }
                } else if (line.startsWith('[  FAILED  ]')) {
                    var node = this.findNode(TestTreeDataProvider.getTestName(line));
                    if (node) {
                        node.status = Status.Failed;
                    }
                }
            });
            this.refresh();
        });
        runner.on('exit', code => {
            if (this._root)
                this._root.RefreshStatus();
            this.refresh();
        });
        if (this._root)
            this._root.RefreshStatus();
        this.refresh();
    }

    public debugTest() {
        var debugConfig = this.getDebugConfig();
        if (this._current && workspace.workspaceFolders && debugConfig) {
            debugConfig.args = ['--gtest_filter=' + this._current.fullName];
            debug.startDebugging(workspace.workspaceFolders[0], debugConfig);
        }
    }

    private refresh(): any {
        this._onDidChangeTreeData.fire();
    }

    private findNode(nodeName: string): TestNode | undefined {
        return this._leaves[nodeName];
    }

    private static getTestName(lineResult: string): string {
        return lineResult.substring(12).trim().split(' ')[0].replace(',', '');
    }

    private getDebugConfig(): CppDebugConfig | undefined {
        var debugConfigName = workspace.getConfiguration("gtest-adapter").get<string>("debugConfig");
        var debugConfigs = workspace.getConfiguration("launch").get("configurations") as Array<CppDebugConfig>;
        return debugConfigs.find(config => { return config.name == debugConfigName; });
    }

    private getWorkspaceFolder(): string {
        var folders = workspace.workspaceFolders;
        if (!folders || folders.length == 0)
            return '';
        var uri = folders[0].uri;
        return uri.fsPath;
    }

    private getTestsApp(): string {
        var debugConfig = this.getDebugConfig();
        if (!debugConfig) {
            return '';
        }
        var workspaceFolder = this.getWorkspaceFolder();
        var testConfig = debugConfig.program;
        testConfig = testConfig.replace("${workspaceFolder}", workspaceFolder)
        return resolve(workspaceFolder, testConfig);
    }

    private loadTestLines(): Thenable<string[]> {
        return new Promise((c, e) => {
            var results = execSync(this.getTestsApp() + '  --gtest_list_tests', { encoding: "utf8" })
                .split(/[\r\n]+/g);
            results = results.filter(s => s != null && s.trim() != "");
            c(results);
            return c([]);
        });
    }

    private loadTests(tests: string[]): TestNode[] {
        this._root = new TestNode("", "Tests")
        var current = this._root;
        var currentName = "";
        for (var i = 0; i < tests.length; ++i) {
            var currentTestLine = tests[i];
            if (currentTestLine.startsWith(" ")) {
                current.addChild(new TestNode(currentName, currentTestLine));
            } else {
                var indexOfSlash = currentTestLine.indexOf("/");
                if (indexOfSlash > 0) {
                    var startOfLine = currentTestLine.substring(0, indexOfSlash + 1);
                    var first = new TestNode("", startOfLine);
                    var firstNode = this._root.addChild(first);
                    var second = new TestNode(startOfLine, currentTestLine.substring(indexOfSlash + 1));
                    current = firstNode.addChild(second);
                    currentName = currentTestLine;
                } else {
                    var node = new TestNode("", currentTestLine);
                    current = this._root.addChild(node);
                    currentName = currentTestLine;
                }
            }
        }
        this.registerLeaves(this._root);
        return this._root.children;
    }

    private registerLeaves(node: TestNode) {
        if (node.isFolder) {
            node.children.forEach(child => this.registerLeaves(child));
        } else {
            this._leaves[node.fullName] = node;
        }
    }
}

interface CppDebugConfig extends DebugConfiguration {
    program: string;
    args?: string[];
}