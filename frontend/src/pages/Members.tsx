import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Phone, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Group, Member } from '@/lib/mockData';
import { api } from '@/lib/api';

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [genderCode, setGenderCode] = useState<'MALE' | 'FEMALE' | 'OTHER' | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [nationalId, setNationalId] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const loadData = async () => {
    try {
      const [membersData, groupsData] = await Promise.all([
        api.getMembers(),
        api.getGroups(),
      ]);
      setMembers(membersData);
      setGroups(groupsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPhoneForLookup = (p: string) => {
    const trimmed = p.replace(/\s+/g, '');
    if (trimmed.startsWith('0')) return '250' + trimmed.slice(1);
    return trimmed;
  };

  const lookupByPhone = async () => {
    if (!phone) return null;
    try {
      setIsLookingUp(true);
      const formatted = formatPhoneForLookup(phone);
      const info = await api.getCustomerInfo(formatted);
      if (info) {
        setFirstName((prev) => prev || info.firstName);
        setLastName((prev) => prev || info.lastName);
        setBirthDate((prev) => prev || info.birthDate);
        setGenderCode((prev) => prev || (info.gender as 'MALE' | 'FEMALE' | 'OTHER'));
        setIsActive(info.isActive);
      }
      return info;
    } catch (err: any) {
      toast({ title: 'Lookup failed', description: err.message || 'Could not fetch info', variant: 'destructive' });
      return null;
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupId) {
      toast({
        title: 'Error',
        description: 'Please select a group',
        variant: 'destructive',
      });
      return;
    }

    try {
      const prefill = await lookupByPhone();
      if (!prefill && (!firstName || !lastName)) {
        toast({
          title: 'Not Found',
          description: 'No member found with this phone number. Please fill name fields.',
          variant: 'destructive',
        });
        return;
      }

      const fn = firstName || (prefill?.fullName?.split(' ')[0] || '');
      const ln = lastName || (prefill?.fullName?.split(' ').slice(1).join(' ') || '');
      const fullName = `${fn} ${ln}`.trim();
      const genderFromCode = genderCode === 'MALE' ? 'Male' : genderCode === 'FEMALE' ? 'Female' : 'Other';
      const bd = birthDate ? new Date(birthDate) : undefined;

      await api.addMember({
        firstName: fn,
        lastName: ln,
        birthDate: bd ? bd.toISOString().slice(0, 10) : undefined,
        genderCode: genderCode || (prefill?.gender === 'Male' ? 'MALE' : prefill?.gender === 'Female' ? 'FEMALE' : 'OTHER'),
        isActive,
        nationalId: nationalId || prefill?.nationalId || `ID${Date.now()}`,
        phone: phone,
        groupId,
      });

      toast({
        title: 'Success',
        description: `${fullName} added successfully`,
      });

      setPhone('');
      setGroupId('');
      setFirstName('');
      setLastName('');
      setBirthDate('');
      setGenderCode('');
      setIsActive(true);
      setNationalId('');
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setFirstName(member.firstName || (member.fullName?.split(' ')[0] || ''));
    setLastName(member.lastName || (member.fullName?.split(' ').slice(1).join(' ') || ''));
    setBirthDate(member.birthDate ? new Date(member.birthDate).toISOString().slice(0, 10) : '');
    setGenderCode(member.genderCode || (member.gender === 'Male' ? 'MALE' : member.gender === 'Female' ? 'FEMALE' : 'OTHER'));
    setIsActive(member.isActive ?? true);
    setNationalId(member.nationalId);
    setPhone(member.phone);
    setGroupId(member.groupId);
    setEditOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const genderFromCode = genderCode === 'MALE' ? 'Male' : genderCode === 'FEMALE' ? 'Female' : 'Other';
      await api.updateMember(editingMember.id, {
        firstName,
        lastName,
        birthDate: birthDate,
        genderCode,
        isActive,
        nationalId,
        phone,
        groupId,
      });
      toast({ title: 'Updated', description: 'Member updated successfully' });
      setEditOpen(false);
      setEditingMember(null);
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update member', variant: 'destructive' });
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.nationalId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || member.groupId === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const getGroupName = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.name || 'Unknown';
  };

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

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-11" />
              <Skeleton className="h-11" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4">
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                  <Skeleton className="h-6" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Members Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">View and manage all members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="member-add-desc" className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAddMember}>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription id="member-add-desc">
                  Enter details in the requested format. Phone lookup can prefill name and gender.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="group">Select Group</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={lookupByPhone}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter 10-digit phone number for automatic lookup
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genderCode">Gender</Label>
                    <Select value={genderCode} onValueChange={(v) => setGenderCode(v as 'MALE' | 'FEMALE' | 'OTHER')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">MALE</SelectItem>
                        <SelectItem value="FEMALE">FEMALE</SelectItem>
                        <SelectItem value="OTHER">OTHER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Active</Label>
                    <Select value={isActive ? 'true' : 'false'} onValueChange={(v) => setIsActive(v === 'true')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Active status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID</Label>
                    <Input id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLookingUp} className="w-full sm:w-auto">
                  {isLookingUp ? 'Looking up...' : 'Add Member'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby="member-edit-desc" className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdateMember}>
            <DialogHeader>
              <DialogTitle>Update Member</DialogTitle>
              <DialogDescription id="member-edit-desc">Update member details in the specified format</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={genderCode} onValueChange={(v) => setGenderCode(v as 'MALE' | 'FEMALE' | 'OTHER')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">MALE</SelectItem>
                    <SelectItem value="FEMALE">FEMALE</SelectItem>
                    <SelectItem value="OTHER">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Active</Label>
                <Select value={isActive ? 'true' : 'false'} onValueChange={(v) => setIsActive(v === 'true')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Active status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID</Label>
                <Input id="nationalId" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneEdit">Phone</Label>
                <Input id="phoneEdit" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupEdit">Group</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Members List ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">First Name</TableHead>
                    <TableHead className="whitespace-nowrap">Last Name</TableHead>
                    <TableHead className="whitespace-nowrap">Birth Date</TableHead>
                    <TableHead className="whitespace-nowrap">Gender</TableHead>
                    <TableHead className="whitespace-nowrap">Active</TableHead>
                    <TableHead className="whitespace-nowrap">Phone</TableHead>
                    <TableHead className="whitespace-nowrap">Group</TableHead>
                    <TableHead className="whitespace-nowrap">Joined Date</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium whitespace-nowrap">{member.firstName || member.fullName.split(' ')[0]}</TableCell>
                      <TableCell className="whitespace-nowrap">{member.lastName || member.fullName.split(' ').slice(1).join(' ')}</TableCell>
                      <TableCell className="whitespace-nowrap">{member.birthDate ? new Date(member.birthDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={(member.genderCode || (member.gender === 'Male' ? 'MALE' : 'FEMALE')) === 'MALE' ? 'default' : 'secondary'}>
                          {member.genderCode || (member.gender === 'Male' ? 'MALE' : member.gender === 'Female' ? 'FEMALE' : 'OTHER')}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={(member.isActive ?? true) ? 'default' : 'secondary'}>
                          {(member.isActive ?? true) ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{member.phone}</TableCell>
                      <TableCell className="whitespace-nowrap">{getGroupName(member.groupId)}</TableCell>
                      <TableCell className="whitespace-nowrap">{member.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No members found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
