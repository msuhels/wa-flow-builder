import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitFork } from 'lucide-react';

const ConditionNode = ({ data }: NodeProps) => {
  const { label, conditions } = data as any;

  return (
    <div className="bg-white rounded-lg border-2 border-purple-500 shadow-md min-w-[200px]">
      <div className="bg-purple-500 text-white p-2 rounded-t-md flex items-center text-sm font-semibold">
        <GitFork className="w-4 h-4 mr-2" />
        Condition
      </div>
      
      <div className="p-3">
        <div className="text-sm text-gray-800 mb-2 font-medium">
          {label || 'Check Logic'}
        </div>
        
        {/* Visual representation of branches could go here */}
        <div className="text-xs text-gray-500">
           True / False logic
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
      
      {/* We can have multiple source handles for branches if we want to be fancy, 
          but for now let's stick to standard Right source, and handle logic in edges or properties. 
          Or distinct handles for True/False. */}
      <div className="absolute -right-3 top-10 flex flex-col space-y-8">
         <div className="relative">
            <Handle type="source" position={Position.Right} id="true" className="w-3 h-3 bg-green-500" style={{ right: -6 }} />
            <span className="absolute left-4 -top-2 text-[10px] font-bold text-green-600">True</span>
         </div>
         <div className="relative">
            <Handle type="source" position={Position.Right} id="false" className="w-3 h-3 bg-red-500" style={{ right: -6 }} />
            <span className="absolute left-4 -top-2 text-[10px] font-bold text-red-600">False</span>
         </div>
      </div>
    </div>
  );
};

export default memo(ConditionNode);
