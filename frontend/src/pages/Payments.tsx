import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Loader2, Plus, Trash2, Search, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Transfer {
  amount: string;
  phone: string;
  message: string;
}

interface PaymentStatus {
  transactionId: string;
  phone: string;
  amount: number;
  status: number;
  transfers?: Array<{
    transactionId: string;
    amount: number;
    phone: string;
    status: number;
  }>;
}

interface TrackedTransaction {
  id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  phone: number;
  payment_mode: string;
  message: string;
  status: number;
  created_at: string;
  transfers?: any[];
}

export default function Payments() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [statusResult, setStatusResult] = useState<PaymentStatus | null>(null);
  const [searchTransactionId, setSearchTransactionId] = useState('');
  const [trackedTransactions, setTrackedTransactions] = useState<TrackedTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'RWF',
    phone: '',
    payment_mode: 'MOBILE',
    message: '',
    callback_url: '',
  });

  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const result = await api.getTransactions();
      console.log('Fetched transactions:', result);
      setTrackedTransactions(result);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addTransfer = () => {
    setTransfers([...transfers, { amount: '', phone: '', message: '' }]);
  };

  const removeTransfer = (index: number) => {
    setTransfers(transfers.filter((_, i) => i !== index));
  };

  const handleTransferChange = (index: number, field: keyof Transfer, value: string) => {
    const updated = [...transfers];
    updated[index][field] = value;
    setTransfers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTransactionId('');
    setStatusResult(null);

    try {
      const payload: any = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        phone: formData.phone,
        payment_mode: formData.payment_mode,
        message: formData.message || 'Payment transaction',
        callback_url: formData.callback_url || '',
      };

      if (transfers.length > 0) {
        payload.transfers = transfers
          .filter((t) => t.amount && t.phone)
          .map((t) => ({
            amount: parseFloat(t.amount),
            phone: t.phone,
            message: t.message || 'Transfer transaction',
          }));
      }

      const result = await api.initiatePayment(payload);

      if (result.transactionId) {
        setTransactionId(result.transactionId);
        toast({
          title: 'Payment Initiated',
          description: `Transaction ID: ${result.transactionId}`,
        });
        // Reset form
        setFormData({
          amount: '',
          currency: 'RWF',
          phone: '',
          payment_mode: 'MOBILE',
          message: '',
          callback_url: '',
        });
        setTransfers([]);
        // Refresh tracked transactions
        fetchTransactions();
      } else {
        toast({
          title: 'Payment Failed',
          description: result.error || 'Unable to initiate payment',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!searchTransactionId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a transaction ID',
        variant: 'destructive',
      });
      return;
    }

    setStatusLoading(true);
    setStatusResult(null);

    try {
      const result = await api.checkPaymentStatus(searchTransactionId.trim());
      console.log('Status check result:', result);
      setStatusResult(result);
      toast({
        title: 'Status Retrieved',
        description: `Transaction status: ${getStatusText(result.status)}`,
      });
      // Refresh tracked transactions to show updated status
      fetchTransactions();
    } catch (error: any) {
      console.error('Status check error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to check payment status',
        variant: 'destructive',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 200:
        return 'Success';
      case 201:
        return 'Pending';
      case 202:
        return 'Processing';
      case 400:
        return 'Failed';
      case 404:
        return 'Not Found';
      case 500:
        return 'Error';
      default:
        return `Status ${status}`;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 200:
        return 'text-green-600';
      case 201:
        return 'text-yellow-600';
      case 202:
        return 'text-blue-600';
      case 400:
      case 404:
      case 500:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Payments</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Initiate Payment</CardTitle>
            <CardDescription>Create a new payment transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  name="currency"
                  value={formData.currency}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RWF">RWF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="250XXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="payment_mode">Payment Mode *</Label>
                <Select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onValueChange={(value) => handleSelectChange('payment_mode', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOBILE">Mobile</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Payment description"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="callback_url">Callback URL</Label>
                <Input
                  id="callback_url"
                  name="callback_url"
                  type="url"
                  value={formData.callback_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/callback"
                />
              </div>

              {/* Transfers Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Transfers (Optional)</Label>
                  <Button type="button" onClick={addTransfer} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Transfer
                  </Button>
                </div>

                {transfers.map((transfer, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Transfer #{index + 1}</span>
                        <Button
                          type="button"
                          onClick={() => removeTransfer(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Amount"
                        value={transfer.amount}
                        onChange={(e) => handleTransferChange(index, 'amount', e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="Phone (250XXXXXXXXX)"
                        value={transfer.phone}
                        onChange={(e) => handleTransferChange(index, 'phone', e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="Message (optional)"
                        value={transfer.message}
                        onChange={(e) => handleTransferChange(index, 'message', e.target.value)}
                      />
                    </div>
                  </Card>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Initiate Payment
              </Button>

              {transactionId && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800">
                    Transaction ID: <span className="font-mono">{transactionId}</span>
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Check Status */}
        <Card>
          <CardHeader>
            <CardTitle>Check Transaction Status</CardTitle>
            <CardDescription>View the status of your payment transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Transaction ID"
                value={searchTransactionId}
                onChange={(e) => setSearchTransactionId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkStatus()}
              />
              <Button onClick={checkStatus} disabled={statusLoading}>
                {statusLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {statusResult && (
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Transaction ID</p>
                        <p className="text-sm font-mono font-semibold text-gray-900">{statusResult.transactionId}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusResult.status === 200 ? 'bg-green-100 text-green-800' :
                            statusResult.status === 201 ? 'bg-yellow-100 text-yellow-800' :
                            statusResult.status === 202 ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getStatusText(statusResult.status)}
                          </span>
                          <span className="text-xs text-gray-500">({statusResult.status})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</p>
                        <p className="text-sm font-semibold text-gray-900">{statusResult.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                        <p className="text-sm font-bold text-gray-900">{statusResult.amount.toLocaleString()} RWF</p>
                      </div>
                    </div>

                    {statusResult.transfers && statusResult.transfers.length > 0 ? (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transfers</p>
                        <p className="text-sm text-gray-700">{statusResult.transfers.length} transfer(s) included</p>
                      </div>
                    ) : (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Transfers</p>
                        <p className="text-sm text-gray-400 italic">No transfers</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {statusResult.transfers && statusResult.transfers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-700">Transfer Details</h3>
                    {statusResult.transfers.map((transfer, index) => (
                      <Card key={index} className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-blue-900">Transfer #{index + 1}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  transfer.status === 200 ? 'bg-green-100 text-green-800' :
                                  transfer.status === 201 ? 'bg-yellow-100 text-yellow-800' :
                                  transfer.status === 202 ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {getStatusText(transfer.status)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-gray-600">Transaction ID</p>
                              <p className="text-xs font-mono font-semibold text-gray-900">{transfer.transactionId}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-gray-600">Phone</p>
                              <p className="text-xs font-semibold text-gray-900">{transfer.phone}</p>
                            </div>
                            <div className="space-y-0.5 col-span-2">
                              <p className="text-xs text-gray-600">Amount</p>
                              <p className="text-xs font-bold text-gray-900">{transfer.amount.toLocaleString()} RWF</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tracked Transactions */}
      <Card className="mt-4 md:mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg md:text-xl">Transaction History</CardTitle>
              <CardDescription className="text-sm">All tracked payment transactions</CardDescription>
            </div>
            <Button onClick={fetchTransactions} size="sm" variant="outline" disabled={transactionsLoading} className="w-full sm:w-auto">
              {transactionsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : trackedTransactions.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-xs md:text-sm whitespace-nowrap">Transaction ID</th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-xs md:text-sm whitespace-nowrap">Phone</th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-xs md:text-sm whitespace-nowrap">Amount</th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-xs md:text-sm whitespace-nowrap">Status</th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-xs md:text-sm whitespace-nowrap">Mode</th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-xs md:text-sm whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 md:px-4">
                          <span className="font-mono text-xs md:text-sm">{transaction.transaction_id}</span>
                        </td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm whitespace-nowrap">{transaction.phone}</td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm font-semibold whitespace-nowrap">
                          {transaction.amount} {transaction.currency}
                        </td>
                        <td className="py-3 px-2 md:px-4">
                          <span className={`text-xs md:text-sm font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusText(transaction.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm whitespace-nowrap">{transaction.payment_mode}</td>
                        <td className="py-3 px-2 md:px-4 text-xs md:text-sm whitespace-nowrap">
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
