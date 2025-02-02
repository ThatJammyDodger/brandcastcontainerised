import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface CompanyProfile {
  name: string;
  description: string;
  industry: string;
  targetAudience: {
    ageRange: string;
    interests: string[];
    demographics: string[];
  };
  adContent: {
    description: string;
    tone: string;
    keywords: string[];
  };
  updatedAt?: number;
}

interface CompanyContextType {
  companyProfile: CompanyProfile | null;
  setCompanyProfile: (profile: CompanyProfile) => void;
  loadCompanyProfile: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const { user } = useAuth();

  const loadCompanyProfile = async () => {
    if (!user) {
      setCompanyProfile(null);
      return;
    }

    try {
      const docRef = doc(db, `users/${user.uid}/companyProfile/main`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CompanyProfile;
        setCompanyProfile(data);
      } else {
        setCompanyProfile(null);
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
      setCompanyProfile(null);
    }
  };

  useEffect(() => {
    loadCompanyProfile();
  }, [user]);

  return (
    <CompanyContext.Provider value={{ companyProfile, setCompanyProfile, loadCompanyProfile }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
} 