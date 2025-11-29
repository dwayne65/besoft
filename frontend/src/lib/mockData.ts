// Mock data and utility functions for the Maisha App

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
}

export interface Member {
  id: string;
  fullName: string;
  nationalId: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  groupId: string;
  createdAt: Date;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  isActive?: boolean;
  genderCode?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  memberCount: number;
}

// Mock phone lookup service
export const mockPhoneLookup = async (phone: string): Promise<Omit<Member, 'id' | 'groupId' | 'createdAt'> | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock validation
  if (!phone.match(/^\d{10}$/)) {
    return null;
  }
  
  // Generate mock data based on phone number
  const names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Wilson', 'Carol White', 'David Brown'];
  const genders: ('Male' | 'Female')[] = ['Male', 'Female'];
  
  const index = parseInt(phone.slice(-2)) % names.length;
  
  return {
    fullName: names[index],
    nationalId: `ID${phone.slice(0, 8)}`,
    gender: genders[index % 2],
    phone: phone,
  };
};

// Mock data storage
let mockGroups: Group[] = [
  {
    id: '1',
    name: 'Youth Group',
    description: 'Young members organization',
    createdBy: 'Admin',
    createdAt: new Date('2024-01-15'),
    memberCount: 12,
  },
  {
    id: '2',
    name: 'Women Empowerment',
    description: 'Women support network',
    createdBy: 'Admin',
    createdAt: new Date('2024-02-20'),
    memberCount: 25,
  },
  {
    id: '3',
    name: 'Community Leaders',
    description: 'Leadership development group',
    createdBy: 'User',
    createdAt: new Date('2024-03-10'),
    memberCount: 8,
  },
];

let mockMembers: Member[] = [
  {
    id: '1',
    fullName: 'John Doe',
    nationalId: 'ID12345678',
    gender: 'Male',
    phone: '0712345678',
    groupId: '1',
    createdAt: new Date('2024-01-20'),
    firstName: 'John',
    lastName: 'Doe',
    birthDate: new Date('1990-05-12'),
    isActive: true,
    genderCode: 'MALE',
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    nationalId: 'ID23456789',
    gender: 'Female',
    phone: '0723456789',
    groupId: '1',
    createdAt: new Date('2024-01-22'),
    firstName: 'Jane',
    lastName: 'Smith',
    birthDate: new Date('1992-08-21'),
    isActive: true,
    genderCode: 'FEMALE',
  },
  {
    id: '3',
    fullName: 'Alice Johnson',
    nationalId: 'ID34567890',
    gender: 'Female',
    phone: '0734567890',
    groupId: '2',
    createdAt: new Date('2024-02-25'),
    firstName: 'Alice',
    lastName: 'Johnson',
    birthDate: new Date('1988-11-03'),
    isActive: true,
    genderCode: 'FEMALE',
  },
];

let currentUser: User | null = null;

export const mockAuth = {
  login: async (username: string, password: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (username === 'admin' && password === 'admin') {
      currentUser = {
        id: '1',
        username: 'admin',
        fullName: 'Admin User',
        role: 'admin',
      };
      return currentUser;
    }
    
    if (username === 'user' && password === 'user') {
      currentUser = {
        id: '2',
        username: 'user',
        fullName: 'Regular User',
        role: 'user',
      };
      return currentUser;
    }
    
    return null;
  },
  
  register: async (username: string, password: string, fullName: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    currentUser = {
      id: Date.now().toString(),
      username,
      fullName,
      role: 'user',
    };
    return currentUser;
  },
  
  logout: () => {
    currentUser = null;
  },
  
  getCurrentUser: () => currentUser,
};

export const mockGroups_API = {
  getAll: async (): Promise<Group[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockGroups];
  },
  
  create: async (data: Omit<Group, 'id' | 'createdAt' | 'memberCount'>): Promise<Group> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newGroup: Group = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      memberCount: 0,
    };
    mockGroups.push(newGroup);
    return newGroup;
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    mockGroups = mockGroups.filter(g => g.id !== id);
    mockMembers = mockMembers.filter(m => m.groupId !== id);
  },
  
  update: async (id: string, data: Partial<Group>): Promise<Group> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockGroups.findIndex(g => g.id === id);
    if (index !== -1) {
      mockGroups[index] = { ...mockGroups[index], ...data };
      return mockGroups[index];
    }
    throw new Error('Group not found');
  },
};

export const mockMembers_API = {
  getAll: async (groupId?: string): Promise<Member[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (groupId) {
      return mockMembers.filter(m => m.groupId === groupId);
    }
    return [...mockMembers];
  },

  add: async (data: Omit<Member, 'id' | 'createdAt'>): Promise<Member> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check for duplicate
    const exists = mockMembers.find(m => m.phone === data.phone && m.groupId === data.groupId);
    if (exists) {
      throw new Error('Member already exists in this group');
    }
    
    const nameParts = data.fullName?.split(' ') || [];
    const firstName = data.firstName || nameParts[0] || '';
    const lastName = data.lastName || nameParts.slice(1).join(' ') || '';
    const genderCode = data.genderCode || (data.gender === 'Male' ? 'MALE' : data.gender === 'Female' ? 'FEMALE' : 'OTHER');
    const newMember: Member = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      firstName,
      lastName,
      birthDate: data.birthDate || new Date('1990-01-01'),
      isActive: data.isActive ?? true,
      genderCode,
    };
    mockMembers.push(newMember);
    
    // Update group member count
    const groupIndex = mockGroups.findIndex(g => g.id === data.groupId);
    if (groupIndex !== -1) {
      mockGroups[groupIndex].memberCount++;
    }
    
    return newMember;
  },

  update: async (id: string, data: Partial<Member>): Promise<Member> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockMembers.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Member not found');
    const updated = { ...mockMembers[index], ...data } as Member;
    if (updated.firstName || updated.lastName) {
      const fn = updated.firstName ?? mockMembers[index].firstName ?? '';
      const ln = updated.lastName ?? mockMembers[index].lastName ?? '';
      updated.fullName = [fn, ln].filter(Boolean).join(' ').trim();
    }
    if (updated.genderCode) {
      updated.gender = updated.genderCode === 'MALE' ? 'Male' : updated.genderCode === 'FEMALE' ? 'Female' : 'Other';
    }
    mockMembers[index] = updated;
    return updated;
  },

  bulkAdd: async (phones: string[], groupId: string): Promise<{ success: number; failed: string[] }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const failed: string[] = [];
    let success = 0;
    
    for (const phone of phones) {
      try {
        const memberData = await mockPhoneLookup(phone);
        if (memberData) {
          await mockMembers_API.add({ ...memberData, groupId });
          success++;
        } else {
          failed.push(phone);
        }
      } catch (error) {
        failed.push(phone);
      }
    }
    
    return { success, failed };
  },
};
