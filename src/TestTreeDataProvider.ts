import { EventEmitter, TreeDataProvider, TreeItem, Event, ExtensionContext, ProviderResult } from 'vscode';
import { TestNode, Status } from "./TestNode";
import { TestTreeItem } from './TestTreeItem';
import { Controller } from './Controller';

export class TestTreeDataProvider implements TreeDataProvider<TestNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    private _root: TestNode | undefined;
    private _leaves: any;

    constructor(private readonly context: ExtensionContext, private controller: Controller) {
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

    public getParent(element: TestNode): ProviderResult<TestNode> {
        return element.parent;
    }

    public searchTreeItem(searchPattern: string): TestNode | undefined {
        if (!this._root)
            return undefined;
        var escapedPattern = searchPattern.replace('.', '\\.').replace('*', '.*');
        var regex = new RegExp(escapedPattern,  'i');

        return this.searchInSubTree(this._root, regex);
    }

    private searchInSubTree(root: TestNode, regex: RegExp): TestNode | undefined {
        var children = root.children;
        for (var i = 0; i < children.length; ++i) {
            if (this.isMatch(children[i], regex)) {
                return children[i];
            }
            var result = this.searchInSubTree(children[i], regex);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    private isMatch(node: TestNode, regex: RegExp): boolean {
        return regex.test(node.fullName)
    }

    public getChildren(element?: TestNode): TestNode[] | Thenable<TestNode[]> {
        if (element) {
            return element.children;
        }
        if (this._root)
            return this._root.children;

        return this.controller.loadTestsRoot().then(root => {
            if (!root) {
                return new Array<TestNode>();
            } else {
                this._root = root;
                this.registerLeaves(root);
                return root.children;
            }
        });
    }

    public refresh() {
        if (this._root)
            this._root.RefreshStatus();
        this._onDidChangeTreeData.fire();
    }

    public clearResults(node: TestNode | undefined) {
        if (node) {
            this.clearNodeResults(node);
        } else if (this._root) {
            this.clearNodeResults(this._root);
        }
        this.refresh();
    }

    public setTestStatus(testName: string, testStatus: Status) {
        var node = this.findNode(testName);
        node && (node.status = testStatus);
    }

    private findNode(nodeName: string): TestNode | undefined {
        if (nodeName == '*') {
            return this._root;
        }
        return this._leaves[nodeName];
    }

    private clearNodeResults(node: TestNode) {
        node.status = Status.Unknown;
        node.clearChildrenStatus();
    }

    private registerLeaves(node: TestNode) {
        if (node.isFolder) {
            node.children.forEach(child => this.registerLeaves(child));
        } else {
            this._leaves[node.fullName] = node;
        }
    }
}