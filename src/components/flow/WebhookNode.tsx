import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Webhook } from 'lucide-react';

const WebhookNode = ({ data }: NodeProps) => {
  const { label, url, method } = data as any;

  return (
    <div className="bg-white rounded-lg border-2 border-pink-500 shadow-md min-w-[220px]">
      <div className="bg-pink-500 text-white p-2 rounded-t-md flex items-center text-sm font-semibold">
        <Webhook className="w-4 h-4 mr-2" />
        Trigger Webhook
      </div>
      
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs font-bold bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded uppercase">
            {method || 'POST'}
          </span>
          <span className="text-sm text-gray-800 font-medium truncate w-32" title={label || 'API Request'}>
            {label || 'API Request'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 font-mono truncate bg-gray-50 p-1.5 rounded border border-gray-100">
          {url || 'https://api.example.com/...'}
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-pink-500" />
    </div>
  );
};

export default memo(WebhookNode);
