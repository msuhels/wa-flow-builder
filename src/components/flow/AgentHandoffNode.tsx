import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Headset } from 'lucide-react';

const AgentHandoffNode = ({ data }: NodeProps) => {
  const { label } = data as any;

  return (
    <div className="bg-white rounded-lg border-2 border-red-500 shadow-md min-w-[200px]">
      <div className="bg-red-500 text-white p-2 rounded-t-md flex items-center text-sm font-semibold">
        <Headset className="w-4 h-4 mr-2" />
        Assign to Agent
      </div>
      
      <div className="p-3">
        <div className="text-sm text-gray-800">
          {label || 'Handover to Human'}
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          Conversation will be paused for bot.
        </p>
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-500" />
      {/* Usually end of flow, but maybe we want to resume after resolution? Adding source just in case */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-red-500" />
    </div>
  );
};

export default memo(AgentHandoffNode);
