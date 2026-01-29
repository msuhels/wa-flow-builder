import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { UserCheck } from 'lucide-react';

const InputNode = ({ data }: NodeProps) => {
  const { label, inputType, variableName } = data as any;

  return (
    <div className="bg-white rounded-lg border-2 border-orange-500 shadow-md min-w-[200px]">
      <div className="bg-orange-500 text-white p-2 rounded-t-md flex items-center text-sm font-semibold">
        <UserCheck className="w-4 h-4 mr-2" />
        User Input
      </div>
      
      <div className="p-3">
        <div className="text-sm text-gray-800 mb-2">
          {label || 'Ask a question...'}
        </div>
        
        <div className="bg-orange-50 p-2 rounded text-xs text-orange-800">
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Type:</span>
            <span>{inputType || 'Text'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Save to:</span>
            <span className="font-mono">{variableName || 'var_name'}</span>
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500" />
    </div>
  );
};

export default memo(InputNode);
