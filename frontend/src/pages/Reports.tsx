import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, PieChart } from 'lucide-react';
import { Group, Member } from '@/lib/mockData';
import { api } from '@/lib/api';

const Reports = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsData, membersData] = await Promise.all([
          api.getGroups(),
          api.getMembers(),
        ]);
        const withCounts = groupsData.map(g => ({
          ...g,
          memberCount: membersData.filter(m => m.groupId === g.id).length,
        }));
        setGroups(withCounts);
        setMembers(membersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredMembers = selectedGroup === 'all' 
    ? members 
    : members.filter(m => m.groupId === selectedGroup);

  const genderStats = {
    male: filteredMembers.filter(m => m.gender === 'Male').length,
    female: filteredMembers.filter(m => m.gender === 'Female').length,
    other: filteredMembers.filter(m => m.gender === 'Other').length,
  };

  const totalMembers = genderStats.male + genderStats.female + genderStats.other;

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportGroupsReport = () => {
    const data = groups.map(g => ({
      'Group Name': g.name,
      'Description': g.description,
      'Members': g.memberCount,
      'Created By': g.createdBy,
      'Created Date': g.createdAt.toLocaleDateString(),
    }));
    exportToCSV(data, 'groups_report.csv');
  };

  const exportMembersReport = () => {
    const data = filteredMembers.map(m => ({
      'Full Name': m.fullName,
      'National ID': m.nationalId,
      'Gender': m.gender,
      'Phone': m.phone,
      'Group': groups.find(g => g.id === m.groupId)?.name || 'Unknown',
      'Joined Date': m.createdAt.toLocaleDateString(),
    }));
    exportToCSV(data, 'members_report.csv');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-2">View detailed reports and statistics</p>
      </div>

      {/* Groups Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Groups Report</CardTitle>
              <CardDescription>Overview of all groups</CardDescription>
            </div>
            <Button variant="outline" onClick={exportGroupsReport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.description}</TableCell>
                  <TableCell>{group.memberCount}</TableCell>
                  <TableCell>{group.createdBy}</TableCell>
                  <TableCell>{group.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Members Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members Report</CardTitle>
              <CardDescription>Detailed member information</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-[200px]">
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
              <Button variant="outline" onClick={exportMembersReport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredMembers.length} member(s)
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.nationalId}</TableCell>
                  <TableCell>{member.gender}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>
                    {groups.find(g => g.id === member.groupId)?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{member.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gender Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Gender Breakdown</CardTitle>
          <CardDescription>Member distribution by gender</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center p-6 bg-info/10 rounded-lg">
              <PieChart className="h-8 w-8 text-info mb-2" />
              <div className="text-3xl font-bold">{genderStats.male}</div>
              <div className="text-sm text-muted-foreground">Male</div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalMembers > 0 ? ((genderStats.male / totalMembers) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-warning/10 rounded-lg">
              <PieChart className="h-8 w-8 text-warning mb-2" />
              <div className="text-3xl font-bold">{genderStats.female}</div>
              <div className="text-sm text-muted-foreground">Female</div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalMembers > 0 ? ((genderStats.female / totalMembers) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
              <PieChart className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-3xl font-bold">{genderStats.other}</div>
              <div className="text-sm text-muted-foreground">Other</div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalMembers > 0 ? ((genderStats.other / totalMembers) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
