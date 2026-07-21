import type { INodeVisitor, VisitParams, VisitResult } from "./base.visitor";

export class ActionVisitor implements INodeVisitor {
  readonly nodeTypes: readonly string[] = ["__default__"];

  async visit(params: VisitParams): Promise<VisitResult> {
    const { condition } = params;

    return {
      shouldContinue: true,
      targetEdges: undefined,
      resolvedCondition: condition,
      steps: [],
    };
  }
}
