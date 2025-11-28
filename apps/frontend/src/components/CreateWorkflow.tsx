import { useCallback, useState } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { type EdgeType, type NodeType } from '../types';
import { TriggerSheet } from './TriggerSheet';

export const CreateWorkflow = () => {
    const [nodes, setNodes] = useState<NodeType[]>([]);
    const [edges, setEdges] = useState<EdgeType[]>([]);

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
    return (
        <div style={{ width: '100vw', height: '100vh' }} >
            {!nodes.length && <TriggerSheet onSelect={(kind, metadata) => {
                setNodes([...nodes, {
                    id: Math.random().toString(),
                    data: {
                        type: "trigger",
                        kind,
                        metadata,
                        label: kind,
                    },
                    position: { x: 0, y: 0 }
                }]);
            }} />}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            />
        </div>
    );
}