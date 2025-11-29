const API_BASE = import.meta.env.VITE_API_BASE || 'https://bbesoft.mbanirashop.com';

async function request(path: string, options?: RequestInit) {
  // Get auth token from localStorage
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('maisha_token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}/api/${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function mapMemberFromServer(m: any) {
  return {
    id: String(m.id),
    fullName: `${m.first_name} ${m.last_name}`.trim(),
    firstName: m.first_name,
    lastName: m.last_name,
    birthDate: m.birth_date ? new Date(m.birth_date) : undefined,
    genderCode: m.gender,
    gender: m.gender === 'MALE' ? 'Male' : m.gender === 'FEMALE' ? 'Female' : 'Other',
    isActive: !!m.is_active,
    nationalId: m.national_id,
    phone: m.phone,
    groupId: String(m.group_id),
    createdAt: m.created_at ? new Date(m.created_at) : new Date(),
  };
}

function mapMemberToServer(payload: any) {
  return {
    first_name: payload.firstName,
    last_name: payload.lastName,
    birth_date: payload.birthDate,
    gender: payload.genderCode,
    is_active: payload.isActive,
    national_id: payload.nationalId,
    phone: payload.phone,
    group_id: payload.groupId,
  };
}

function mapGroupFromServer(g: any) {
  return {
    id: String(g.id),
    name: g.name,
    description: g.description || '',
    createdBy: g.created_by,
    createdAt: g.created_at ? new Date(g.created_at) : new Date(),
    memberCount: 0,
  };
}

export const api = {
  // Auth APIs
  async login(email: string, password: string) {
    const data = await request('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data;
  },
  async register(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    group_id?: number;
  }) {
    const data = await request('auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },
  async getMe() {
    const data = await request('auth/me');
    return data;
  },
  async getGroups() {
    const data = await request('groups');
    return Array.isArray(data) ? data.map(mapGroupFromServer) : [];
  },
  async createGroup(payload: { name: string; description?: string; createdBy: string }) {
    const body = { name: payload.name, description: payload.description, created_by: payload.createdBy };
    const g = await request('groups', { method: 'POST', body: JSON.stringify(body) });
    return mapGroupFromServer(g);
  },
  async deleteGroup(id: string) {
    await request(`groups/${id}`, { method: 'DELETE' });
  },
  async getMembers(groupId?: string) {
    const path = groupId ? `members?group_id=${groupId}` : 'members';
    const data = await request(path);
    return Array.isArray(data) ? data.map(mapMemberFromServer) : [];
  },
  async addMember(payload: any) {
    const body = mapMemberToServer(payload);
    const m = await request('members', { method: 'POST', body: JSON.stringify(body) });
    return mapMemberFromServer(m);
  },
  async updateMember(id: string, payload: any) {
    const body = mapMemberToServer(payload);
    const m = await request(`members/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    return mapMemberFromServer(m);
  },
  async getCustomerInfo(phone: string) {
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('mopay_token')) || (import.meta.env as any).VITE_MOPAY_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers['X-Mopay-Token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    const data = await request(`customer-info?phone=${encodeURIComponent(phone)}` , {
      headers: Object.keys(headers).length ? headers : undefined,
    });
    if (!data) return null;
    return {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      birthDate: data.birthDate || '',
      gender: data.gender || 'OTHER',
      isActive: data.isActive ?? true,
    } as {
      firstName: string;
      lastName: string;
      birthDate: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      isActive: boolean;
    };
  },
  async initiatePayment(payload: {
    amount: number;
    currency: string;
    phone: string;
    payment_mode: string;
    message?: string;
    callback_url?: string;
    transfers?: Array<{
      amount: number;
      phone: string;
      message?: string;
    }>;
  }) {
    const data = await request('payments/initiate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },
  async checkPaymentStatus(transactionId: string) {
    const data = await request(`payments/check-status/${transactionId}`);
    return data;
  },
  async getTransactions() {
    const data = await request('payments/transactions');
    return data;
  },
  async getTransaction(transactionId: string) {
    const data = await request(`payments/transactions/${transactionId}`);
    return data;
  },
  // Wallet APIs
  async getWallet(memberId: number) {
    const data = await request(`wallets/member/${memberId}`);
    return data;
  },
  async getGroupWallets(groupId: number) {
    const data = await request(`wallets/group/${groupId}`);
    return data;
  },
  async walletTopup(payload: {
    member_id: number;
    amount: number;
    description?: string;
    source?: string;
    reference?: string;
    notes?: string;
    created_by: string;
    initiated_by?: string;
  }) {
    const data = await request('wallets/topup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },
  async walletCashout(payload: {
    member_id: number;
    amount: number;
    description?: string;
    method?: string;
    reference?: string;
    notes?: string;
    created_by: string;
    user_role?: string;
    initiated_by?: string;
  }) {
    const data = await request('wallets/cashout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },
  async getWalletTransactions(memberId: number) {
    const data = await request(`wallets/transactions/${memberId}`);
    return data;
  },
  // Withdrawal requests
  async createWithdrawalRequest(payload: {
    member_id: number;
    amount: number;
    phone: string;
    notes?: string;
  }) {
    const data = await request('withdrawals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },
  async getWithdrawalRequests(groupId: number) {
    const data = await request(`withdrawals/group/${groupId}`);
    return data;
  },
  // Monthly deductions
  async getMonthlyDeductions(groupId: number) {
    const data = await request(`deductions/group/${groupId}`);
    return data;
  },
  async createMonthlyDeduction(payload: {
    group_id: number;
    name: string;
    amount: number;
    account_number: string;
    day_of_month: number;
    created_by: string;
  }) {
    const data = await request('deductions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },
  async updateMonthlyDeduction(id: number, payload: any) {
    const data = await request(`deductions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  },
  async deleteMonthlyDeduction(id: number) {
    await request(`deductions/${id}`, {
      method: 'DELETE',
    });
  },
  // Withdrawal approval
  async approveWithdrawal(id: number, approved_by: string) {
    const data = await request(`withdrawals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved_by }),
    });
    return data;
  },
  async rejectWithdrawal(id: number, payload: { approved_by: string; notes?: string }) {
    const data = await request(`withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  },
  // Reports
  async getSystemReport() {
    const data = await request('reports/system');
    return data;
  },
  async getGroupReport(groupId: number) {
    const data = await request(`reports/group/${groupId}`);
    return data;
  },
  async getMemberReport(memberId: number) {
    const data = await request(`reports/member/${memberId}`);
    return data;
  },
  async getMyReport() {
    const data = await request('reports/my');
    return data;
  },
  async getAuditLog() {
    const data = await request('reports/audit');
    return data;
  },
  // Group Policy APIs
  async getGroupPolicy(groupId: number) {
    const data = await request(`group-policy/${groupId}`);
    return data;
  },
  async updateGroupPolicy(groupId: number, payload: {
    allow_group_user_cashout?: boolean;
    allow_member_withdrawal?: boolean;
    max_cashout_amount?: number;
    max_withdrawal_amount?: number;
    require_approval_for_withdrawal?: boolean;
  }) {
    const data = await request(`group-policy/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  },
  // Wallet Report APIs
  async getTopUpReport(filters?: {
    group_id?: number;
    member_id?: number;
    start_date?: string;
    end_date?: string;
    initiated_by?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const data = await request(`wallet-reports/topup?${params.toString()}`);
    return data;
  },
  async getCashOutReport(filters?: {
    group_id?: number;
    member_id?: number;
    start_date?: string;
    end_date?: string;
    initiated_by?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const data = await request(`wallet-reports/cashout?${params.toString()}`);
    return data;
  },
  async getGroupWalletSummary(groupId: number) {
    const data = await request(`wallet-reports/group-summary/${groupId}`);
    return data;
  },
  async getMemberStatement(memberId: number, filters?: {
    start_date?: string;
    end_date?: string;
    transaction_type?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    const data = await request(`wallet-reports/member-statement/${memberId}?${params.toString()}`);
    return data;
  },
};