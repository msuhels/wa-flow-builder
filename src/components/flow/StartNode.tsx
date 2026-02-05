import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, Copy, Check } from 'lucide-react';

const StartNode = ({ data }: NodeProps) => {
  const { label, triggerType, webhookUrl } = data as any;
  const [copied, setCopied] = useState(false);

  const handleCopyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-green-100 shadow-sm min-w-[280px] max-w-[350px]">
      <div className="bg-green-50 p-3 border-b border-green-100 flex items-center text-green-800 font-medium">
        <Zap className="w-4 h-4 mr-2 fill-green-600 text-green-600" />
        Flow Start
      </div>
      
      <div className="p-4">
        {webhookUrl && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1 font-medium">Webhook URL:</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={webhookUrl} 
                readOnly 
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 font-mono text-gray-700"
              />
              <button
                onClick={handleCopyWebhook}
                className="p-1.5 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                title="Copy webhook URL"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-600" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              POST to this URL with: {`{ "phoneNumber": "+1234567890" }`}
            </p>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            {triggerType ? `Trigger: ${triggerType}` : 'Flow will start when webhook is called'}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />
    </div>
  );
};

export default memo(StartNode);
