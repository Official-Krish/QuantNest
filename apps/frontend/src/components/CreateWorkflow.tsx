import { useCallback, useState } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { type EdgeType, type NodeType } from "@n8n-trading/types";
import { TriggerSheet } from './TriggerSheet';
import { PriceTrigger } from './nodes/triggers/PriceTrigger';
import { Timer } from './nodes/triggers/timers';
import { ActionSheet } from './ActionSheet';
import { zerodhaAction } from './nodes/actions/zerodha';
import { growwAction } from './nodes/actions/growwAction';

const nodeTypes = {
    "price-trigger": PriceTrigger,
    "timer": Timer,
    "zerodha": zerodhaAction,
    "groww": growwAction, 
};

const POSITION_OFFSET = 50;

export const CreateWorkflow = () => {
    const [nodes, setNodes] = useState<NodeType[]>([]);
    const [edges, setEdges] = useState<EdgeType[]>([]);
    const [selectedAction, setSelectedAction] = useState<{
        position: { x: number; y: number },
        startingNodeId: string,
    } | null>(null);

    const onNodesChange = useCallback(
        (changes: any) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );
    const onConnect = useCallback(
        (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
        [],
    );

    const onConnectEnd = useCallback((params: any, connectionInfo: any) => {
        if (!connectionInfo.isValid) {
            setSelectedAction({
                startingNodeId: connectionInfo.fromNode.id,
                position: {
                    x: connectionInfo.from.x + POSITION_OFFSET,
                    y: connectionInfo.from.y + POSITION_OFFSET,
                }
            })
        }
    }, []);
    return (
        <div style={{ width: '100vw', height: '100vh' }} >
            {!nodes.length && <TriggerSheet onSelect={(type, metadata) => {
                setNodes([...nodes, {
                    id: Math.random().toString(),
                    type,
                    data: {
                        kind: "trigger",
                        metadata,
                    },
                    position: { x: 0, y: 0 }
                }]);
            }} />}
            {selectedAction && <ActionSheet onSelect={(type, metadata) => {
                const nodeId = Math.random().toString();
                setNodes([...nodes, {
                    id: nodeId,
                    type,
                    data: {
                        kind: "action",
                        metadata,
                    },
                    position: selectedAction.position
                }]);
                setEdges([...edges, {
                    id: `e${selectedAction.startingNodeId}-${nodeId}`,
                    source: selectedAction.startingNodeId,
                    target: nodeId,
                }]);
                setSelectedAction(null);
            }} />}
            <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
                fitView
            />
        </div>
    );
}