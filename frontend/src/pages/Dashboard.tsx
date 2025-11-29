import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, FolderOpen, TrendingUp } from 'lucide-react';
import { Group, Member } from '@/lib/mockData';
import { api } from '@/lib/api';
import { ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart as RPieChart, Pie, Cell } from 'recharts';

import { useAuth } from '@/contexts/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import GroupAdminDashboard from './GroupAdminDashboard';
import GroupUserDashboard from './GroupUserDashboard';
import MemberDashboard from './MemberDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to appropriate dashboard based on user role
  if (user?.role === 'super_admin') {
    return <SuperAdminDashboard />;
  } else if (user?.role === 'group_admin') {
    return <GroupAdminDashboard />;
  } else if (user?.role === 'group_user') {
    return <GroupUserDashboard />;
  } else if (user?.role === 'member') {
    return <MemberDashboard />;
  }

  // Default dashboard for members or undefined roles
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {user?.name}! 👋
        </h1>
        <p className="text-gray-100">Member Dashboard</p>
      </div>
    </div>
  );;
};

export default Dashboard;
