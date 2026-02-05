import React, { useState } from 'react';
import { X, Send, Play, RotateCcw } from 'lucide-react';
import api from '../../lib/axios';

interface FlowTestPanelProps {
  flowId: string;
  onClose: () => void;
}

interface TestMessage {
  type: 'sent' | 'received' | 'buttons';
  text?: string;
  buttons?: Array<{text: string; id: string; nodeId: string}>;
  timestamp: Date;
}

const FlowTestPanel: React.FC<FlowTestPanelProps> = ({ flowId, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  const handleStartFlow = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/webhooks/trigger/${flowId}`, {
        phoneNumber,
        data: {}
      });
      
      setMessages([{
        type: 'sent',
        text: 'Flow started',
        timestamp: new Date()
      }]);
      
      setSessionInfo(response.data.session);
      
      if (response.data.botResponse && response.data.botResponse.content) {
        const content = response.data.botResponse.content;
        const botText = content.label || content.message || '';
        
        if (botText) {
          setMessages(prev => [...prev, {
            type: 'received',
            text: botText,
            timestamp: new Date()
          }]);
        }
        
        if (content.buttons && content.buttons.length > 0) {
          const nodeId = response.data.session?.currentNodeId || 'unknown';
          setCurrentNodeId(nodeId);
          setMessages(prev => [...prev, {
            type: 'buttons',
            buttons: content.buttons.map((btn: any, idx: number) => ({
              text: btn.text,
              id: `${nodeId}_btn_${idx}`,
              nodeId: nodeId
            })),
            timestamp: new Date()
          }]);
        }
      }
      
    } catch (error: any) {
      console.error('Error starting flow:', error);
      setMessages(prev => [...prev, {
        type: 'received',
        text: 'Error: ' + (error.response?.data?.error || error.message),
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const userMessage = message;
    setMessage('');

    setMessages(prev => [...prev, {
      type: 'sent',
      text: userMessage,
      timestamp: new Date()
    }]);

    try {
      const response = await api.post('/webhooks/test', {
        phoneNumber,
        type: 'text',
        text: userMessage
      });

      setSessionInfo(response.data.session);
      
      if (response.data.botResponse && response.data.botResponse.content) {
        const content = response.data.botResponse.content;
        const botText = content.label || content.message || '';
        
        if (botText) {
          setMessages(prev => [...prev, {
            type: 'received',
            text: botText,
            timestamp: new Date()
          }]);
        }
        
        if (content.buttons && content.buttons.length > 0) {
          const nodeId = response.data.session?.currentNodeId || 'unknown';
          setCurrentNodeId(nodeId);
          setMessages(prev => [...prev, {
            type: 'buttons',
            buttons: content.buttons.map((btn: any, idx: number) => ({
              text: btn.text,
              id: `${nodeId}_btn_${idx}`,
              nodeId: nodeId
            })),
            timestamp: new Date()
          }]);
        }
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'received',
        text: 'Error: ' + (error.response?.data?.error || error.message),
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = async (buttonId: string, buttonText: string) => {
    setLoading(true);

    setMessages(prev => [...prev, {
      type: 'sent',
      text: buttonText,
      timestamp: new Date()
    }]);

    try {
      const response = await api.post('/webhooks/test', {
        phoneNumber,
        type: 'button_reply',
        buttonId: buttonId,
        text: buttonText
      });

      setSessionInfo(response.data.session);
      
      if (response.data.botResponse && response.data.botResponse.content) {
        const content = response.data.botResponse.content;
        const botText = content.label || content.message || '';
        
        if (botText) {
          setMessages(prev => [...prev, {
            type: 'received',
            text: botText,
            timestamp: new Date()
          }]);
        }
        
        if (content.buttons && content.buttons.length > 0) {
          const nodeId = response.data.session?.currentNodeId || 'unknown';
          setCurrentNodeId(nodeId);
          setMessages(prev => [...prev, {
            type: 'buttons',
            buttons: content.buttons.map((btn: any, idx: number) => ({
              text: btn.text,
              id: `${nodeId}_btn_${idx}`,
              nodeId: nodeId
            })),
            timestamp: new Date()
          }]);
        }
      }
      
    } catch (error: any) {
      console.error('Error sending button:', error);
      setMessages(prev => [...prev, {
        type: 'received',
        text: 'Error: ' + (error.response?.data?.error || error.message),
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setSessionInfo(null);
    setMessage('');
    setCurrentNodeId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Test Flow</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Phone number"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button
              onClick={handleStartFlow}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
            >
              <Play className="w-4 h-4 mr-1" />
              Start Flow
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Click "Start Flow" to begin testing</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx}>
                {msg.type === 'buttons' ? (
                  <div className="flex justify-start">
                    <div className="max-w-xs space-y-2">
                      {msg.buttons?.map((btn, btnIdx) => (
                        <button
                          key={btnIdx}
                          onClick={() => handleButtonClick(btn.id, btn.text)}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 text-sm font-medium"
                        >
                          {btn.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.type === 'sent'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="text-sm">{msg.text}</div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.type === 'sent' ? 'text-green-100' : 'text-gray-500'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {sessionInfo && (
          <div className="p-3 border-t border-gray-200 bg-blue-50">
            <div className="text-xs text-gray-700">
              <div className="font-medium mb-1">Session Info:</div>
              <div>Status: <span className="font-mono">{sessionInfo.status}</span></div>
              <div>Current Node: <span className="font-mono text-xs">{sessionInfo.currentNodeId?.substring(0, 12)}...</span></div>
              {sessionInfo.context && Object.keys(sessionInfo.context).length > 0 && (
                <div className="mt-1">
                  Variables: <span className="font-mono text-xs">{JSON.stringify(sessionInfo.context)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Send className="w-4 h-4 mr-1" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlowTestPanel;
