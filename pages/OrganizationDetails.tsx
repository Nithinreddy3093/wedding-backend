import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  Database, 
  Clock, 
  ShieldAlert, 
  Save, 
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { Organization } from '../types';

const OrganizationDetails: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Update State
  const [newName, setNewName] = useState('');
  const [updateCreds, setUpdateCreds] = useState({ email: '', password: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deleteCreds, setDeleteCreds] = useState({ email: '', password: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (name) {
      fetchOrg(name);
      setNewName(name);
    }
  }, [name]);

  const fetchOrg = async (orgName: string) => {
    try {
      const data = await api.getOrganization(orgName);
      setOrg(data);
    } catch (err) {
      setError('Organization not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setIsUpdating(true);
    try {
      await api.updateOrganization({
        old_organization_name: org.organization_name,
        new_organization_name: newName,
        email: updateCreds.email,
        password: updateCreds.password
      });
      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    if (!window.confirm('Are you absolutely sure? This action is irreversible.')) return;
    
    setIsDeleting(true);
    try {
      await api.deleteOrganization({
        organization_name: org.organization_name,
        email: deleteCreds.email,
        password: deleteCreds.password
      });
      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!org) return <div className="p-8 text-center text-red-500">Organization not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{org.organization_name}</h1>
            <p className="text-slate-500 mt-1 flex items-center">
              <Database size={14} className="mr-1" />
              {org.collection_name}
            </p>
          </div>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium capitalize
            ${org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          `}>
            {org.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">General Settings</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Created At</label>
                  <div className="flex items-center text-slate-900">
                    <Clock size={16} className="mr-2 text-slate-400" />
                    {new Date(org.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Last Updated</label>
                  <div className="flex items-center text-slate-900">
                    <Clock size={16} className="mr-2 text-slate-400" />
                    {new Date(org.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <form onSubmit={handleUpdate} className="space-y-4">
                <h4 className="font-medium text-slate-900">Rename Organization</h4>
                <p className="text-sm text-slate-500">
                  Renaming will migrate all data to a new collection. This is a heavy operation.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Admin Verification Required</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Admin Email"
                      value={updateCreds.email}
                      onChange={(e) => setUpdateCreds({...updateCreds, email: e.target.value})}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={updateCreds.password}
                      onChange={(e) => setUpdateCreds({...updateCreds, password: e.target.value})}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating || newName === org.organization_name || !updateCreds.email || !updateCreds.password}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isUpdating ? 'Updating...' : <><Save size={16} className="mr-2" /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center text-red-800">
              <ShieldAlert size={20} className="mr-2" />
              <h3 className="font-semibold">Danger Zone</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">
                Deleting this organization will permanently remove the database collection 
                <span className="font-mono bg-slate-100 px-1 mx-1 rounded text-xs">{org.collection_name}</span> 
                and all associated data.
              </p>
              
              <form onSubmit={handleDelete} className="space-y-3">
                 <div>
                    <input
                      type="email"
                      placeholder="Admin Email"
                      value={deleteCreds.email}
                      onChange={(e) => setDeleteCreds({...deleteCreds, email: e.target.value})}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={deleteCreds.password}
                      onChange={(e) => setDeleteCreds({...deleteCreds, password: e.target.value})}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
                    />
                 </div>
                <button
                  type="submit"
                  disabled={isDeleting || !deleteCreds.email || !deleteCreds.password}
                  className="w-full flex items-center justify-center px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors font-medium"
                >
                  {isDeleting ? 'Deleting...' : <><Trash2 size={16} className="mr-2" /> Delete Organization</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetails;