import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Tag } from 'lucide-react';

const TagNode = ({ data }: NodeProps) => {
  const { label, action, tags } = data as any;

  return (
    <div className="bg-white rounded-lg border-2 border-indigo-500 shadow-md min-w-[200px]">
      <div className="bg-indigo-500 text-white p-2 rounded-t-md flex items-center text-sm font-semibold">
        <Tag className="w-4 h-4 mr-2" />
        Update Tag
      </div>
      
      <div className="p-3">
        <div className="text-sm text-gray-800 mb-2">
          {action === 'remove' ? 'Remove Tags' : 'Add Tags'}
        </div>
        
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string, idx: number) => (
              <span key={idx} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded border border-indigo-100">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No tags selected</div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
};

export default memo(TagNode);
