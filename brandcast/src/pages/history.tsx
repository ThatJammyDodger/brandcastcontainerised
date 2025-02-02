import { useState, useEffect } from 'react';
import { Box, VStack, Heading, Text, SimpleGrid, useColorMode, Spinner, Center, useToast, Select } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StreamerCard from '@/components/StreamerCard';
import { Streamer } from '@/types/streamer';
import { collection, query, orderBy, getDocs, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CompanyProfile } from '@/types/company';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

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
  tags: globalData.tags,
  categories: [globalData.game_name],
  sponsors: globalData.sponsors || [],
  aiSummary: '',
  aiScore: 0,
  aiRecommendation: '',
  followers: globalData.followers,
  socials: [],
  relevanceScore: 0
});

export default function History() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputingId, setRecomputingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        if (!user) {
          console.log('No user found, skipping fetch');
          return;
        }

        // Load streamers from user's analysis collection
        const q = query(
          collection(db, `users/${user.uid}/streamerAnalysis`),
          orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const analysisData = querySnapshot.docs.map(doc => doc.data());
        
        // Get the corresponding global streamer data
        const streamerPromises = querySnapshot.docs.map(async (analysisDoc) => {
          const globalStreamerRef = doc(db, 'streamers', analysisDoc.id);
          const globalStreamerDoc = await getDoc(globalStreamerRef);
          
          if (!globalStreamerDoc?.exists()) {
            console.log(`No global data found for streamer ${analysisDoc.id}`);
            return null;
          }

          const globalData = globalStreamerDoc.data() as GlobalStreamerData;
          const analysis = analysisDoc.data();
          
          return {
            ...mapToStreamer(globalData),
            aiScore: analysis.aiScore || 0,
            relevanceScore: analysis.relevanceScore || 0,
            aiSummary: analysis.aiSummary || '',
            aiRecommendation: analysis.aiRecommendation || '',
            updatedAt: analysis.updatedAt?.toDate() || new Date(),
            id: analysisDoc.id
          } as Streamer;
        });

        const resolvedStreamers = (await Promise.all(streamerPromises)).filter((s): s is Streamer => s !== null);
        console.log('Fetched streamers:', resolvedStreamers);
        
        setStreamers(resolvedStreamers);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analysis history',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const handleRecompute = async (streamerId: string) => {
    setRecomputingId(streamerId);
    try {
      if (!user) {
        throw new Error('Please sign in to update analysis');
      }

      const streamer = streamers.find(s => s.id === streamerId);
      if (!streamer) {
        throw new Error('Streamer not found');
      }

      // Load company profile from user's collection
      const companySnapshot = await getDoc(doc(db, `users/${user.uid}/companyProfile/main`));
      if (!companySnapshot.exists()) {
        throw new Error('Company profile not found. Please set up your company profile first.');
      }
      const companyProfile = companySnapshot.data() as CompanyProfile;

      // Get brand fit analysis and score from Claude
      const analysisResponse = await fetch('/api/analyze-brand-fit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamer,
          company: companyProfile
        })
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze brand fit');
      }

      const { aiSummary, aiRecommendation, relevanceScore } = await analysisResponse.json();

      const updates = {
        aiScore: streamer.aiScore,
        relevanceScore,
        aiSummary,
        aiRecommendation,
        updatedAt: new Date()
      };

      // Update in Firestore
      const batch = writeBatch(db);
      const analysisRef = doc(db, `users/${user.uid}/streamerAnalysis`, streamerId);
      batch.update(analysisRef, updates);
      await batch.commit();

      // Update local state
      setStreamers(prev => 
        prev.map(s => 
          s.id === streamerId 
            ? { ...s, ...updates }
            : s
        )
      );

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

  const getSortedStreamers = () => {
    return [...streamers].sort((a, b) => {
      switch (sortBy) {
        case 'relevance': {
          // Calculate overall score exactly as shown on cards
          const getScore = (streamer: Streamer) => {
            if (!streamer.aiScore) return 0;
            // If no relevance score, just use AI score
            if (streamer.relevanceScore === undefined || streamer.relevanceScore === null) {
              return streamer.aiScore;
            }
            // Average of AI score and relevance score (converted to 0-10)
            return (streamer.aiScore + (streamer.relevanceScore * 10)) / 2;
          };
          return getScore(b) - getScore(a);
        }
        case 'brandFit':
          // Convert 0-1 relevance score to 0-10 scale
          return ((b.relevanceScore || 0) * 10) - ((a.relevanceScore || 0) * 10);
        case 'reach':
          return (b.aiScore || 0) - (a.aiScore || 0);
        case 'followers':
          return (b.followers || 0) - (a.followers || 0);
        default:
          return 0;
      }
    });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
          <Box>
            <Heading size="lg" mb={2}>Analysis History</Heading>
            <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
              Previously analysed Twitch streamers
            </Text>
          </Box>

          {!loading && streamers.length > 0 && (
            <Box>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                maxW="300px"
                mb={4}
              >
                <option value="relevance">Sort by Overall Relevance</option>
                <option value="brandFit">Sort by Brand Fit Score</option>
                <option value="reach">Sort by Reach Score</option>
                <option value="followers">Sort by Followers</option>
              </Select>
            </Box>
          )}

          {loading ? (
            <Center py={12}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                color={colorMode === 'light' ? 'blue.500' : 'blue.200'}
                size="xl"
              />
            </Center>
          ) : streamers.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {getSortedStreamers().map((streamer) => (
                <StreamerCard 
                  key={streamer.id} 
                  streamer={streamer} 
                  relevanceScore={streamer.relevanceScore}
                  isRecomputing={recomputingId === streamer.id}
                  onRecompute={() => handleRecompute(streamer.id)}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center py={12}>
              <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
                No analysed streamers yet. Try evaluating some streamers first!
              </Text>
            </Center>
          )}
        </VStack>
      </Layout>
    </ProtectedRoute>
  );
} 