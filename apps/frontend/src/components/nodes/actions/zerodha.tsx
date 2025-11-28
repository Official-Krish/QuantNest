import type { TradingMetadata } from "@/types";
import { Handle, Position } from "@xyflow/react";

export const zerodhaAction = ({data}: {
    data: {
        metadata: TradingMetadata;
    }
}) => {
    return (
        <div className="p-4 border">
            <h3>Zerodha Action</h3>
            <p>Type: {data.metadata.type}</p>
            <p>Quantity: {data.metadata.qty}</p>
            <p>Symbol: {data.metadata.symbol}</p>
            <Handle type="source" position={Position.Right} />
            <Handle type="target" position={Position.Left} />
        </div>
    )
}