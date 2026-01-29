import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

const StartNode = ({ data }: NodeProps) => {
  const { label, triggerType } = data as any;

  return (
    <div className="bg-white rounded-lg border-2 border-green-100 shadow-sm min-w-[280px] max-w-[300px]">
      <div className="bg-green-50 p-3 border-b border-green-100 flex items-center text-green-800 font-medium">
        <Zap className="w-4 h-4 mr-2 fill-green-600 text-green-600" />
        When to trigger the workflow
      </div>
      
      <div className="p-4 text-center">
        <p className="text-sm text-gray-600 mb-4">
          {triggerType ? `Triggered by: ${triggerType}` : 'Click here to add a trigger that starts your automation'}
        </p>
        
        <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors text-sm shadow-sm">
          {triggerType ? 'Edit Trigger' : 'Add a Trigger'}
        </button>

        <p className="text-[10px] text-gray-400 mt-3 italic">
          * You may skip this step & instead attach workflow to campaigns separately
        </p>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  );
};

export default memo(StartNode);
