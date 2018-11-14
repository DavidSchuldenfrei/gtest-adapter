import { TestLocation } from "./TestLocation";

export enum Status {Unknown, Passed, Failed}
export class TestNode {
    private _name: string;
    private _children: any;
    private _fullnames: string[];
    public status: Status;
    public location: TestLocation | undefined;

    constructor(public parent: TestNode | undefined, parentPath: string, name: string) {
        name = name.trim();
        this._name = this.getname(name);
        var paramPos = name.indexOf("# GetParam() = ");
        if (paramPos > 0) {
            name = name.substr(0, paramPos).trim();
        }
        this._children = {};
        this._fullnames = [parentPath + name];
        this.status = Status.Unknown;
    }

    public RefreshStatus() {
        if (!this.isFolder)
            return;
        Object.keys(this._children).forEach(childName => { (this._children[childName] as TestNode).RefreshStatus(); });
        if (Object.keys(this._children).find(childName => { return (this._children[childName] as TestNode).status == Status.Failed; })) {
            this.status = Status.Failed;
        } else if (Object.keys(this._children).find(childName => { return (this._children[childName] as TestNode).status == Status.Unknown; })) {
            this.status = Status.Unknown;
        } else {
            this.status = Status.Passed;
        }
    }

    private getname(name: string): string {
        var result = name;
        var paramPos = result.indexOf("# GetParam() = ");
        if (paramPos > 0) {
            var parameters = result.substring(paramPos + 15);
             return parameters;
        }
        if (result.endsWith(".") || result.endsWith("/")) {
            result = result.substring(0, result.length - 1);
        }
        return result;
    }

    public get name(): string {        
        return this._name;
    }

    public get fullName(): string {
        if (this.isFolder) {
            var parts = this._fullnames.slice();
            parts.forEach((fn, i, arr) => { arr[i] = fn + "*" });
            return parts.join(':');
        } else {
            return this._fullnames.join(':');
        }
    }

    public get isFolder(): boolean {
        return Object.keys(this._children).length > 0;
    }

    public get children(): TestNode[] {
        var result: TestNode[] = [];
        Object.keys(this._children).forEach(key => result.push(this._children[key] as TestNode));
        result.sort((a, b) => a.name.localeCompare(b.name));
        return result;
    }

    public addChild(child: TestNode): TestNode {
        var existing = this._children[child.name];
        if (existing) {
            child._fullnames.forEach(fn => {
                if ((existing as TestNode)._fullnames.indexOf(fn) == -1) {
                    (existing as TestNode)._fullnames.push(fn);
                }
            })
            return existing;
        }
        this._children[child.name] = child;
        return child;
    }

    public clearChildrenStatus() {
        Object.keys(this._children).forEach(key => {
            var child = this._children[key] as TestNode;
            child.status = Status.Unknown;
            child.clearChildrenStatus();
        });
    }
}

export class LineInfo {
    private _nodes: TestNode[] = [];
    private _status: Status | undefined;

    public get status() {
        return this._status;
    }

    public addNode(node: TestNode) {
        this._nodes.push(node);
    }

    public refresh() {
        if (this._status)
           return;
        if (this._nodes.findIndex(node => node.status == Status.Failed) >= 0) {
           this._status = Status.Failed;
        } else if (this._nodes.findIndex(node => node.status == Status.Unknown) >= 0) {
           this._status = Status.Unknown;
        } else
           this._status = Status.Passed;
    }

    public notifyNodeStatus(status: Status) {
        if (this._nodes.length == 1) {
            this._status = status;
        } else if (status == Status.Failed) {
            this._status = Status.Failed;
        } else if (this._status != status) {
            this._status = undefined;
        }
    }

    public getNode(): TestNode {
        var result = this._nodes[0];
        if (this._nodes.length > 1 && result.parent)
           result = result.parent;
       return result;
    }
}
