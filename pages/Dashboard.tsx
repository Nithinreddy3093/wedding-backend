import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, 
  Calendar, 
  Database, 
  Search, 
  MoreVertical,
  Activity,
  Trash2,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';
import { api } from '../services/api';
import { Organization, OrgStats } from '../types';

// Simple Line Chart Component
const SimpleLineChart = ({ data }: { data: { date: string; count: number }[] }) => {
  if (!data || data.length === 0) return null;

  const height = 100;
  const padding = 5;
  
  // Find min/max
  const maxCount = Math.max(...data.map(d => d.count)) * 1.1; // Add 10% headroom
  const minTime = new Date(data[0].date).getTime();
  const maxTime = new Date(data[data.length - 1].date).getTime();
  const timeRange = maxTime - minTime || 1; // avoid divide by zero

  // Map points to SVG coordinates
  const points = data.map((d, i) => {
    const x = ((new Date(d.date).getTime() - minTime) / timeRange) * 100;
    const y = height - (d.count / maxCount) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create area path (close the loop)
  const areaPath = `${points} 100,${height} 0,${height}`;

  return (
    <div className="w-full h-32 relative group">
      <svg viewBox={`0 -${padding} 100 ${height + padding * 2}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines (horizontal) */}
        {[0, 0.5, 1].map((ratio) => (
          <line 
            key={ratio}
            x1="0" 
            y1={height * ratio} 
            x2="100" 
            y2={height * ratio} 
            stroke="#e2e8f0" 
            strokeWidth="0.5" 
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Area fill */}
        <polygon points={areaPath} fill="url(#gradient)" />

        {/* Line */}
        <polyline 
          points={points} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="2" 
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {data.map((d, i) => {
          const x = ((new Date(d.date).getTime() - minTime) / timeRange) * 100;
          const y = height - (d.count / maxCount) * height;
          return (
            <circle 
              key={i}
              cx={x} 
              cy={y} 
              r="1.5" 
              className="fill-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      
      {/* Tooltip Overlay (simplified) */}
      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-blue-700 border border-blue-100 shadow-sm">
        {data.length} data points
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgsData, statsData] = await Promise.all([
        api.listOrganizations(),
        api.getDashboardStats()
      ]);
      setOrgs(orgsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = orgs.filter(org => 
    org.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Overview of all registered organizations</p>
        </div>
        <Link 
          to="/create"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Building className="mr-2" size={18} />
          Add Organization
        </Link>
      </div>

      {/* Stats & Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stat Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Active Tenants</h3>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Activity size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats?.active || 0}</div>
            <p className="text-xs text-green-600 mt-2 flex items-center">
               <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Operational
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Deleted Tenants</h3>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <Trash2 size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats?.deleted || 0}</div>
            <p className="text-xs text-red-500 mt-2 flex items-center">
               <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Inactive / Removed
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Total Created</h3>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Database size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats?.total || 0}</div>
            <p className="text-xs text-slate-400 mt-2">
              Since platform inception
            </p>
          </div>
        </div>

        {/* Right Column: Growth Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <TrendingUp className="mr-2 text-blue-600" size={20} />
                  Organization Growth
                </h3>
                <p className="text-sm text-slate-500">Cumulative tenant registration over time</p>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-bold text-slate-900">
                  +{stats?.growth.length ? stats.growth.length : 0}
                </div>
                <div className="text-xs text-slate-500">New orgs this period</div>
              </div>
            </div>
            
            <div className="flex-1 flex items-end">
              {stats?.growth && stats.growth.length > 0 ? (
                <SimpleLineChart data={stats.growth} />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                  Not enough data for chart
                </div>
              )}
            </div>
            
            {/* Legend / X-Axis Labels */}
            <div className="mt-4 flex justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
              {stats?.growth && stats.growth.length > 0 && (
                <>
                  <span>{new Date(stats.growth[0].date).toLocaleDateString()}</span>
                  <span>{new Date(stats.growth[Math.floor(stats.growth.length / 2)].date).toLocaleDateString()}</span>
                  <span>{new Date(stats.growth[stats.growth.length - 1].date).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-slate-900">Organization List</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              {filteredOrgs.length}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Database Collection</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <tr key={org.organization_name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-3">
                          {org.organization_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{org.organization_name}</div>
                          <div className="text-xs text-slate-500">ID: {org.collection_name.replace('org_', '')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <Database size={14} className="mr-2 text-slate-400" />
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {org.collection_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${org.status === 'active' ? 'bg-green-100 text-green-800' : 
                          org.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}
                      `}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-2 text-slate-400" />
                        {new Date(org.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/org/${encodeURIComponent(org.organization_name)}`}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <MoreVertical size={20} className="inline-block" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No organizations found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;