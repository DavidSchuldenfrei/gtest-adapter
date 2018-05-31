import * as vscode from 'vscode';
import { TestTreeDataProvider } from './TestTreeDataProvider';
import { TestNode } from "./TestNode";
import { CppDebugConfig } from './CppDebugConfig';

export class TestExplorer {

    private treeDataProvider: TestTreeDataProvider;

    constructor(context: vscode.ExtensionContext) {
        const treeDataProvider = new TestTreeDataProvider(context);
        vscode.window.createTreeView('gtestExplorer', {treeDataProvider});

        this.treeDataProvider = treeDataProvider;

        //vscode.debug.startDebugging(rootPath, )

        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.refresh', () => this.treeDataProvider.refresh()));
        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.run', () => this.treeDataProvider.runTest()));
        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.debug', () => this.treeDataProvider.debugTest()));
        context.subscriptions.push(vscode.commands.registerCommand('gtestExplorer.setCurrent', (item: TestNode) => this.treeDataProvider.current = item));
    }
}