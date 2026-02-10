import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type Node,
  type Edge,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../../lib/axios';
import { Save, ArrowLeft, Loader, MessageSquare, UserCheck, StickyNote, GitFork, Tag, Webhook, Headset, Beaker } from 'lucide-react';

import MessageNode from '../../components/flow/MessageNode';
import InputNode from '../../components/flow/InputNode';
import NoteNode from '../../components/flow/NoteNode';
import ConditionNode from '../../components/flow/ConditionNode';
import TagNode from '../../components/flow/TagNode';
import WebhookNode from '../../components/flow/WebhookNode';
import AgentHandoffNode from '../../components/flow/AgentHandoffNode';
import PropertiesPanel from '../../components/flow/PropertiesPanel';
import FlowTestPanel from '../../components/flow/FlowTestPanel';

import StartNode from '../../components/flow/StartNode';

// Define custom node types
const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  button: MessageNode,
  list: MessageNode,
  input: InputNode,
  note: NoteNode,
  condition: ConditionNode,
  tag: TagNode,
  webhook: WebhookNode,
  handoff: AgentHandoffNode,
};

const FlowBuilderContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFlow(id);
    }
  }, [id]);

  const fetchFlow = async (flowId: string) => {
    try {
      console.log('[FlowBuilder] Fetching flow:', flowId);
      const response = await api.get(`/flows/${flowId}`);
      const flowData = response.data.data;
      console.log('[FlowBuilder] Flow data received:', flowData);
      setFlowName(flowData.name);
      
      // Always create start node first
      const startNode = {
        id: 'start-node',
        type: 'start',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Start', 
          triggerType: flowData.triggerType || 'webhook',
          triggerValue: flowData.triggerValue || '',
          webhookUrl: flowData.webhookUrl
        },
        draggable: true,
      };
      
      // Map backend nodes to ReactFlow nodes
      const flowNodes = (flowData.nodes || [])
        .filter((n: any) => n.type !== 'start') // Filter out any existing start nodes from backend
        .map((n: any) => {
          console.log('[FlowBuilder] Mapping node:', n._id, 'properties:', n.properties);
          return {
            id: n._id, 
            type: n.type, 
            position: n.position || { x: 300, y: 100 },
            data: { label: n.name, ...n.properties }, 
          };
        });
      
      console.log('[FlowBuilder] Mapped nodes:', flowNodes);
      
      // Combine start node with other nodes
      const allNodes = [startNode, ...flowNodes];
      
      // Build edges from connections
      const initialEdges: Edge[] = [];
      
      // Add edge from start node to first node if firstNodeId exists
      if (flowData.firstNodeId) {
        console.log('[FlowBuilder] Creating start edge to:', flowData.firstNodeId);
        initialEdges.push({
          id: `e-start-${flowData.firstNodeId}`,
          source: 'start-node',
          target: flowData.firstNodeId,
        });
      }
      
      // Add edges from other nodes
      if (flowData.nodes) {
        flowData.nodes.forEach((sourceNode: any) => {
          if (sourceNode.connections) {
            sourceNode.connections.forEach((conn: any, idx: number) => {
              initialEdges.push({
                id: `e${sourceNode._id}-${conn.targetNodeId}-${idx}`,
                source: sourceNode._id,
                target: conn.targetNodeId,
                sourceHandle: conn.sourceHandle || undefined,
              });
            });
          }
        });
      }

      console.log('[FlowBuilder] Final edges:', initialEdges);
      setNodes(allNodes);
      setEdges(initialEdges);
    } catch (error) {
      console.error('[FlowBuilder] Error fetching flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', nodeLabel);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: crypto.randomUUID(),
        type,
        position,
        data: { label: label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleNodeUpdate = (id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          // Update selected node as well to reflect changes immediately in panel if needed
          const updatedNode = { ...node, data: newData };
          if (selectedNode?.id === id) {
             setSelectedNode(updatedNode);
          }
          return updatedNode;
        }
        return node;
      })
    );
  };

  const handleNodeDelete = (id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setSelectedNode(null);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      console.log('[FlowBuilder] Starting save...');
      console.log('[FlowBuilder] Current nodes:', nodes);
      console.log('[FlowBuilder] Current edges:', edges);
      
      // 1. Find start node and its first connection
      const startNode = nodes.find(n => n.type === 'start');
      const startEdge = edges.find(e => e.source === 'start-node');
      const firstNodeId = startEdge?.target || null;

      console.log('[FlowBuilder] Start node:', startNode);
      console.log('[FlowBuilder] First node ID:', firstNodeId);

      // 2. Update Flow Metadata (Name, Trigger, First Node)
      if (startNode) {
         console.log('[FlowBuilder] Updating flow metadata...');
         const flowUpdate = await api.put(`/flows/${id}`, {
            triggerType: startNode.data.triggerType || 'webhook',
            triggerValue: startNode.data.triggerValue || '',
            firstNodeId: firstNodeId
         });
         console.log('[FlowBuilder] Flow updated:', flowUpdate.data);
      }

      // 3. Prepare nodes payload with proper button routing
      const nodesPayload = nodes
        .filter(n => n.type !== 'start') // Exclude virtual start node
        .map(node => {
        const outgoingEdges = edges.filter(edge => edge.source === node.id);
        
        // Map connections with button index from sourceHandle
        const connections = outgoingEdges.map((edge) => {
          let buttonIndex = 0;
          
          // Extract button index from sourceHandle (e.g., "button-0", "button-1")
          if (edge.sourceHandle && edge.sourceHandle.startsWith('button-')) {
            buttonIndex = parseInt(edge.sourceHandle.split('-')[1]);
          }
          
          return {
            targetNodeId: edge.target,
            condition: '',
            sourceHandle: edge.sourceHandle || '',
            buttonIndex: buttonIndex
          };
        });

        const payload = {
           id: node.id,
           type: node.type || 'message', 
           name: node.data.label || 'New Node',
           position: node.position,
           properties: node.data,
           connections,
        };
        
        console.log('[FlowBuilder] Node payload:', node.id, payload);
        return payload;
      });

      console.log('[FlowBuilder] Saving', nodesPayload.length, 'nodes...');

      const nodesResponse = await api.post('/nodes/batch', {
        flowId: id,
        nodes: nodesPayload
      });
      
      console.log('[FlowBuilder] Nodes saved:', nodesResponse.data);
      
      // Refresh flow data to restore start node edge
      await fetchFlow(id);
      
      alert('Flow saved successfully!');
      
    } catch (error: any) {
      console.error('[FlowBuilder] Error saving flow:', error);
      alert(`Error saving flow: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
           <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
     );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
       {/* Toolbar */}
       <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center shadow-sm z-10 h-16">
          <div className="flex items-center space-x-4">
             <button onClick={() => navigate('/flows')} className="p-1 hover:bg-gray-100 rounded text-gray-500 flex items-center text-sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to flows
             </button>
             <div className="h-6 w-px bg-gray-300"></div>
             <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">{flowName}</h1>
                  <p className="text-xs text-gray-500">Flow ID: {id}</p>
                </div>
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">Draft</span>
             </div>
          </div>
          <div className="flex items-center space-x-4">
             <button
                onClick={() => setShowTestPanel(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
             >
                <Beaker className="w-4 h-4 mr-2" />
                Test Flow
             </button>
             
             <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Activate Workflow</span>
                <button className="w-10 h-5 bg-gray-300 rounded-full relative cursor-pointer transition-colors">
                   <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform"></div>
                </button>
             </div>
             
             <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-[#128C7E] text-white rounded-md hover:bg-[#075E54] disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
             >
                {saving ? (
                   <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                   <Save className="w-4 h-4 mr-2" />
                )}
                Save Workflow
             </button>
          </div>
       </div>

       {/* Canvas Area */}
       <div className="flex-1 w-full h-full relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={handleNodeClick}
            onPaneClick={() => setSelectedNode(null)}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
          
          {/* Left Sidebar / Palette */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-100 w-64 z-20 flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
             </div>
             
             <div className="overflow-y-auto p-2 space-y-4">
                {/* Messages Section */}
                <div>
                   <h4 className="text-xs font-medium text-gray-500 mb-2 px-2 uppercase tracking-wider">Messages</h4>
                   <div className="space-y-1">
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-green-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'message', 'Plain Message')}
                        draggable
                      >
                         <MessageSquare className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-600" />
                         Plain Message
                      </div>
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-green-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'button', 'Message + Buttons')}
                        draggable
                      >
                         <div className="relative mr-3">
                            <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                         </div>
                         Message + Buttons
                      </div>
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-green-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'list', 'Message + List')}
                        draggable
                      >
                         <div className="relative mr-3">
                            <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                         </div>
                         Message + List
                      </div>
                   </div>
                </div>

                {/* Logic Section */}
                <div>
                   <h4 className="text-xs font-medium text-gray-500 mb-2 px-2 uppercase tracking-wider">Logic & Data</h4>
                   <div className="space-y-1">
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-purple-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'condition', 'Condition')}
                        draggable
                      >
                         <GitFork className="w-4 h-4 mr-3 text-gray-400 group-hover:text-purple-600" />
                         Set a Condition
                      </div>
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-orange-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'input', 'Collect Input')}
                        draggable
                      >
                         <UserCheck className="w-4 h-4 mr-3 text-gray-400 group-hover:text-orange-600" />
                         Collect Input
                      </div>
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-indigo-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'tag', 'Add / Remove Tag')}
                        draggable
                      >
                         <Tag className="w-4 h-4 mr-3 text-gray-400 group-hover:text-indigo-600" />
                         Add / Remove Tag
                      </div>
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-pink-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'webhook', 'Trigger Webhook')}
                        draggable
                      >
                         <Webhook className="w-4 h-4 mr-3 text-gray-400 group-hover:text-pink-600" />
                         Trigger Webhook
                      </div>
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-red-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'handoff', 'Agent Handoff')}
                        draggable
                      >
                         <Headset className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-600" />
                         Agent Handoff
                      </div>
                      <div 
                        className="p-2 hover:bg-gray-50 rounded cursor-move text-sm text-gray-700 hover:text-yellow-700 transition-colors flex items-center group"
                        onDragStart={(event) => onDragStart(event, 'note', 'Internal Note')}
                        draggable
                      >
                         <StickyNote className="w-4 h-4 mr-3 text-gray-400 group-hover:text-yellow-600" />
                         Internal Note
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Sidebar / Properties Panel */}
          {selectedNode && (
            <PropertiesPanel
              selectedNode={selectedNode}
              onClose={() => setSelectedNode(null)}
              onUpdate={handleNodeUpdate}
              onDelete={handleNodeDelete}
            />
          )}
       </div>

       {/* Test Panel Modal */}
       {showTestPanel && id && (
         <FlowTestPanel
           flowId={id}
           onClose={() => setShowTestPanel(false)}
         />
       )}
    </div>
  );
};

const FlowBuilder = () => (
  <ReactFlowProvider>
    <FlowBuilderContent />
  </ReactFlowProvider>
);

export default FlowBuilder;
