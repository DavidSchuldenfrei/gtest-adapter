import { EventEmitter, TreeDataProvider, TreeItem, Event, ExtensionContext, ProviderResult, QuickPickItem } from 'vscode';
import { TestNode, Status } from "./TestNode";
import { TestTreeItem } from './TestTreeItem';
import { Controller } from './Controller';

export class TestTreeDataProvider implements TreeDataProvider<TestNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    private _root: TestNode | undefined;
    private _leaves: any;
    private _isMultipleConfigs = false;

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
                if (root.children.length == 1) {
                    root = root.children[0];
                    this._isMultipleConfigs = false;
                } else {
                    this._isMultipleConfigs = true;
                }
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

    public setTestStatus(testName: string, testStatus: Status): TestNode | undefined {
        var node = this.findNode(testName);
        node && (node.status = testStatus);
        return node;
    }

    public getQuickPickItems() {
        var allNodes: NodePickItem[] = [];
        if (this._root) {
            let children = this._root.children;
            children.forEach(child => this.addNodes(allNodes, child));
        }
        return allNodes;
    }

    private addNodes(allNodes: NodePickItem[], node: TestNode) {
        if (node.fullName != '*') {
            allNodes.push(new NodePickItem(node, this._isMultipleConfigs));
        }        
        let children = node.children;
        children.forEach(child => this.addNodes(allNodes, child));
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

export class NodePickItem implements QuickPickItem {
    public label: string;
    constructor (public node: TestNode, isMultipleConfigs: boolean) {
        let prefix = isMultipleConfigs ? node.configName + ' - ' : '';
        this.label = prefix + this.getDisplayName(node);
    }

    private getDisplayName(node: TestNode) {
        if (node.fullName == '*') //root. Ignore
            return '';
        let parentName: string = node.parent ? this.getDisplayName(node.parent) : '';
        if (parentName && ! node.name.startsWith('(')) {
            parentName = parentName + '::';
        }
        return parentName + node.name;
    }
}