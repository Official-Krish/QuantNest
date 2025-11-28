import type { TimerNodeMetadata } from "@/types"
import { Handle, Position } from "@xyflow/react"

export const Timer = ({data, isConnectable}: {
    data: {
        metadata: TimerNodeMetadata
    },
    isConnectable: boolean
}) => {
    return (
        <div className="p-4 border">
            Every {data.metadata.time / 3600} hours
            <Handle type="source" position={Position.Right} />
        </div>
    )
}