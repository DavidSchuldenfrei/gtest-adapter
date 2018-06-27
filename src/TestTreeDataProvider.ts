import { EventEmitter, TreeDataProvider, TreeItem, Event, ExtensionContext } from 'vscode';
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

    public setTestStatus(testName: string, testStatus: Status) {
        var node = this.findNode(testName);
        node && (node.status = testStatus);
    }

    private findNode(nodeName: string): TestNode | undefined {
        return this._leaves[nodeName];
    }

    private registerLeaves(node: TestNode) {
        if (node.isFolder) {
            node.children.forEach(child => this.registerLeaves(child));
        } else {
            this._leaves[node.fullName] = node;
        }
    }
}