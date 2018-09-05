import { CodeLensProvider, EventEmitter, Event, ProviderResult, CancellationToken, TextDocument, CodeLens, workspace, Range, Position } from "vscode";
import { TestNode, Status } from "./TestNode";

export class TestCodeCodeLensProvider implements CodeLensProvider {
    public onDidChangeCodeLensesEmitter: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeCodeLenses: Event<any> = this.onDidChangeCodeLensesEmitter.event;

    public testLocations: Map<string, Map<number, TestNode[]>> = new Map();

    public provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<CodeLens[]> {
        if (!workspace.getConfiguration().get<boolean>("gtest-adapter.showCodeLens"))
            return undefined;
        var file = this.testLocations.get(document.fileName);
        if (!file)
            return undefined;
        var entries: CodeLens[] = [];
        file.forEach((value, line) => {
            var position = new Position(line - 1, 0);
            var range = new Range(position, position);
            var node = value[0];
            if (value.length > 1) {
                var parent = value[0].parent
                if (parent)
                    node = parent;
            }
            var status = this.getStatus(value);
            entries.push(new CodeLens(range, {title: "Go to Tree", command: "gtestExplorer.findTestByNode", arguments: [node], tooltip: "View Test in Tree" }));
            entries.push(new CodeLens(range, {title: "Run", command: "gtestExplorer.runTestByNode", arguments: [node] }));
            entries.push(new CodeLens(range, {title: "Debug", command: "gtestExplorer.debugTestByNode", arguments: [node] }));
            if (status != Status.Unknown) 
                entries.push(new CodeLens(range, {title: this.getStatusAsString(status), command: '' }));
        });
        return entries;
    }

    public dispose() {}

    private getStatus(nodes: TestNode[]) {
        if (nodes.findIndex(node => node.status == Status.Failed) >= 0)
            return Status.Failed;
        if (nodes.findIndex(node => node.status == Status.Unknown) >= 0)
            return Status.Unknown;
        return Status.Passed;
    }

    private getStatusAsString(status:Status) {
        if (status == Status.Passed)
            return "\u2714" + "\ufe0f";
        if (status == Status.Failed)
            return "\u274c" + "\ufe0f";
        return 'Test';
    }
}
