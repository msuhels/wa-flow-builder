import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MessageSquare, Image, FileText } from 'lucide-react';

const MessageNode = ({ data }: NodeProps) => {
  const { label, mediaType, buttons } = data as any;

  return (
    <div className="bg-white rounded-lg border-2 border-green-500 shadow-md min-w-[200px]">
      <div className="bg-green-500 text-white p-2 rounded-t-md flex items-center text-sm font-semibold">
        <MessageSquare className="w-4 h-4 mr-2" />
        Message
      </div>
      
      <div className="p-3">
        {mediaType && (
          <div className="mb-2 p-2 bg-gray-100 rounded flex items-center text-xs text-gray-600">
            {mediaType === 'image' ? <Image className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
            {mediaType} attached
          </div>
        )}
        
        <div className="text-sm text-gray-800 whitespace-pre-wrap">
          {label || 'Enter message text...'}
        </div>

        {buttons && buttons.length > 0 && (
          <div className="mt-3 space-y-1">
            {buttons.map((btn: any, idx: number) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 text-xs py-1 px-2 rounded text-center text-blue-600">
                {btn.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" />
    </div>
  );
};

export default memo(MessageNode);
