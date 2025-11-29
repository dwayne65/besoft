import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface MonthlyDeduction {
  id: number;
  group_id: number;
  name: string;
  amount: number;
  account_number: string;
  day_of_month: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export default function MonthlyDeductions() {
  const [deductions, setDeductions] = useState<MonthlyDeduction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    account_number: '',
    day_of_month: '1',
  });

  useEffect(() => {
    loadDeductions();
  }, []);

  const loadDeductions = async () => {
    try {
      setIsLoading(true);
      // For now, load deductions for group 1 - this should be dynamic based on user's group
      const data = await api.getMonthlyDeductions(1);
      setDeductions(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load monthly deductions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || !formData.account_number) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      if (isEditing && editingId) {
        await api.updateMonthlyDeduction(editingId, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          account_number: formData.account_number,
          day_of_month: parseInt(formData.day_of_month),
        });

        toast({
          title: 'Success',
          description: 'Monthly deduction updated successfully',
        });
      } else {
        await api.createMonthlyDeduction({
          group_id: 1, // Should be dynamic based on user's group
          name: formData.name,
          amount: parseFloat(formData.amount),
          account_number: formData.account_number,
          day_of_month: parseInt(formData.day_of_month),
          created_by: 'Admin', // Should be current user
        });

        toast({
          title: 'Success',
          description: 'Monthly deduction created successfully',
        });
      }

      resetForm();
      loadDeductions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save monthly deduction',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (deduction: MonthlyDeduction) => {
    setIsEditing(true);
    setEditingId(deduction.id);
    setFormData({
      name: deduction.name,
      amount: deduction.amount.toString(),
      account_number: deduction.account_number,
      day_of_month: deduction.day_of_month.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this monthly deduction?')) {
      return;
    }

    try {
      await api.deleteMonthlyDeduction(id);
      toast({
        title: 'Success',
        description: 'Monthly deduction deleted successfully',
      });
      loadDeductions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete monthly deduction',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (deduction: MonthlyDeduction) => {
    try {
      await api.updateMonthlyDeduction(deduction.id, {
        is_active: !deduction.is_active,
      });

      toast({
        title: 'Success',
        description: `Monthly deduction ${!deduction.is_active ? 'activated' : 'deactivated'}`,
      });

      loadDeductions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      account_number: '',
      day_of_month: '1',
    });
    setIsEditing(false);
    setEditingId(null);
    setIsDialogOpen(false);
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Monthly Deductions</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Set up automatic monthly deductions for your group
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Deduction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Active Deductions</CardTitle>
          <CardDescription className="text-sm">
            These deductions will be automatically processed each month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deductions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No monthly deductions configured yet
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Account Number</TableHead>
                    <TableHead className="whitespace-nowrap">Day of Month</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Created By</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((deduction) => (
                    <TableRow key={deduction.id}>
                      <TableCell className="font-medium whitespace-nowrap">{deduction.name}</TableCell>
                      <TableCell className="whitespace-nowrap font-semibold">
                        {deduction.amount.toLocaleString()} RWF
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {deduction.account_number}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Day {deduction.day_of_month}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={deduction.is_active}
                            onCheckedChange={() => handleToggleActive(deduction)}
                          />
                          <Badge variant={deduction.is_active ? 'default' : 'secondary'}>
                            {deduction.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{deduction.created_by}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(deduction)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(deduction.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="w-[95vw] max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit' : 'Add'} Monthly Deduction</DialogTitle>
              <DialogDescription>
                Configure automatic monthly deduction settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Deduction Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Savings, Insurance Fee"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (RWF) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Destination account number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="day_of_month">Day of Month (1-31) *</Label>
                <Input
                  id="day_of_month"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day_of_month}
                  onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Deduction will be processed on this day each month
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isEditing ? 'Update' : 'Create'} Deduction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
