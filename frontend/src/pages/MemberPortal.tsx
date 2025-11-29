import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Send, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface WalletData {
  balance: number;
  currency: string;
  is_active: boolean;
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
  created_at: string;
}

interface WithdrawalRequest {
  id: number;
  amount: number;
  phone: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function MemberPortal() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [memberData, setMemberData] = useState<any>(null);

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      setIsLoading(true);
      const report = await api.getMyReport();
      
      setMemberData(report.member);
      setWallet(report.wallet);
      setTransactions(report.transactions || []);
      setWithdrawalRequests(report.withdrawal_requests || []);
    } catch (error: any) {
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

    if (!memberData) return;

    try {
      await api.createWithdrawalRequest({
        member_id: memberData.id,
        amount: parseFloat(withdrawAmount),
        phone: withdrawPhone || memberData.phone,
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
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case 'deduction':
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
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-blue-100">Member - {user?.group?.name || 'Your Group'}</p>
        <p className="text-sm text-blue-200 mt-1">Manage your wallet and view transactions</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">Available Balance</p>
              <div className="flex items-center gap-3">
                {showBalance ? (
                  <h2 className="text-4xl font-bold">
                    {wallet?.balance.toLocaleString() || '0'} {wallet?.currency || 'RWF'}
                  </h2>
                ) : (
                  <h2 className="text-4xl font-bold">••••••</h2>
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
            </div>
            <Wallet className="h-16 w-16 opacity-20" />
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={loadMemberData}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <form onSubmit={handleWithdrawRequest}>
                  <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                    <DialogDescription>Send money to your mobile money account</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <Input
                        id="phone"
                        placeholder={memberData?.phone || '250XXXXXXXXX'}
                        value={withdrawPhone}
                        onChange={(e) => setWithdrawPhone(e.target.value)}
                      />
                      {memberData?.phone && (
                        <p className="text-xs text-muted-foreground">
                          Default: {memberData.phone}
                        </p>
                      )}
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
                        Available: {wallet?.balance.toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Submit Request</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Top-ups</p>
            <p className="text-2xl font-bold text-green-600">
              {transactions
                .filter(t => t.transaction_type === 'topup')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Withdrawals</p>
            <p className="text-2xl font-bold text-red-600">
              {transactions
                .filter(t => ['cashout', 'withdrawal'].includes(t.transaction_type))
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Deductions</p>
            <p className="text-2xl font-bold text-orange-600">
              {transactions
                .filter(t => t.transaction_type === 'deduction')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Requests */}
      {withdrawalRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Requests</CardTitle>
            <CardDescription>Your mobile money withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-semibold">{req.amount.toLocaleString()} RWF</TableCell>
                    <TableCell className="font-mono text-sm">{req.phone}</TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-sm">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All your wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(txn.transaction_type)}
                    <div>
                      <p className="font-medium capitalize">{txn.transaction_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{txn.description}</p>
                      {txn.reference && (
                        <p className="text-xs text-muted-foreground font-mono">Ref: {txn.reference}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      txn.transaction_type === 'topup' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {txn.transaction_type === 'topup' ? '+' : '-'}{txn.amount.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                    {getStatusBadge(txn.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
