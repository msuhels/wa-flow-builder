import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Save, RefreshCw, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    baseUrl: '',
    apiKey: '',
    businessNumberId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.data) {
        setFormData({
          baseUrl: response.data.data.baseUrl || '',
          apiKey: response.data.data.apiKey || '',
          businessNumberId: response.data.data.businessNumberId || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/settings', formData);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      // Refresh to ensure we have the correct state (e.g. masked key handling)
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/settings/test', formData);
      setMessage({ type: 'success', text: 'Connection successful!' });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setMessage({ 
          type: 'error', 
          text: error.response?.data?.message || 'Connection failed. Please check your credentials.' 
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Configuration</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center text-gray-700">
             <Shield className="w-5 h-5 mr-2 text-green-600" />
             <p className="text-sm">
                These credentials are used to connect to the <strong>WhatsApp Cloud API</strong> (Meta).
                Please ensure you keep your Access Token secure.
             </p>
          </div>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-md flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permanent Access Token
                </label>
                <input
                  type="text"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleChange}
                  placeholder="EAAG..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                    Get this from the <a href="https://developers.facebook.com/apps/" target="_blank" className="text-green-600 hover:underline">Meta App Dashboard</a>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  name="businessNumberId"
                  value={formData.businessNumberId}
                  onChange={handleChange}
                  placeholder="100000000000001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">The ID of the phone number sending messages.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graph API Base URL (Optional)
                </label>
                <input
                  type="url"
                  name="baseUrl"
                  value={formData.baseUrl}
                  onChange={handleChange}
                  placeholder="https://graph.facebook.com/v17.0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <p className="mt-1 text-xs text-gray-500">Defaults to v17.0 if left empty.</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !formData.baseUrl || !formData.apiKey}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
