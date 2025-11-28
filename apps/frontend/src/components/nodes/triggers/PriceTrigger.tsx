import type { PriceTriggerNodeMetadata } from "@n8n-trading/types"
import { Handle, Position } from "@xyflow/react"

export const PriceTrigger = ({data, isConnectable}: {
    data: {
        metadata: PriceTriggerNodeMetadata
    },
    isConnectable: boolean
}) => {
    return (
        <div className="p-4 border">
            {data.metadata.asset} - {data.metadata.condition} {data.metadata.targetPrice}
            <Handle type="source" position={Position.Right} />
        </div>
    )
}