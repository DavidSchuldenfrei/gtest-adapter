import * as vscode from 'vscode';
import { TestTreeDataProvider } from './TestTreeDataProvider';
import { TestNode } from "./TestNode";

export class TestExplorer {

    private treeDataProvider: TestTreeDataProvider;

    constructor(context: vscode.ExtensionContext) {
        const treeDataProvider = new TestTreeDataProvider(context);
        vscode.window.createTreeView('gtestExplorer', {treeDataProvider});

        this.treeDataProvider = treeDataProvider;

        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.refresh', () => this.treeDataProvider.reload()));
        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.run', () => this.treeDataProvider.runTest()));
        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.runAll', () => this.treeDataProvider.runAllTests()));
        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.debug', () => this.treeDataProvider.debugTest()));
        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.setCurrent', (item: TestNode) => this.treeDataProvider.current = item));
    }
}