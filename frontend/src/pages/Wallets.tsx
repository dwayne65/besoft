import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Wallet, ArrowUpCircle, ArrowDownCircle, History, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface WalletData {
  id: number;
  member_id: number;
  balance: number;
  currency: string;
  is_active: boolean;
  member?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface WalletTransaction {
  id: number;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  created_by: string;
  created_at: string;
}

export default function Wallets() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isCashoutOpen, setIsCashoutOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('cash');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setIsLoading(true);
      // For now, load wallets for group 1 - this should be dynamic based on user's group
      const data = await api.getGroupWallets(1);
      setWallets(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load wallets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!selectedWallet || !amount || !user) return;

    try {
      setProcessing(true);
      
      // Determine initiated_by based on user role
      let initiatedBy = 'group_admin';
      if (user.role === 'super_admin') initiatedBy = 'super_admin';
      else if (user.role === 'group_user') initiatedBy = 'group_user';
      
      await api.walletTopup({
        member_id: selectedWallet.member_id,
        amount: parseFloat(amount),
        description: description || 'Wallet top-up',
        source: source,
        reference: reference || undefined,
        created_by: user.email,
        initiated_by: initiatedBy,
      });

      toast({
        title: 'Success',
        description: 'Wallet topped up successfully',
      });

      setAmount('');
      setDescription('');
      setSource('cash');
      setReference('');
      setIsTopupOpen(false);
      loadWallets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to top up wallet',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCashout = async () => {
    if (!selectedWallet || !amount || !user) return;

    try {
      setProcessing(true);
      
      // Determine initiated_by based on user role
      let initiatedBy = 'group_admin';
      if (user.role === 'super_admin') initiatedBy = 'super_admin';
      else if (user.role === 'group_user') initiatedBy = 'group_user';
      
      await api.walletCashout({
        member_id: selectedWallet.member_id,
        amount: parseFloat(amount),
        description: description || 'Wallet cash-out',
        method: method,
        reference: reference || undefined,
        created_by: user.email,
        user_role: user.role,
        initiated_by: initiatedBy,
      });

      toast({
        title: 'Success',
        description: 'Cash-out successful',
      });

      setAmount('');
      setDescription('');
      setMethod('cash');
      setReference('');
      setIsCashoutOpen(false);
      loadWallets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process cash-out',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const viewTransactions = async (wallet: WalletData) => {
    try {
      setSelectedWallet(wallet);
      const data = await api.getWalletTransactions(wallet.member_id);
      setTransactions(data);
      setIsTransactionsOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load transactions',
        variant: 'destructive',
      });
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
        return 'text-green-600';
      case 'cashout':
      case 'deduction':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Member Wallets</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Manage member wallet balances and transactions</p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base md:text-lg">
                    {wallet.member?.first_name} {wallet.member?.last_name}
                  </CardTitle>
                </div>
                <Badge variant={wallet.is_active ? 'default' : 'secondary'}>
                  {wallet.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="text-xs">{wallet.member?.phone}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-3 bg-primary/5 rounded-lg">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold text-primary">
                  {wallet.balance.toLocaleString()} {wallet.currency}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedWallet(wallet);
                    setIsTopupOpen(true);
                  }}
                  className="text-xs"
                >
                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                  Top-up
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedWallet(wallet);
                    setIsCashoutOpen(true);
                  }}
                  className="text-xs"
                >
                  <ArrowDownCircle className="h-3 w-3 mr-1" />
                  Cash-out
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewTransactions(wallet)}
                  className="text-xs"
                >
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {wallets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No wallets found</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              Wallets will be created automatically when members are added
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top-up Dialog */}
      <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Top-up Wallet</DialogTitle>
            <DialogDescription>
              Add funds to {selectedWallet?.member?.first_name}'s wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Payment Source *</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction reference (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleTopup} disabled={processing || !amount} className="w-full sm:w-auto">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Top-up Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash-out Dialog */}
      <Dialog open={isCashoutOpen} onOpenChange={setIsCashoutOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Cash-out from Wallet</DialogTitle>
            <DialogDescription>
              Remove funds from {selectedWallet?.member?.first_name}'s wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Current Balance: <strong>{selectedWallet?.balance.toLocaleString()} {selectedWallet?.currency}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashout-amount">Amount *</Label>
              <Input
                id="cashout-amount"
                type="number"
                min="1"
                max={selectedWallet?.balance}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Cash-out Method *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="internal_balancing">Internal Balancing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashout-reference">Reference Number</Label>
              <Input
                id="cashout-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction reference (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashout-description">Description</Label>
              <Input
                id="cashout-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCashout} disabled={processing || !amount} className="w-full sm:w-auto">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Process Cash-out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              Wallet transactions for {selectedWallet?.member?.first_name} {selectedWallet?.member?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Balance Before</TableHead>
                      <TableHead className="whitespace-nowrap">Balance After</TableHead>
                      <TableHead className="whitespace-nowrap">Description</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className={getTransactionColor(txn.transaction_type)}>
                            {txn.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`whitespace-nowrap font-semibold ${getTransactionColor(txn.transaction_type)}`}>
                          {txn.transaction_type === 'topup' ? '+' : '-'}{txn.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{txn.balance_before.toLocaleString()}</TableCell>
                        <TableCell className="whitespace-nowrap font-semibold">{txn.balance_after.toLocaleString()}</TableCell>
                        <TableCell className="max-w-xs truncate">{txn.description}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(txn.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
