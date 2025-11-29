import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Send, RefreshCcw, Eye, EyeOff, CreditCard, TrendingUp, History, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface WalletData {
  id: number;
  balance: number;
  currency: string;
  is_active: boolean;
  member_id: number;
}

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  source?: string;
  method?: string;
  reference?: string;
  status: string;
  direction?: string;
  initiated_by?: string;
  created_at: string;
}

interface MemberData {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  group: {
    id: number;
    name: string;
  };
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [member, setMember] = useState<MemberData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');

  useEffect(() => {
    loadMemberData();
  }, [user]);

  const loadMemberData = async () => {
    try {
      setIsLoading(true);
      
      // Use the new /reports/my endpoint to get current member's data
      const data = await api.getMyReport();
      
      setMember(data.member);
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
    } catch (error: any) {
      console.error('Failed to load member data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load member data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) return;

    try {
      await api.createWithdrawalRequest({
        member_id: member.id,
        amount: parseFloat(withdrawAmount),
        phone: withdrawPhone || member.phone,
      });

      toast({
        title: 'Success',
        description: 'Withdrawal request submitted successfully',
      });

      setWithdrawAmount('');
      setWithdrawPhone('');
      setIsWithdrawDialogOpen(false);
      loadMemberData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit withdrawal request',
        variant: 'destructive',
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case 'cashout':
      case 'withdrawal':
      case 'mobile_money_transfer':
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'deduction':
      case 'monthly_deduction':
        return <ArrowUpCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Send className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-blue-100">
          Member - {member?.group?.name || user?.group?.name || 'Your Group'}
        </p>
        <p className="text-sm text-blue-200 mt-1">
          Manage your wallet and view your transactions
        </p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-blue-100" />
                <p className="text-blue-100 text-sm">Available Balance</p>
              </div>
              <div className="flex items-center gap-3">
                {showBalance ? (
                  <h2 className="text-4xl md:text-5xl font-bold">
                    {wallet?.balance?.toLocaleString() || '0'} {wallet?.currency || 'RWF'}
                  </h2>
                ) : (
                  <h2 className="text-4xl md:text-5xl font-bold">••••••</h2>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:bg-white/20"
                >
                  {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
                <span className={`h-2 w-2 rounded-full ${wallet?.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                {wallet?.is_active ? 'Active Wallet' : 'Inactive Wallet'}
              </div>
            </div>
            <Wallet className="h-20 w-20 opacity-20" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={loadMemberData}
              className="w-full"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <form onSubmit={handleWithdrawRequest}>
                  <DialogHeader>
                    <DialogTitle>Request Mobile Money Withdrawal</DialogTitle>
                    <DialogDescription>Send money to your mobile money account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <Input
                        id="phone"
                        placeholder={member?.phone || '250XXXXXXXXX'}
                        value={withdrawPhone}
                        onChange={(e) => setWithdrawPhone(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: {member?.phone}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (RWF)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        max={wallet?.balance || 0}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {wallet?.balance?.toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={!wallet || wallet.balance <= 0}>
                      Submit Request
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Total Top-ups</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {transactions
                .filter(t => t.transaction_type === 'topup')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-muted-foreground">Withdrawals</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {transactions
                .filter(t => ['cashout', 'withdrawal', 'mobile_money_transfer'].includes(t.transaction_type))
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-muted-foreground">Deductions</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {transactions
                .filter(t => ['deduction', 'monthly_deduction'].includes(t.transaction_type))
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <History className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>All your wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your transactions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getTransactionIcon(txn.transaction_type)}
                    <div className="flex-1">
                      <p className="font-medium">{formatTransactionType(txn.transaction_type)}</p>
                      <p className="text-sm text-muted-foreground">{txn.description}</p>
                      {txn.reference && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          Ref: {txn.reference}
                        </p>
                      )}
                      {txn.initiated_by && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {txn.initiated_by}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-semibold text-lg ${
                      txn.direction === 'credit' || txn.transaction_type === 'topup' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {txn.direction === 'credit' || txn.transaction_type === 'topup' ? '+' : '-'}
                      {txn.amount.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(txn.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(txn.status)}
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 10 of {transactions.length} transactions
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
