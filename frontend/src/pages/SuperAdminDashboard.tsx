import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Users, Wallet, DollarSign, Building2, TrendingUp, ArrowUpRight } from 'lucide-react';

interface DashboardStats {
  totalGroups: number;
  totalMembers: number;
  totalWalletBalance: number;
  pendingWithdrawals: number;
  activeDeductions: number;
  recentActivity: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
    totalMembers: 0,
    totalWalletBalance: 0,
    pendingWithdrawals: 0,
    activeDeductions: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [groups, members] = await Promise.all([
        api.getGroups(),
        api.getMembers(),
      ]);

      setStats({
        totalGroups: groups.length,
        totalMembers: members.length,
        totalWalletBalance: 0, // Will be calculated from wallets
        pendingWithdrawals: 0,
        activeDeductions: 0,
        recentActivity: 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-blue-100">Super Administrator Dashboard - Full System Access</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Groups
            </CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalGroups}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all system
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Wallet Balance
            </CardTitle>
            <Wallet className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalWalletBalance.toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All wallets combined
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Withdrawals
            </CardTitle>
            <DollarSign className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingWithdrawals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deductions
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeDeductions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly deductions
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </CardTitle>
            <ArrowUpRight className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="/groups"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <Building2 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="font-medium">Manage Groups</p>
          </a>
          <a
            href="/members"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="font-medium">Manage Members</p>
          </a>
          <a
            href="/withdrawals"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="font-medium">Withdrawals</p>
          </a>
          <a
            href="/reports"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <p className="font-medium">View Reports</p>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
