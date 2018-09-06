import { TestNode, Status } from "./TestNode";

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
