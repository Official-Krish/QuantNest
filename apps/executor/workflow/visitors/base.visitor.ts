import type { ExecutionStep } from "@quantnest-trading/types";
import type { EdgeType, NodeType } from "../../types";
import type { ExecutionContext } from "../execute.context";

export interface VisitResult {
  steps: ExecutionStep[];
  shouldContinue: boolean;
  resolvedCondition?: boolean;
  targetEdges?: EdgeType[];
}

export interface VisitParams {
  node: NodeType;
  nodes: NodeType[];
  edges: EdgeType[];
  context: ExecutionContext;
  condition?: boolean;
  arrivedViaEdgeId?: string;
  incomingEdgeCount?: number;
}

export interface INodeVisitor {
  readonly nodeTypes: readonly string[];
  visit(params: VisitParams): Promise<VisitResult>;
}

export class VisitorRegistry {
  private visitors = new Map<string, INodeVisitor>();

  register(visitor: INodeVisitor): void {
    for (const type of visitor.nodeTypes) {
      this.visitors.set(type, visitor);
    }
  }

  get(nodeType: string): INodeVisitor | undefined {
    return this.visitors.get(nodeType);
  }

  getAll(): INodeVisitor[] {
    return Array.from(new Set(this.visitors.values()));
  }
}

export const visitorRegistry = new VisitorRegistry();
