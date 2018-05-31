import { EventEmitter, TreeDataProvider, TreeItem, Event, TreeItemCollapsibleState,  } from 'vscode';
import { TestNode } from "./TestNode";
import * as path from "path";
import { Runner } from "./Runner";
import { CppDebugConfig } from './CppDebugConfig';
import * as vscode from 'vscode';

export class NodeTreeItem extends TreeItem {
    constructor(public node: TestNode, context: vscode.ExtensionContext) {
        super(node.name);
        this.collapsibleState = node.children.length > 0 ? TreeItemCollapsibleState.Collapsed : void 0,
        this.command =  {
            command: 'gtestExplorer.setCurrent',
            arguments: [node],
            title: 'Set Current'
        }
    }
    
}

export class TestTreeDataProvider implements TreeDataProvider<TestNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    private _current: TestNode | null;
    private treeNodes: NodeTreeItem[];
    
    constructor(private readonly context: vscode.ExtensionContext) 
    {
        this._current = null;
        this.treeNodes = [];
        
    }

    public refresh(): any {
        this._onDidChangeTreeData.fire();
    }
    
    public getTreeItem(element: TestNode): TreeItem {
        var result = new NodeTreeItem(element, this.context);
        this.treeNodes.push(result);
        return result;
    }

    public getChildren(element?: TestNode): TestNode[] | Thenable<TestNode[]> {
        if (element) {
            return element.children;
        }
        return this.loadTestLines().then((fullNames: string[]) => {
            return this.loadTests(fullNames);
        });
    }

    public get current(): TestNode | null {
        return this._current;
    }

    public set current(value: TestNode | null) {
        this._current = value;
    }

    public runTest() {
        if (this._current) {
            Runner.RunInTerminal(this.getTestsApp() + ' --gtest_filter=' + this._current.fullName);
            var treeNode = this.treeNodes.find(treeNode => treeNode.node == this._current);
            if (treeNode) {
                treeNode.iconPath = this.context.asAbsolutePath(path.join('resources', 'failed.png'));
            }
        }
    }

    public debugTest() {
        var debugConfig = this.getDebugConfig();
        if (this._current && vscode.workspace.workspaceFolders && debugConfig) {
            debugConfig.args = ['--gtest_filter=' + this._current.fullName];
            vscode.debug.startDebugging(vscode.workspace.workspaceFolders[0], debugConfig);
        }
    }

    private getDebugConfig(): CppDebugConfig | undefined {
        var debugConfigName = vscode.workspace.getConfiguration("gtest-adapter").get<string>("debugConfig");
        var debugConfigs = vscode.workspace.getConfiguration("launch").get("configurations") as Array<CppDebugConfig>;
        return debugConfigs.find(element => element.name == debugConfigName);
    }

    private getTestsApp(): string {
        var debugConfig = this.getDebugConfig();
        if (!debugConfig)
            return '';

        var testConfig = debugConfig.program;
        var rootPath = vscode.workspace.rootPath;
        if (!rootPath)
            rootPath = '';
        testConfig = testConfig.replace("${workspaceFolder}", rootPath)
        return path.isAbsolute(testConfig) ? testConfig : path.resolve(rootPath, testConfig);
    }

    private loadTestLines(): Thenable<string[]> {
        return new Promise((c, e) => {
            var results = Runner.RunProgram(this.getTestsApp() + '  --gtest_list_tests')
                .split(/[\r\n]+/g);
            results = results.filter(s => s != null && s.trim() != "");
            c(results);
            return c([]);
        });
    }

    private loadTests(tests: string[]) : TestNode[] {        
        var root = new TestNode("", "Tests")
        var current = root;
        var currentName = "";
        for (var i = 0; i < tests.length; ++i) {
            var currentTestLine = tests[i];
            if (currentTestLine.startsWith(" "))
            {
                current.addChild(new TestNode(currentName, currentTestLine));
            } else {
                var indexOfSlash = currentTestLine.indexOf("/");                
                if (indexOfSlash > 0) {
                    var startOfLine = currentTestLine.substring(0, indexOfSlash + 1);
                    var first = new TestNode("", startOfLine);
                    var firstNode = root.addChild(first);
                    var second = new TestNode(startOfLine, currentTestLine.substring(indexOfSlash + 1));
                    current = firstNode.addChild(second);
                    currentName = currentTestLine;
                } else {
                    var node = new TestNode("", currentTestLine);
                    current = root.addChild(node);
                    currentName = currentTestLine;
                }
            }
        }
        return root.children;
    }
}