import { 
  Organization, 
  OrganizationCreateData, 
  OrganizationUpdateData, 
  OrganizationDeleteData, 
  AuthResponse,
  OrgStats
} from '../types';

const USE_MOCK = true; // Toggle this to false to use the real Python backend
const API_BASE_URL = 'http://localhost:8000/api/v1';

// --- Mock Data Helper ---
const STORAGE_KEYS = {
  ORGS: 'om_orgs',
  USERS: 'om_users',
  TOKEN: 'om_token',
  CURRENT_USER: 'om_current_user'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  // --- Auth ---
  async login(email: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay(800);
      const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      // For demo, allow a default admin if none exists
      if (email === 'admin@demo.com' && password === 'password123') {
        const token = 'mock-jwt-token-' + Date.now();
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ email, organization_name: 'Demo Corp' }));
        return { access_token: token, token_type: 'bearer', expires_in: 3600 };
      }

      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) throw new Error('Invalid credentials');
      
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ email: user.email, organization_name: user.organization_name }));
      return { access_token: token, token_type: 'bearer', expires_in: 3600 };
    } else {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
      return data;
    }
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.hash = '/login';
  }

  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  // --- Organizations ---

  private _getMockOrgs(): Organization[] {
    const orgsStr = localStorage.getItem(STORAGE_KEYS.ORGS);
    let orgs: Organization[] = orgsStr ? JSON.parse(orgsStr) : [];
    
    // Seed some data if empty to make the dashboard look good
    if (orgs.length === 0) {
      const now = Date.now();
      const day = 86400000;
      orgs = [
        {
          organization_name: 'Acme Corp',
          collection_name: 'org_acme_corp',
          status: 'active',
          created_at: new Date(now - day * 60).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          organization_name: 'Globex Corporation',
          collection_name: 'org_globex_corporation',
          status: 'active',
          created_at: new Date(now - day * 45).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          organization_name: 'Soylent Corp',
          collection_name: 'org_soylent_corp',
          status: 'suspended',
          created_at: new Date(now - day * 30).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          organization_name: 'Umbrella Corp',
          collection_name: 'org_umbrella_corp',
          status: 'deleted',
          created_at: new Date(now - day * 90).toISOString(),
          updated_at: new Date(now - day * 10).toISOString(),
          deleted_at: new Date(now - day * 10).toISOString()
        },
        {
          organization_name: 'Stark Industries',
          collection_name: 'org_stark_industries',
          status: 'active',
          created_at: new Date(now - day * 15).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          organization_name: 'Cyberdyne Systems',
          collection_name: 'org_cyberdyne_systems',
          status: 'active',
          created_at: new Date(now - day * 5).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));
    }
    return orgs;
  }

  async listOrganizations(): Promise<Organization[]> {
    if (USE_MOCK) {
      await delay(600);
      const orgs = this._getMockOrgs();
      // The backend API typically filters out deleted orgs for the list view
      return orgs.filter(o => o.status !== 'deleted'); 
    } else {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const res = await fetch(`${API_BASE_URL}/org/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch organizations');
      const data = await res.json();
      return data.data;
    }
  }

  async getDashboardStats(): Promise<OrgStats> {
    if (USE_MOCK) {
      await delay(400);
      const orgs = this._getMockOrgs();
      
      const total = orgs.length;
      const active = orgs.filter(o => o.status === 'active').length;
      const deleted = orgs.filter(o => o.status === 'deleted').length;

      // Calculate growth (cumulative count over time)
      // Sort by created_at
      const sortedByDate = [...orgs].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const growth = sortedByDate.map((org, index) => ({
        date: org.created_at,
        count: index + 1
      }));

      return {
        total,
        active,
        deleted,
        growth
      };
    } else {
      // For real backend, we'd assume a dedicated endpoint exists or we fetch list and calculate locally.
      // Since the provided backend code only returns active orgs in list, 
      // we'll mock this part even for "real" mode in this demo context, 
      // or simplisticly call the list endpoint.
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const res = await fetch(`${API_BASE_URL}/org/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        const orgs: Organization[] = data.data;
        
        // Note: Real backend currently doesn't return deleted orgs, so this is an approximation
        return {
          total: orgs.length,
          active: orgs.filter(o => o.status === 'active').length,
          deleted: 0, 
          growth: orgs.map((o, i) => ({ date: o.created_at, count: i + 1 }))
        };
      } catch (e) {
        return { total: 0, active: 0, deleted: 0, growth: [] };
      }
    }
  }

  async getOrganization(name: string): Promise<Organization> {
    if (USE_MOCK) {
      await delay(400);
      const orgs = this._getMockOrgs();
      const org = orgs.find(o => o.organization_name === name);
      if (!org) throw new Error('Organization not found');
      return org;
    } else {
      const res = await fetch(`${API_BASE_URL}/org/get?organization_name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('Organization not found');
      return await res.json();
    }
  }

  async createOrganization(data: OrganizationCreateData): Promise<any> {
    if (USE_MOCK) {
      await delay(1000);
      const orgs = this._getMockOrgs();
      
      if (orgs.some(o => o.organization_name === data.organization_name)) {
        throw new Error('Organization name already exists');
      }

      const newOrg: Organization = {
        organization_name: data.organization_name,
        collection_name: `org_${data.organization_name.toLowerCase().replace(/\s+/g, '_')}`,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      orgs.push(newOrg);
      localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));

      // Store user for auth
      const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersStr ? JSON.parse(usersStr) : [];
      users.push({
        email: data.email,
        password: data.password,
        organization_name: data.organization_name
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      return { success: true, data: newOrg };
    } else {
      const res = await fetch(`${API_BASE_URL}/org/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create organization');
      }
      return await res.json();
    }
  }

  async updateOrganization(data: OrganizationUpdateData): Promise<any> {
    if (USE_MOCK) {
      await delay(1000);
      // Verify credentials (simple check against mock users)
      const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersStr ? JSON.parse(usersStr) : [];
      const user = users.find((u: any) => u.email === data.email && u.password === data.password);
      
      // Also allow the demo admin
      const isDemo = data.email === 'admin@demo.com' && data.password === 'password123';

      if (!user && !isDemo) throw new Error('Invalid admin credentials for update');

      const orgs = this._getMockOrgs();
      const orgIndex = orgs.findIndex(o => o.organization_name === data.old_organization_name);
      
      if (orgIndex === -1) throw new Error('Organization not found');

      orgs[orgIndex] = {
        ...orgs[orgIndex],
        organization_name: data.new_organization_name,
        collection_name: `org_${data.new_organization_name.toLowerCase().replace(/\s+/g, '_')}`,
        updated_at: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));
      return { success: true };
    } else {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const res = await fetch(`${API_BASE_URL}/org/update`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update organization');
      }
      return await res.json();
    }
  }

  async deleteOrganization(data: OrganizationDeleteData): Promise<any> {
    if (USE_MOCK) {
      await delay(1000);
      // Verify credentials
      const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersStr ? JSON.parse(usersStr) : [];
      const user = users.find((u: any) => u.email === data.email && u.password === data.password);
      const isDemo = data.email === 'admin@demo.com' && data.password === 'password123';

      if (!user && !isDemo) throw new Error('Invalid admin credentials for deletion');

      const orgs = this._getMockOrgs();
      const orgIndex = orgs.findIndex(o => o.organization_name === data.organization_name);
      
      if (orgIndex === -1) throw new Error('Organization not found');

      orgs[orgIndex].status = 'deleted';
      orgs[orgIndex].deleted_at = new Date().toISOString();

      localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));
      return { success: true };
    } else {
      const res = await fetch(`${API_BASE_URL}/org/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete organization');
      }
      return await res.json();
    }
  }
}

export const api = new ApiService();