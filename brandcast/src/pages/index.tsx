import { useEffect, useState } from 'react';
import { Container, VStack, Heading, Text, SimpleGrid, useColorMode, Spinner, Center, Select, useToast } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StreamerCard from '@/components/StreamerCard';
import { useStreamers } from '@/hooks/useStreamers';
import { CompanyProfile } from '@/types/company';
import { Streamer } from '@/types/streamer';
import { collection, doc, getDoc, getDocs, query, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { calculateAIScore } from '@/utils/scoring';

export default function Home() {
  const { colorMode } = useColorMode();
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [localSortType, setLocalSortType] = useState<string>('relevance');
  const {
    streamers,
    loading,
    recomputingId,
    loadStreamers,
    handleRecompute
  } = useStreamers();
  const toast = useToast();
  const { user } = useAuth();

  const checkAndUpdateMissingCalculations = async (profile: CompanyProfile) => {
    if (!user) return;

    try {
      const streamersRef = collection(db, `users/${user.uid}/streamerAnalysis`);
      const streamersSnapshot = await getDocs(query(streamersRef));
      let currentBatch = writeBatch(db);
      let updateCount = 0;
      let batchCount = 0;

      for (const analysisDoc of streamersSnapshot.docs) {
        try {
          const streamerId = analysisDoc.id;
          const analysis = analysisDoc.data();
          
          // Get global streamer data
          const globalStreamerRef = doc(db, 'streamers', streamerId);
          const globalStreamerDoc = await getDoc(globalStreamerRef);
          
          if (!globalStreamerDoc.exists()) continue;
          
          const globalData = globalStreamerDoc.data();
          const streamer: Streamer = {
            id: streamerId,
            name: globalData.name,
            image: globalData.image,
            description: globalData.description,
            tags: globalData.tags || [],
            categories: [globalData.streamGame],
            sponsors: globalData.sponsors || [],
            followers: globalData.followers,
            socials: [],
            aiScore: analysis.aiScore,
            relevanceScore: analysis.relevanceScore,
            aiSummary: analysis.aiSummary || '',
            aiRecommendation: analysis.aiRecommendation || ''
          };

          let needsUpdate = false;
          const updates: any = {};

          if (streamer.aiScore === undefined || streamer.aiScore === null) {
            updates.aiScore = calculateAIScore(streamer);
            needsUpdate = true;
          }
          
          if (!streamer.aiSummary || !streamer.aiRecommendation) {
            // Call the analyze-brand-fit endpoint
            const analysisResponse = await fetch('/api/analyze-brand-fit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                streamer,
                company: profile
              })
            });

            if (!analysisResponse.ok) {
              throw new Error('Failed to analyze brand fit');
            }

            const { aiSummary, aiRecommendation } = await analysisResponse.json();
            updates.aiSummary = aiSummary;
            updates.aiRecommendation = aiRecommendation;
            needsUpdate = true;
          }

          if (needsUpdate) {
            console.log(`Updating streamer ${streamerId} with:`, updates);
            
            currentBatch.update(doc(db, `users/${user.uid}/streamerAnalysis`, streamerId), {
              ...updates,
              updatedAt: serverTimestamp()
            });

            updateCount++;
            batchCount++;

            if (batchCount >= 400) {
              await currentBatch.commit();
              console.log(`Committed batch with ${batchCount} updates`);
              currentBatch = writeBatch(db);
              batchCount = 0;
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (streamerError) {
          console.error(`Error processing streamer ${analysisDoc.id}:`, streamerError);
          continue;
        }
      }

      if (batchCount > 0) {
        await currentBatch.commit();
        console.log(`Committed final batch with ${batchCount} updates`);
      }

    } catch (error) {
      console.error('Error updating missing calculations:', error);
      toast({
        title: 'Update Error',
        description: 'Failed to update some streamer calculations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // Load company profile
        const companyDoc = await getDoc(doc(db, `users/${user.uid}/companyProfile/main`));
        if (companyDoc.exists()) {
          const profile = companyDoc.data() as CompanyProfile;
          setCompanyProfile(profile);
          // Check for missing calculations after loading company profile
          await checkAndUpdateMissingCalculations(profile);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadData();
  }, [user]);

  useEffect(() => {
    loadStreamers(companyProfile);
  }, [companyProfile]);

  const sortStreamers = (streamers: Streamer[]) => {
    return [...streamers].sort((a, b) => {
      switch (localSortType) {
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
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <VStack align="stretch" spacing={2}>
              <Heading size="lg">Recommended For You</Heading>
              <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
                Top streamers that match your brand
              </Text>
            </VStack>

            <Select 
              value={localSortType} 
              onChange={(e) => setLocalSortType(e.target.value)}
              maxW="250px"
              bg={colorMode === 'light' ? 'white' : 'gray.700'}
            >
              <option value="relevance">Sort by Overall Relevance</option>
              <option value="brandFit">Sort by Brand Fit Score</option>
              <option value="reach">Sort by Reach Score</option>
              <option value="followers">Sort by Followers</option>
            </Select>

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
                {sortStreamers(streamers).slice(0, 3).map((streamer) => (console.log("hi",streamer),
                  <StreamerCard
                    key={streamer.id}
                    streamer={streamer}
                    isRecomputing={recomputingId === streamer.id}
                    onRecompute={() => handleRecompute(streamer.id, companyProfile)}
                    relevanceScore={streamer.relevanceScore}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Center py={12}>
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
                  No analysed streamers yet. Go to the Evaluate page to analyse streamers!
                </Text>
              </Center>
            )}
          </VStack>
        </Container>
      </Layout>
    </ProtectedRoute>
  );
}
