import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { ArrowLeft, User, Tag as TagIcon, Clock, MessageSquare, Activity } from 'lucide-react';

interface Contact {
  _id: string;
  phoneNumber: string;
  name?: string;
  attributes: any;
  tags: string[];
  lastInteractionAt?: string;
  createdAt: string;
  sessions?: any[];
  recentMessages?: any[];
}

const ContactDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchContact(id);
    }
  }, [id]);

  const fetchContact = async (contactId: string) => {
    try {
      const response = await api.get(`/contacts/${contactId}`);
      setContact(response.data.data);
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Contact not found</p>
        <button
          onClick={() => navigate('/contacts')}
          className="mt-4 text-green-600 hover:text-green-700"
        >
          Back to Contacts
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/contacts')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Contacts
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {contact.name || 'Unknown Contact'}
              </h1>
              <div className="flex items-center text-gray-500 mt-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                {contact.phoneNumber}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Last Interaction</div>
            <div className="flex items-center text-gray-900">
              <Clock className="w-4 h-4 mr-2" />
              {contact.lastInteractionAt
                ? formatDate(contact.lastInteractionAt)
                : 'Never'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Created</div>
            <div className="text-gray-900">{formatDate(contact.createdAt)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Sessions</div>
            <div className="text-gray-900">{contact.sessions?.length || 0}</div>
          </div>
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {contact.attributes && Object.keys(contact.attributes).length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Attributes</div>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(contact.attributes, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Sessions
          </h2>
          {contact.sessions && contact.sessions.length > 0 ? (
            <div className="space-y-3">
              {contact.sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      Flow ID: {session.flow_id?.substring(0, 8)}...
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        session.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : session.status === 'expired'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Started: {formatDate(session.created_at)}
                  </div>
                  {session.ended_at && (
                    <div className="text-xs text-gray-500">
                      Ended: {formatDate(session.ended_at)}
                    </div>
                  )}
                  {session.current_node_id && (
                    <div className="text-xs text-gray-500 mt-1">
                      Current Node: {session.current_node_id.substring(0, 12)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No sessions yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Recent Messages
          </h2>
          {contact.recentMessages && contact.recentMessages.length > 0 ? (
            <div className="space-y-3">
              {contact.recentMessages.map((message: any) => (
                <div
                  key={message.id}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {message.message_type}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        message.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : message.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : message.status === 'read'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {message.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    {message.content?.label || message.content?.message || 'No content'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(message.sent_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No messages yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;
