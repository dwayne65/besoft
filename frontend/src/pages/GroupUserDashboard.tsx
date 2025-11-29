import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Users, Wallet, TrendingUp, BarChart3, DollarSign, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  groupMembers: number;
  totalWalletBalance: number;
  averageBalance: number;
}

export default function GroupUserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    groupMembers: 0,
    totalWalletBalance: 0,
    averageBalance: 0,
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

      const [members, wallets] = await Promise.all([
        api.getMembers(String(user.group_id)),
        api.getGroupWallets(user.group_id),
      ]);

      const totalBalance = wallets.reduce((sum: number, w: any) => sum + parseFloat(w.balance || 0), 0);
      const avgBalance = wallets.length > 0 ? totalBalance / wallets.length : 0;

      setStats({
        groupMembers: members.length,
        totalWalletBalance: totalBalance,
        averageBalance: avgBalance,
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-purple-100">
          Group Staff - {user?.group?.name || 'Your Group'}
        </p>
        <p className="text-sm text-purple-200 mt-1">
          Manage members, wallets, and transactions for your group
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Group Members
            </CardTitle>
            <Users className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.groupMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In your group
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
              Average Balance
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.averageBalance.toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per member
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/wallets')}>
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5" />
              Top-up Member Wallets
            </CardTitle>
            <CardDescription className="text-green-700">
              Add funds to member wallets in your group
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-orange-200 bg-orange-50 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/wallets')}>
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5" />
              Cash-out from Wallets
            </CardTitle>
            <CardDescription className="text-orange-700">
              Process cash-out requests (if allowed by group policy)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
          <CardDescription>Manage your group members and wallets</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/members')}
          >
            <Users className="h-6 w-6 text-indigo-600" />
            <span className="font-medium">View Members</span>
            <span className="text-xs text-muted-foreground">Members in your group</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/wallets')}
          >
            <Wallet className="h-6 w-6 text-purple-600" />
            <span className="font-medium">Manage Wallets</span>
            <span className="text-xs text-muted-foreground">Top-up & Cash-out</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 flex-col gap-2"
            onClick={() => navigate('/reports')}
          >
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="font-medium">View Reports</span>
            <span className="text-xs text-muted-foreground">Group reports</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
