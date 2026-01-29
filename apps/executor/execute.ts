import { executeGrowwNode } from "./executors/groww";
import { executeZerodhaNode } from "./executors/zerodha";
import type { EdgeType, NodeType } from "./types";

export async function executeWorkflow(nodes: NodeType[], edges: EdgeType[]): Promise<String | void> {
    const trigger = nodes.find((node) => node?.data?.kind === "trigger" || node?.data?.kind === "TRIGGER");
    if (!trigger) return;
    return await executeRecursive(trigger?.id, nodes, edges);
}

export async function executeRecursive(sourceId: string, nodes: NodeType[], edges: EdgeType[]): Promise<String | void> {
    const nodesToExecute = edges.filter(({source, target}) => source === sourceId).map(({target}) => target);
    if (!nodesToExecute) return;

    await Promise.all(nodesToExecute.map(async (id) => {
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        switch (node.type) {
            case "zerodha": 
                const Zres = await executeZerodhaNode(
                   node.data?.metadata?.symbol, 
                   node.data?.metadata?.qty, 
                   node.data?.metadata?.type, 
                   node.data?.metadata?.apiKey,
                   node.data?.metadata?.accessToken,
                   node.data?.metadata?.exchange || "NSE"
                );
                return Zres;
            case "groww":
                const Gres = await executeGrowwNode(
                    node.data?.metadata?.symbol, 
                    node.data?.metadata?.qty, 
                    node.data?.metadata?.type, 
                    node.data?.metadata?.exchange || "NSE",
                    node.data?.metadata?.accessToken
                );
                return Gres;
        }
    }));

    await Promise.all(nodesToExecute.map(id => executeRecursive(id, nodes, edges)));
}