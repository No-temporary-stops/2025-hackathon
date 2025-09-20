import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface Semester {
  _id: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isCurrentlyActive: boolean;
  priority: string;
  participants: Array<{
    user: {
      _id: string;
      name: string;
      avatar: string;
      role: string;
    };
    role: string;
    studentId?: string;
  }>;
  classes: Array<{ name: string; teacher: string; students: string[] }>;
}

interface SemesterContextType {
  selectedSemester: string | null;
  setSelectedSemester: (semesterId: string | null) => void;
  semesters: Semester[];
  currentSemester: Semester | null;
  loading: boolean;
}

const SemesterContext = createContext<SemesterContextType | undefined>(undefined);

export const useSemester = () => {
  const context = useContext(SemesterContext);
  if (context === undefined) {
    throw new Error('useSemester must be used within a SemesterProvider');
  }
  return context;
};

interface SemesterProviderProps {
  children: ReactNode;
}

export const SemesterProvider: React.FC<SemesterProviderProps> = ({ children }) => {
  const [selectedSemester, setSelectedSemesterState] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user's semesters (only when user is logged in)
  const { data: semestersData, isLoading } = useQuery(
    'semesters',
    async () => {
      const response = await api.get('/semesters/my-semesters');
      return response.data.semesters;
    },
    {
      enabled: !!user, // Only run query when user is logged in
      retry: false, // Don't retry on failure
    }
  );

  // Set first active semester as default
  useEffect(() => {
    if (semestersData && !selectedSemester) {
      const activeSemester = semestersData.find((s: Semester) => s.isCurrentlyActive);
      if (activeSemester) {
        setSelectedSemesterState(activeSemester._id);
      } else if (semestersData.length > 0) {
        setSelectedSemesterState(semestersData[0]._id);
      }
    }
  }, [semestersData, selectedSemester]);

  const setSelectedSemester = (semesterId: string | null) => {
    setSelectedSemesterState(semesterId);
  };

  const currentSemester = semestersData?.find((s: Semester) => s._id === selectedSemester) || null;

  const value: SemesterContextType = {
    selectedSemester,
    setSelectedSemester,
    semesters: semestersData || [],
    currentSemester,
    loading: isLoading || false,
  };

  return (
    <SemesterContext.Provider value={value}>
      {children}
    </SemesterContext.Provider>
  );
};
