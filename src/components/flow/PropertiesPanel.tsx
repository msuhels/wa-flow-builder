import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, HelpCircle } from 'lucide-react';
import { type Node } from '@xyflow/react';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}

const PropertiesPanel = ({ selectedNode, onClose, onUpdate, onDelete }: PropertiesPanelProps) => {
  const [data, setData] = useState<any>(selectedNode?.data || {});

  useEffect(() => {
    if (selectedNode) {
      setData(selectedNode.data);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleChange = (field: string, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onUpdate(selectedNode.id, newData);
  };

  const handleButtonAdd = () => {
    const currentButtons = data.buttons || [];
    if (currentButtons.length < 3) {
      handleChange('buttons', [...currentButtons, { type: 'reply', text: 'New Button' }]);
    }
  };

  const handleButtonChange = (index: number, field: string, value: string) => {
    const newButtons = [...(data.buttons || [])];
    newButtons[index] = { ...newButtons[index], [field]: value };
    handleChange('buttons', newButtons);
  };

  const handleButtonDelete = (index: number) => {
    const newButtons = [...(data.buttons || [])];
    newButtons.splice(index, 1);
    handleChange('buttons', newButtons);
  };

  const renderContent = () => {
    switch (selectedNode.type) {
      case 'start':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
              <select
                value={data.triggerType || 'keyword'}
                onChange={(e) => handleChange('triggerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
              >
                <option value="keyword">Keyword</option>
                <option value="manual">Manual / API</option>
                <option value="campaign">Campaign</option>
              </select>
            </div>

            {data.triggerType === 'keyword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  value={data.triggerValue || ''}
                  onChange={(e) => handleChange('triggerValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                  placeholder="e.g. hello, help, price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The flow will start when a user sends this exact keyword.
                </p>
              </div>
            )}

            {data.triggerType === 'manual' && (
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                This flow can be triggered manually via the dashboard or via API calls.
              </div>
            )}
            
            {data.triggerType === 'campaign' && (
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                Attach this flow to a Marketing Campaign to trigger it.
              </div>
            )}
          </div>
        );

      case 'message':
      case 'button': // Alias
      case 'list':   // Alias
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea
                value={data.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm h-32"
                placeholder="Type your message here..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{{variable}}'} to insert dynamic values.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Header (Optional)</label>
              <select
                value={data.mediaType || ''}
                onChange={(e) => handleChange('mediaType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
              >
                <option value="">None</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Interactive Buttons</label>
                <button
                  onClick={handleButtonAdd}
                  disabled={(data.buttons?.length || 0) >= 3}
                  className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50 flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </button>
              </div>
              
              <div className="space-y-2">
                {data.buttons?.map((btn: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={btn.text}
                      onChange={(e) => handleButtonChange(idx, 'text', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                      placeholder="Button text"
                      maxLength={20}
                    />
                    <button
                      onClick={() => handleButtonDelete(idx)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!data.buttons || data.buttons.length === 0) && (
                  <p className="text-xs text-gray-400 italic">No buttons added.</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
              <textarea
                value={data.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm h-24"
                placeholder="What would you like to ask?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input Type</label>
              <select
                value={data.inputType || 'text'}
                onChange={(e) => handleChange('inputType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="location">Location</option>
                <option value="image">Image</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Save Response To Variable</label>
              <div className="relative">
                <input
                  type="text"
                  value={data.variableName || ''}
                  onChange={(e) => handleChange('variableName', e.target.value)}
                  className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm font-mono"
                  placeholder="custom_var_name"
                />
                <span className="absolute left-3 top-2 text-gray-400 font-mono text-sm">@</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This variable can be used in future messages as {'{{custom_var_name}}'}.
              </p>
            </div>
          </div>
        );

      case 'note':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Note</label>
              <textarea
                value={data.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm h-40"
                placeholder="Write your notes here..."
              />
            </div>
          </div>
        );
        
      case 'condition':
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition Label</label>
                    <input
                        type="text"
                        value={data.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                        placeholder="e.g. Check if VIP"
                    />
                </div>
                 <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="flex items-start">
                        <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2" />
                        <p className="text-xs text-blue-700">
                            Connect the <strong>Green</strong> handle for TRUE and the <strong>Red</strong> handle for FALSE.
                            Detailed logic configuration coming soon.
                        </p>
                    </div>
                </div>
            </div>
        );

      case 'tag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={data.action || 'add'}
                onChange={(e) => handleChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
              >
                <option value="add">Add Tags</option>
                <option value="remove">Remove Tags</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex space-x-2 mb-2">
                 <input
                   type="text"
                   id="tag-input"
                   className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                   placeholder="Enter tag name"
                   onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                         const val = (e.target as HTMLInputElement).value;
                         if (val) {
                             const currentTags = data.tags || [];
                             if (!currentTags.includes(val)) {
                                 handleChange('tags', [...currentTags, val]);
                             }
                             (e.target as HTMLInputElement).value = '';
                         }
                      }
                   }}
                 />
                 <button 
                   onClick={() => {
                       const input = document.getElementById('tag-input') as HTMLInputElement;
                       if (input.value) {
                           const currentTags = data.tags || [];
                           if (!currentTags.includes(input.value)) {
                               handleChange('tags', [...currentTags, input.value]);
                           }
                           input.value = '';
                       }
                   }}
                   className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 hover:bg-indigo-100"
                 >
                    <Plus className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                 {(data.tags || []).map((tag: string, idx: number) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded flex items-center">
                       {tag}
                       <button 
                          onClick={() => {
                              const newTags = [...data.tags];
                              newTags.splice(idx, 1);
                              handleChange('tags', newTags);
                          }}
                          className="ml-1 hover:text-red-500"
                       >
                          <X className="w-3 h-3" />
                       </button>
                    </span>
                 ))}
              </div>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Request Name</label>
               <input
                 type="text"
                 value={data.label || ''}
                 onChange={(e) => handleChange('label', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                 placeholder="e.g. Sync to CRM"
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Request Method</label>
               <select
                 value={data.method || 'POST'}
                 onChange={(e) => handleChange('method', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
               >
                 <option value="GET">GET</option>
                 <option value="POST">POST</option>
                 <option value="PUT">PUT</option>
                 <option value="DELETE">DELETE</option>
               </select>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
               <input
                 type="text"
                 value={data.url || ''}
                 onChange={(e) => handleChange('url', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                 placeholder="https://api.example.com/endpoint"
               />
             </div>
          </div>
        );
        
      case 'handoff':
         return (
            <div className="space-y-4">
               <div className="bg-red-50 p-3 rounded text-xs text-red-800 border border-red-100">
                  <p>
                     When this node is reached, the bot will stop responding and the conversation will be marked as "Open" in the Inbox for a human agent to take over.
                  </p>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Team (Optional)</label>
                  <select
                     value={data.teamId || ''}
                     onChange={(e) => handleChange('teamId', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                     <option value="">No specific team</option>
                     <option value="support">Support</option>
                     <option value="sales">Sales</option>
                  </select>
               </div>
            </div>
         );

      default:
        return (
          <div className="text-sm text-gray-500 italic text-center py-4">
            No properties to configure for this node type.
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white h-full flex flex-col shadow-xl absolute right-0 top-0 z-30">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-800 capitalize">
          {selectedNode.type === 'default' ? 'Message' : selectedNode.type} Node
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => onDelete(selectedNode.id)}
          disabled={selectedNode.type === 'start'}
          className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Node
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
