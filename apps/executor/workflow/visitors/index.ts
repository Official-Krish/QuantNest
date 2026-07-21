import { visitorRegistry } from "./base.visitor";
import { ConditionalVisitor } from "./conditional.visitor";
import { MergeVisitor } from "./merge.visitor";

export { visitorRegistry } from "./base.visitor";
export type { INodeVisitor, VisitParams, VisitResult } from "./base.visitor";
export { ConditionalVisitor } from "./conditional.visitor";
export { MergeVisitor } from "./merge.visitor";

visitorRegistry.register(new ConditionalVisitor());
visitorRegistry.register(new MergeVisitor());
