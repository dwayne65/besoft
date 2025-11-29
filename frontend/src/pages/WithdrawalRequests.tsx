import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { DollarSign, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface WithdrawalRequest {
  id: number;
  member_id: number;
  wallet_id: number;
  amount: number;
  phone: string;
  status: string;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  mopay_transaction_id: string | null;
  created_at: string;
  member?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export default function WithdrawalRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      // Load requests based on user's group
      const groupId = user?.group_id || 1;
      const data = await api.getWithdrawalRequests(groupId);
      setRequests(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load withdrawal requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!user) return;
    
    setProcessing(id);
    try {
      await api.approveWithdrawal(id, user.email);
      toast({
        title: 'Success',
        description: 'Withdrawal approved successfully',
      });
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!user) return;
    
    setProcessing(id);
    try {
      await api.rejectWithdrawal(id, { approved_by: user.email, notes: 'Rejected by admin' });
      toast({
        title: 'Success',
        description: 'Withdrawal rejected',
      });
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject withdrawal',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Withdrawal Requests</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Manage member withdrawal requests
          </p>
        </div>
        <Button onClick={loadRequests} variant="outline" size="sm" className="w-full sm:w-auto">
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">All Withdrawal Requests</CardTitle>
          <CardDescription className="text-sm">
            Review and process member withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No withdrawal requests found
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Member</TableHead>
                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Requested</TableHead>
                    {user?.role && ['super_admin', 'group_admin'].includes(user.role) && (
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {request.member?.first_name} {request.member?.last_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {request.phone}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {request.amount.toLocaleString()} RWF
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(request.created_at).toLocaleString()}
                      </TableCell>
                      {user?.role && ['super_admin', 'group_admin'].includes(user.role) && (
                        <TableCell className="whitespace-nowrap">
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(request.id)}
                                disabled={processing === request.id}
                              >
                                {processing === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                disabled={processing === request.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {requests.filter((r) => r.status === 'pending').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Approved</p>
              <p className="text-2xl font-bold text-blue-600">
                {requests.filter((r) => r.status === 'approved').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter((r) => r.status === 'completed').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {requests.filter((r) => r.status === 'failed' || r.status === 'rejected').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
