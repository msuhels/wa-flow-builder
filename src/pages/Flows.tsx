import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Plus, Search, MoreVertical, Play, Pause, Edit, Trash2 } from 'lucide-react';

interface Flow {
  _id: string;
  name: string;
  description: string;
  triggerType: string;
  triggerValue: string;
  isActive: boolean;
  createdAt: string;
}

const Flows = () => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    triggerType: 'keyword',
    triggerValue: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const response = await api.get('/flows');
      setFlows(response.data.data);
    } catch (error) {
      console.error('Error fetching flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/flows', newFlow);
      if (response.data.success) {
        setFlows([response.data.data, ...flows]);
        setShowCreateModal(false);
        setNewFlow({ name: '', description: '', triggerType: 'keyword', triggerValue: '' });
        // Navigate to builder
        navigate(`/flows/${response.data.data._id}/edit`);
      }
    } catch (error) {
      console.error('Error creating flow:', error);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this flow?')) {
      try {
        await api.delete(`/flows/${id}`);
        setFlows(flows.filter((f) => f._id !== id));
      } catch (error) {
        console.error('Error deleting flow:', error);
      }
    }
  };

  const toggleFlowStatus = async (flow: Flow) => {
    try {
      const updatedFlow = { ...flow, isActive: !flow.isActive };
      await api.put(`/flows/${flow._id}`, { isActive: updatedFlow.isActive });
      setFlows(flows.map((f) => (f._id === flow._id ? updatedFlow : f)));
    } catch (error) {
      console.error('Error updating flow status:', error);
    }
  };

  const filteredFlows = flows.filter((flow) =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automation Flows</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-md flex items-center shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5 mr-1" />
          Create Flow
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search flows..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-green-500 focus:border-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredFlows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No flows found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Create your first flow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlows.map((flow) => (
            <div
              key={flow._id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{flow.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {flow.description || 'No description'}
                    </p>
                  </div>
                  <div className={`p-1 rounded-full ${flow.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {flow.isActive ? (
                      <Play className="w-4 h-4 text-green-600" />
                    ) : (
                      <Pause className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 mr-2 capitalize">
                    {flow.triggerType}
                  </span>
                  {flow.triggerValue && (
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      {flow.triggerValue}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    Created: {new Date(flow.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleFlowStatus(flow)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title={flow.isActive ? 'Pause' : 'Activate'}
                    >
                      {flow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => navigate(`/flows/${flow._id}/edit`)}
                      className="p-1 text-blue-400 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFlow(flow._id)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Flow</h2>
            <form onSubmit={handleCreateFlow}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flow Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    value={newFlow.name}
                    onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    value={newFlow.description}
                    onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    value={newFlow.triggerType}
                    onChange={(e) => setNewFlow({ ...newFlow, triggerType: e.target.value })}
                  >
                    <option value="keyword">Keyword</option>
                    <option value="manual">Manual (API)</option>
                    <option value="campaign">Campaign</option>
                  </select>
                </div>
                {newFlow.triggerType === 'keyword' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                    <input
                      type="text"
                      placeholder="e.g., hello, price, help"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      value={newFlow.triggerValue}
                      onChange={(e) => setNewFlow({ ...newFlow, triggerValue: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flows;
