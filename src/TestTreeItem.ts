import { TreeItem, TreeItemCollapsibleState, ExtensionContext } from "vscode";
import { TestNode, Status } from "./TestNode";
import * as path from 'path';

export class TestTreeItem extends TreeItem {
    constructor(public node: TestNode, context: ExtensionContext) {
        super(node.name);
        this.collapsibleState = node.children.length > 0 ? TreeItemCollapsibleState.Collapsed : void 0;
        if (node.status == Status.Passed) {
            this.iconPath = context.asAbsolutePath(path.join('resources', 'passed.png'));
        } else if (node.status == Status.Failed) {
            this.iconPath = context.asAbsolutePath(path.join('resources', 'failed.png'));
        }
        if (node.children.length == 0)
            this.command = { title: 'dblClick', command: 'gtestExplorer.dblClick', arguments: [node] };
    }
}