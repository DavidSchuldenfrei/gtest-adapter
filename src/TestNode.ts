export enum Status {Unknown, Passed, Failed}
export class TestNode {
    private _name: string;
    private _children: any;
    private _fullnames: string[];;
    public status: Status

    constructor(parentPath: string, name: string) {
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
            var start = result.substring(0, result.indexOf('/'));
            var parameters = result.substring(paramPos + 15);
			 if (!parameters.startsWith("(")) {
                 parameters = "(" + parameters + ")";
             }
             return start + parameters;
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
            var parts = this._fullnames;
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
        Object.keys(this._children).forEach((key) => result.push(this._children[key] as TestNode));
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
}
