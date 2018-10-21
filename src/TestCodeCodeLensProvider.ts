import { CodeLensProvider, EventEmitter, Event, ProviderResult, CancellationToken, TextDocument, CodeLens, Range, Position } from "vscode";
import { Status, LineInfo } from "./TestNode";
import { CodeLensSettings } from "./CodeLensSettings";


export class TestCodeCodeLensProvider implements CodeLensProvider {
    public onDidChangeCodeLensesEmitter: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeCodeLenses: Event<any> = this.onDidChangeCodeLensesEmitter.event;

    public testLocations: Map<string, Map<number, LineInfo>> = new Map();

    public provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<CodeLens[]> {
        if (!CodeLensSettings.codelensEnabled)
            return undefined;
        var file = this.testLocations.get(document.fileName);
        if (!file)
            return undefined;
        var entries: CodeLens[] = [];
        file.forEach((value, line) => {
            var position = new Position(line - 1, 0);
            var range = new Range(position, position);
            var node = value.getNode();
            var status = value.status;
            entries.push(new CodeLens(range, {title: CodeLensSettings.gotoTestTitle, command: "gtestExplorer.gotoTree", arguments: [node], tooltip: "View Test in Tree" }));
            entries.push(new CodeLens(range, {title: CodeLensSettings.runTitle, command: "gtestExplorer.runTestByNode", arguments: [node] }));
            entries.push(new CodeLens(range, {title: CodeLensSettings.debugTitle, command: "gtestExplorer.debugTestByNode", arguments: [node] }));
            if (status != Status.Unknown) 
                entries.push(new CodeLens(range, {title: this.getStatusAsString(status), command: '' }));
        });
        return entries;
    }

    public dispose() {}

    private getStatusAsString(status:Status  | undefined) {
        if (status == Status.Passed)
            return "\u2714" + "\ufe0f";
        if (status == Status.Failed)
            return "\u274c" + "\ufe0f";
        return '';
    }
}
