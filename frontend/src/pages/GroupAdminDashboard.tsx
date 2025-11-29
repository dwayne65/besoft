import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Users, Wallet, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface DashboardStats {
  groupMembers: number;
  totalWalletBalance: number;
  pendingWithdrawals: number;
  activeDeductions: number;
  monthlyCollection: number;
}

export default function GroupAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    groupMembers: 0,
    totalWalletBalance: 0,
    pendingWithdrawals: 0,
    activeDeductions: 0,
    monthlyCollection: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.group_id) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      if (!user?.group_id) return;

      const [members, wallets, withdrawals, deductions] = await Promise.all([
        api.getMembers(String(user.group_id)),
        api.getGroupWallets(user.group_id),
        api.getWithdrawalRequests(user.group_id),
        api.getMonthlyDeductions(user.group_id),
      ]);

      const totalBalance = wallets.reduce((sum: number, w: any) => sum + parseFloat(w.balance || 0), 0);
      const pending = withdrawals.filter((w: any) => w.status === 'pending').length;
      const active = deductions.filter((d: any) => d.is_active).length;

      setStats({
        groupMembers: members.length,
        totalWalletBalance: totalBalance,
        pendingWithdrawals: pending,
        activeDeductions: active,
        monthlyCollection: 0,
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
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-green-100">
          Group Administrator - {user?.group?.name || 'Your Group'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Group Members
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.groupMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active in your group
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
              Group total
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
              Awaiting your approval
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deductions
            </CardTitle>
            <Calendar className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeDeductions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly rules
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Collection
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.monthlyCollection.toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your group</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="/members"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="font-medium">Manage Members</p>
          </a>
          <a
            href="/wallets"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <Wallet className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="font-medium">Wallets</p>
          </a>
          <a
            href="/withdrawals"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="font-medium">Withdrawals</p>
          </a>
          <a
            href="/deductions"
            className="p-4 border rounded-lg hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <Calendar className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <p className="font-medium">Deductions</p>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
