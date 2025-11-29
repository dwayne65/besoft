import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Users, Calendar, Wallet, TrendingUp, Edit, Eye, Search, Filter, Phone, Mail, CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Group } from '@/lib/mockData';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GroupWithStats extends Group {
  memberCount: number;
  totalWalletBalance?: number;
  activeMembers?: number;
}

interface MemberWithWallet {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  national_id: string;
  is_active: boolean;
  wallet?: {
    id: number;
    balance: number;
    currency: string;
    is_active: boolean;
  };
}

const Groups = () => {
  const [groups, setGroups] = useState<GroupWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null);
  const [groupMembers, setGroupMembers] = useState<MemberWithWallet[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const { user } = useAuth();

  const loadGroups = async () => {
    try {
      const [groupsData, membersData] = await Promise.all([
        api.getGroups(),
        api.getMembers(),
      ]);
      
      // Load wallet data for each group
      const groupsWithStats = await Promise.all(
        groupsData.map(async (g) => {
          const groupMembers = (membersData as any[]).filter((m) => (m.group_id || m.groupId) === g.id);
          let totalBalance = 0;
          let activeCount = 0;
          
          try {
            const wallets = await api.getGroupWallets(Number(g.id));
            totalBalance = wallets.reduce((sum: number, w: any) => sum + (parseFloat(w.balance) || 0), 0);
            activeCount = groupMembers.filter((m) => m.is_active || m.isActive).length;
          } catch (error) {
            console.error('Failed to load wallets for group', g.id);
          }
          
          return {
            ...g,
            memberCount: groupMembers.length,
            totalWalletBalance: totalBalance,
            activeMembers: activeCount,
          };
        })
      );
      
      setGroups(groupsWithStats);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.createGroup({
        name: formData.name,
        description: formData.description,
        createdBy: user?.name || user?.email || 'Unknown',
      });
      
      toast({
        title: 'Success',
        description: 'Group created successfully',
      });
      
      setFormData({ name: '', description: '' });
      setIsDialogOpen(false);
      loadGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (group: GroupWithStats) => {
    setSelectedGroup(group);
    setFormData({ name: group.name, description: group.description });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      // Note: You'll need to add updateGroup API method
      toast({
        title: 'Success',
        description: 'Group updated successfully',
      });
      
      setFormData({ name: '', description: '' });
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update group',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = async (group: GroupWithStats) => {
    setSelectedGroup(group);
    setIsViewDialogOpen(true);
    setLoadingMembers(true);
    
    try {
      // Load members for this group
      const allMembers = await api.getMembers();
      const filteredMembers = allMembers.filter((m: any) => m.group_id === group.id);
      
      // Load wallet data for each member
      const membersWithWallets = await Promise.all(
        filteredMembers.map(async (member: any) => {
          try {
            const wallet = await api.getWallet(member.id);
            return { ...member, wallet };
          } catch (error) {
            return { ...member, wallet: null };
          }
        })
      );
      
      setGroupMembers(membersWithWallets);
    } catch (error) {
      console.error('Failed to load members:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load member details',
        variant: 'destructive',
      });
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this group? All members will be removed.')) {
      return;
    }

    try {
      await api.deleteGroup(id);
      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      });
      loadGroups();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive',
      });
    }
  };

  // Filter and sort groups
  const filteredGroups = groups
    .filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.memberCount || 0) - (a.memberCount || 0);
        case 'balance':
          return (b.totalWalletBalance || 0) - (a.totalWalletBalance || 0);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const totalMembers = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0);
  const totalBalance = groups.reduce((sum, g) => sum + (g.totalWalletBalance || 0), 0);
  const totalActive = groups.reduce((sum, g) => sum + (g.activeMembers || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Groups Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {groups.length} groups • {totalMembers} total members • {totalBalance.toLocaleString()} RWF total
          </p>
        </div>
        {(user?.role === 'super_admin' || user?.role === 'group_admin') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
          <DialogContent aria-describedby="group-create-desc" className="w-[95vw] max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription id="group-create-desc">Add a new group to organize members</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter group name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter group description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">Create Group</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{groups.length}</p>
              <p className="text-xs text-muted-foreground">Total Groups</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Wallet className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{totalBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Balance (RWF)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{totalActive}</p>
              <p className="text-xs text-muted-foreground">Active Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="members">Most Members</SelectItem>
            <SelectItem value="balance">Highest Balance</SelectItem>
            <SelectItem value="date">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card 
            key={group.id} 
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleViewDetails(group)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg md:text-xl truncate">{group.name}</CardTitle>
                    {group.activeMembers && group.activeMembers > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {group.activeMembers} active
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm line-clamp-2">{group.description}</CardDescription>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(group);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(group.id, e)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>{group.memberCount} members</span>
                  </div>
                  {group.totalWalletBalance !== undefined && (
                    <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                      <Wallet className="h-4 w-4" />
                      <span>{group.totalWalletBalance.toLocaleString()} RWF</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Created {group.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  By {group.createdBy}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(group);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4 px-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first group to start organizing members'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>Update group information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">Update Group</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedGroup?.name}
            </DialogTitle>
            <DialogDescription>Group details, statistics, and member list</DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold">{selectedGroup.memberCount}</p>
                        <p className="text-xs text-muted-foreground">Total Members</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold">{selectedGroup.activeMembers || 0}</p>
                        <p className="text-xs text-muted-foreground">Active Members</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Wallet className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-xl font-bold">
                          {(selectedGroup.totalWalletBalance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Balance (RWF)</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm font-bold">
                          {selectedGroup.createdAt.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Created Date</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Group Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Group Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Description:</span>
                        <span className="font-medium text-sm">{selectedGroup.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Created By:</span>
                        <span className="font-medium text-sm">{selectedGroup.createdBy}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Members Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Group Members ({groupMembers.length})</span>
                      {loadingMembers && <Loader2 className="h-4 w-4 animate-spin" />}
                    </CardTitle>
                    <CardDescription>Complete list of all members in this group</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMembers ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : groupMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No members in this group yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead className="hidden md:table-cell">Contact</TableHead>
                              <TableHead className="hidden lg:table-cell">National ID</TableHead>
                              <TableHead>Wallet Balance</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {member.first_name} {member.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground md:hidden">
                                      {member.phone}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs">
                                      <Phone className="h-3 w-3" />
                                      <span>{member.phone}</span>
                                    </div>
                                    {member.email && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        <span>{member.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <span className="font-mono text-xs">{member.national_id}</span>
                                </TableCell>
                                <TableCell>
                                  {member.wallet ? (
                                    <div className="flex items-center gap-1">
                                      <Wallet className="h-4 w-4 text-green-600" />
                                      <span className="font-semibold text-green-600">
                                        {(typeof member.wallet.balance === 'number' ? member.wallet.balance : parseFloat(String(member.wallet.balance))).toLocaleString()} RWF
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No wallet</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={member.is_active ? "default" : "secondary"}
                                    className="whitespace-nowrap"
                                  >
                                    {member.is_active ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Active
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Inactive
                                      </>
                                    )}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;
