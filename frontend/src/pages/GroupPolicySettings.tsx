import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Shield, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface GroupPolicyData {
  id: number;
  group_id: number;
  allow_group_user_cashout: boolean;
  allow_member_withdrawal: boolean;
  max_cashout_amount: number | null;
  max_withdrawal_amount: number | null;
  require_approval_for_withdrawal: boolean;
}

export default function GroupPolicySettings() {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<GroupPolicyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.group_id) {
      loadPolicy();
    }
  }, [user]);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const data = await api.getGroupPolicy(user!.group_id!);
      setPolicy(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load group policy',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!policy || !user?.group_id) return;

    try {
      setSaving(true);
      await api.updateGroupPolicy(user.group_id, {
        allow_group_user_cashout: policy.allow_group_user_cashout,
        allow_member_withdrawal: policy.allow_member_withdrawal,
        max_cashout_amount: policy.max_cashout_amount || undefined,
        max_withdrawal_amount: policy.max_withdrawal_amount || undefined,
        require_approval_for_withdrawal: policy.require_approval_for_withdrawal,
      });

      toast({
        title: 'Success',
        description: 'Group policy updated successfully',
      });

      loadPolicy();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update group policy',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user?.group_id || user.role === 'member') {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Access denied. Only group admins can view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Group Policy Settings
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Configure permissions and limits for your group
          </p>
        </div>
      </div>

      {policy && (
        <Card>
          <CardHeader>
            <CardTitle>Access Control & Limits</CardTitle>
            <CardDescription>
              Manage what actions group users and members can perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Group User Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Group User (Staff) Permissions</h3>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-cashout">Allow Cash-out</Label>
                  <p className="text-sm text-muted-foreground">
                    Group users can perform cash-out from member wallets
                  </p>
                </div>
                <Switch
                  id="allow-cashout"
                  checked={policy.allow_group_user_cashout}
                  onCheckedChange={(checked) =>
                    setPolicy({ ...policy, allow_group_user_cashout: checked })
                  }
                />
              </div>

              {policy.allow_group_user_cashout && (
                <div className="ml-4 p-4 border rounded-lg bg-muted/30">
                  <Label htmlFor="max-cashout">Maximum Cash-out Amount (Optional)</Label>
                  <Input
                    id="max-cashout"
                    type="number"
                    placeholder="No limit"
                    value={policy.max_cashout_amount || ''}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        max_cashout_amount: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for no limit
                  </p>
                </div>
              )}
            </div>

            {/* Member Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Member Permissions</h3>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-withdrawal">Allow Withdrawal Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Members can request mobile money withdrawals
                  </p>
                </div>
                <Switch
                  id="allow-withdrawal"
                  checked={policy.allow_member_withdrawal}
                  onCheckedChange={(checked) =>
                    setPolicy({ ...policy, allow_member_withdrawal: checked })
                  }
                />
              </div>

              {policy.allow_member_withdrawal && (
                <>
                  <div className="ml-4 p-4 border rounded-lg bg-muted/30">
                    <Label htmlFor="max-withdrawal">Maximum Withdrawal Amount (Optional)</Label>
                    <Input
                      id="max-withdrawal"
                      type="number"
                      placeholder="No limit"
                      value={policy.max_withdrawal_amount || ''}
                      onChange={(e) =>
                        setPolicy({
                          ...policy,
                          max_withdrawal_amount: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for no limit
                    </p>
                  </div>

                  <div className="ml-4 flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="require-approval">Require Admin Approval</Label>
                      <p className="text-sm text-muted-foreground">
                        All withdrawal requests must be approved by an admin
                      </p>
                    </div>
                    <Switch
                      id="require-approval"
                      checked={policy.require_approval_for_withdrawal}
                      onCheckedChange={(checked) =>
                        setPolicy({ ...policy, require_approval_for_withdrawal: checked })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Policy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
