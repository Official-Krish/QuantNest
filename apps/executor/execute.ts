import { executeGrowwNode } from "./executors/groww";
import { executeZerodhaNode } from "./executors/zerodha";

interface EdgeType {
    id: string;
    source: string;
    target: string;
}

interface NodeType {
    id: string;
    nodeId: string;
    type?: string | null | undefined;
    data?: {
        kind?: "action" | "trigger" | "ACTION" | "TRIGGER" | null | undefined;
        metadata?: any;
    } | null | undefined;
    position?: {
        x: number;
        y: number;
    } | null | undefined;
    Credentials?: any;
}

export async function executeWorkflow(nodes: NodeType[], edges: EdgeType[]) {
    const trigger = nodes.find((node) => node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER");
    if (!trigger) return;
    await executeRecursive(trigger?.id, nodes, edges);
}

export async function executeRecursive(sourceId: string, nodes: NodeType[], edges: EdgeType[]) {
    const nodesToExecute = edges.filter(({source, target}) => source === sourceId).map(({target}) => target);
    if (!nodesToExecute) return;

    await Promise.all(nodesToExecute.map(async (id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        switch (node.type) {
            case "zerodha": 
               await executeZerodhaNode();
               break;
            case "groww":
                await executeGrowwNode();
                break;
        }
    }));

    await Promise.all(nodesToExecute.map(id => executeRecursive(id, nodes, edges)));
}