import { useState } from 'react';
import { collection, getDocs, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';
import { useToast } from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import { calculateAIScore } from '@/utils/scoring';

// Type for global streamer data (Twitch data)
type GlobalStreamerData = {
  id: string;
  username: string;
  name: string;
  image: string;
  followers: number;
  views: number;
  description: string;
  language: string;
  createdAt: string;
  lastStreamedAt: string;
  averageViewers: number;
  peakViewers: number;
  streamTitle: string;
  game_name: string;
  tags: string[];
  sponsors: string[];
  panelElements: string[];
  panelImageURLs: string[];
  panelLinkUrls: string[];
};

// Function to map global data to Streamer type
const mapToStreamer = (globalData: GlobalStreamerData): Streamer => ({
  id: globalData.id,
  name: globalData.name,
  image: globalData.image,
  description: globalData.description,
  tags: globalData.tags || [],
  categories: [globalData.game_name],
  sponsors: globalData.sponsors || [],
  aiSummary: '',
  aiScore: 0,
  aiRecommendation: '',
  followers: globalData.followers,
  socials: [],
  relevanceScore: 0
});

export const useStreamers = () => {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(false);
  const [recomputingId, setRecomputingId] = useState<string | null>(null);
  const [sortType, setSortType] = useState<string>('relevance');
  const toast = useToast();
  const { user } = useAuth();

  const sortStreamers = (streamers: Streamer[], sortBy: string) => {
    return [...streamers].sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          const aAvg = ((a.relevanceScore || 0) + (a.aiScore || 0)) / 2;
          const bAvg = ((b.relevanceScore || 0) + (b.aiScore || 0)) / 2;
          return bAvg - aAvg;
        case 'brandFit':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case 'reach':
          return (b.aiScore || 0) - (a.aiScore || 0);
        case 'followers':
          return (b.followers || 0) - (a.followers || 0);
        default:
          return 0;
      }
    });
  };

  const loadStreamers = async (companyProfile: CompanyProfile | null) => {
    if (!companyProfile || !user) return;
    
    try {
      setLoading(true);
      
      // First, get the list of analyzed streamers for this user
      const userAnalysisRef = collection(db, `users/${user.uid}/streamerAnalysis`);
      const userAnalysisSnapshot = await getDocs(userAnalysisRef);
      
      // Get all the streamer IDs that this user has analyzed
      const streamerIds = userAnalysisSnapshot.docs.map(doc => doc.id);
      
      if (streamerIds.length === 0) {
        setStreamers([]);
        setLoading(false);
        return;
      }

      const updatedStreamers: Streamer[] = [];

      // For each streamer ID, get both the global data and user-specific analysis
      for (const streamerId of streamerIds) {
        try {
          // Get global Twitch data
          const globalStreamerRef = doc(db, 'streamers', streamerId);
          const globalStreamerDoc = await getDoc(globalStreamerRef);
          
          if (!globalStreamerDoc.exists()) continue;
          
          const globalStreamerData = globalStreamerDoc.data() as GlobalStreamerData;
          const streamer = {
            ...mapToStreamer(globalStreamerData),
            id: streamerId  // Ensure we use the Firestore document ID
          };
          
          // Get user-specific analysis
          const userAnalysisDoc = userAnalysisSnapshot.docs.find(doc => doc.id === streamerId);
          const analysis = userAnalysisDoc?.data();
          
          // Always add the streamer, using analysis data if available
          updatedStreamers.push({
            ...streamer,
            aiScore: analysis?.aiScore || 0,
            relevanceScore: analysis?.relevanceScore || 0,
            aiSummary: analysis?.aiSummary || '',
            aiRecommendation: analysis?.aiRecommendation || '',
            sponsors: globalStreamerData.sponsors || [],
            tags: globalStreamerData.tags || [],
            categories: [globalStreamerData.game_name].filter(Boolean)
          });
        } catch (error) {
          console.error(`Error loading streamer ${streamerId}:`, error);
          continue;
        }
      }

      // Set sorted streamers
      const sortedStreamers = sortStreamers(updatedStreamers, sortType);
      setStreamers(sortedStreamers);

    } catch (error) {
      console.error('Error loading streamers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load streamers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecompute = async (streamerId: string, companyProfile: CompanyProfile | null) => {
    if (!companyProfile || !user) {
      console.log('Early return - missing companyProfile or user:', { hasCompanyProfile: !!companyProfile, hasUser: !!user });
      return;
    }

    console.log('Starting recompute for streamer:', streamerId);
    setRecomputingId(streamerId);
    
    try {
      // 1. Get global streamer data
      console.log('1. Fetching global streamer data...');
      const globalStreamerRef = doc(db, 'streamers', streamerId);
      const globalStreamerDoc = await getDoc(globalStreamerRef);
      
      if (!globalStreamerDoc.exists()) {
        console.error('Streamer document not found in global collection');
        throw new Error('Streamer not found');
      }
      
      const globalStreamerData = globalStreamerDoc.data() as GlobalStreamerData;
      console.log('Global streamer data:', globalStreamerData);
      
      const streamer = {
        ...mapToStreamer(globalStreamerData),
        id: streamerId  // Ensure we use the Firestore document ID
      };
      console.log('Mapped streamer data:', streamer);

      // 2. Get existing analysis
      console.log('2. Fetching existing analysis...');
      const analysisRef = doc(db, `users/${user.uid}/streamerAnalysis`, streamerId);
      const existingAnalysis = await getDoc(analysisRef);
      const existingData = existingAnalysis.data();
      console.log('Existing analysis data:', existingData);
      
      // 3. Get fresh brand fit analysis and relevance score from Claude API
      console.log('3. Getting fresh brand fit analysis...');
      const analysisPayload = {
        streamer: {
          ...streamer,
        },
        company: companyProfile
      };
      console.log('Analysis request payload:', analysisPayload);
      
      const analysisResponse = await fetch('/api/analyze-brand-fit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisPayload)
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('Analysis API error:', { status: analysisResponse.status, body: errorText });
        throw new Error('Failed to analyze brand fit');
      }

      const analysisResult = await analysisResponse.json();
      console.log('Analysis API response:', analysisResult);
      const { aiSummary, aiRecommendation, relevanceScore } = analysisResult;

      const aiScore = calculateAIScore(streamer);

      // 4. Prepare updates
      console.log('4. Preparing updates...');
      const updates = {
        aiScore,
        relevanceScore,
        aiSummary,
        aiRecommendation,
        updatedAt: new Date()
      };
      console.log('Update package:', updates);

      // 5. Update Firestore
      console.log('5. Updating Firestore...');
      const batch = writeBatch(db);
      
      // Update analysis collection
      batch.set(analysisRef, updates, { merge: true });
      
      // Update history collection
      const historyRef = doc(db, `users/${user.uid}/history`, streamerId);
      const historyUpdate = {
        streamerId,
        name: streamer.name,
        image: streamer.image,
        followers: streamer.followers,
        aiScore: existingData?.aiScore || 0,
        relevanceScore,
        lastAnalyzed: new Date(),
        categories: streamer.categories,
        tags: streamer.tags,
        sponsors: streamer.sponsors || []
      };
      
      batch.set(historyRef, historyUpdate, { merge: true });
      
      await batch.commit();
      console.log('Firestore updates committed successfully');

      // 6. Update local state
      setStreamers(prev => {
        const updated = prev.map(s => 
          s.id === streamerId
            ? {
                ...s,
                relevanceScore,
                aiSummary,
                aiRecommendation,
                aiScore: existingData?.aiScore || 0,
                updatedAt: new Date()
              }
            : s
        );
        return sortStreamers(updated, sortType);
      });

      toast({
        title: 'Success',
        description: 'Brand analysis updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error updating brand analysis:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update brand analysis',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRecomputingId(null);
    }
  };

  return {
    streamers,
    loading,
    recomputingId,
    sortType,
    setSortType,
    loadStreamers,
    handleRecompute
  };
}; 