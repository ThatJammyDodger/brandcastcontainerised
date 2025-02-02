import { useState, useEffect } from 'react';
import { Box, VStack, Heading, Text, Input, Button, useToast, Card, useColorMode, Flex, keyframes, Spinner } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import StreamerCard from '@/components/StreamerCard';
import { TwitchStreamer, Streamer } from '@/types/streamer';
import { CompanyProfile } from '@/types/company';
import { collection, doc, getDoc, setDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { calculateAIScore } from '@/utils/scoring';
import { useRouter } from 'next/router';

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

const pulseKeyframe = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1); }
  100% { transform: scale(0.95); }
`;

type LoadingState = 'idle' | 'fetching_twitch' | 'analyzing_brand' | 'done';

interface LoadingAnimationProps {
  loadingState: LoadingState;
}

const LoadingAnimation = ({ loadingState }: LoadingAnimationProps) => {
  const { colorMode } = useColorMode();
  const pulseAnimation = `${pulseKeyframe} 2s ease-in-out infinite`;

  const getLoadingText = () => {
    switch (loadingState) {
      case 'fetching_twitch':
        return {
          title: 'Retrieving Twitch Data',
          description: 'Fetching streamer information from Twitch...'
        };
      case 'analyzing_brand':
        return {
          title: 'Analyzing Brand Fit',
          description: 'Evaluating content, engagement, and brand potential...'
        };
      default:
        return {
          title: 'Evaluating Streamer',
          description: 'Processing data...'
        };
    }
  };

  const loadingText = getLoadingText();

  return (
    <VStack spacing={8} align="center" py={12}>
      <Box
        animation={pulseAnimation}
        bg={colorMode === 'light' ? 'blue.500' : 'blue.200'}
        w="100px"
        h="100px"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner
          thickness="4px"
          speed="0.65s"
          color={colorMode === 'light' ? 'white' : 'blue.500'}
          size="xl"
        />
      </Box>

      <VStack spacing={2}>
        <Text
          fontSize="xl"
          fontWeight="semibold"
          color={colorMode === 'light' ? 'gray.700' : 'gray.100'}
        >
          {loadingText.title}
        </Text>
        <Text
          color={colorMode === 'light' ? 'gray.600' : 'gray.400'}
          textAlign="center"
        >
          {loadingText.description}
        </Text>
      </VStack>
    </VStack>
  );
};

export default function Evaluate() {
  const router = useRouter();
  const { username } = router.query;
  const [twitchUrl, setTwitchUrl] = useState(typeof username === "string" ? username : "");
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [evaluation, setEvaluation] = useState<Streamer | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchCompanyProfile() {
      if (!user) return;
      
      try {
        const companyDoc = await getDoc(doc(db, `users/${user.uid}/companyProfile/main`));
        if (companyDoc.exists()) {
          const profile = companyDoc.data() as CompanyProfile;
          setCompanyProfile(profile);
          // Remove automatic recalculation on profile load
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load company profile',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }

    fetchCompanyProfile();
  }, [user]);

  const formatTwitchUrl = (input: string): string => {
    // If it's already a URL, return as is
    if (input.includes('twitch.tv/')) {
      return input;
    }
    // If it's just a username, convert to URL
    return `https://twitch.tv/${input}`;
  };

  const extractTwitchUsername = (input: string): string | null => {
    // Remove whitespace
    input = input.trim();

    // If it's a URL, extract username
    if (input.includes('twitch.tv/')) {
      try {
        const urlObj = new URL(input);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        const username = pathSegments.slice(-1)[0]; // Get first path segment after domain
        return validateTwitchUsername(username);
      } catch {
        // If URL parsing fails, try to extract username directly
        const match = input.match(/twitch\.tv\/([a-zA-Z0-9_]{4,25})/);
        return match ? match[1] : null;
      }
    }

    // If it's just a username, validate and return
    return validateTwitchUsername(input);
  };

  const validateTwitchUsername = (username: string): string | null => {
    // Check length (4-25 characters)
    if (username.length < 4 || username.length > 25) {
      return null;
    }

    // Check characters (only letters, numbers, underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return null;
    }

    return username.toLowerCase(); // Twitch usernames are case-insensitive
  };

  const processWithClaude = async (twitchData: TwitchStreamer): Promise<Streamer> => {
    try {
      const response = await fetch('/api/analyze-streamer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(twitchData),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze streamer data');
      }

      return await response.json();
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to analyze streamer data');
    }
  };

  const handleEvaluate = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in to evaluate streamers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const username = extractTwitchUsername(twitchUrl);
      
      if (!username) {
        console.log('Invalid Username', twitchUrl, username);
        toast({
          title: 'Invalid Username',
          description: 'Please enter a valid Twitch username (4-25 characters, letters, numbers, and underscores only)',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setLoadingState('idle');
        return;
      }

      setLoadingState('fetching_twitch');
      
      // Update the input to show the clean username format
      setTwitchUrl(`https://twitch.tv/${username}`);

      // Step 1: Check user's analysis cache
      const userAnalysisRef = doc(db, `users/${user.uid}/streamerAnalysis`, username.toLowerCase());
      const userAnalysisDoc = await getDoc(userAnalysisRef);
      
      let streamerData: Streamer | null = null;
      let globalStreamerData: GlobalStreamerData | null = null;

      if (userAnalysisDoc.exists()) {
        // User has analyzed this streamer before
        const userAnalysis = userAnalysisDoc.data();
        
        // Get global data
        const globalStreamerRef = doc(db, 'streamers', username.toLowerCase());
        const globalStreamerDoc = await getDoc(globalStreamerRef);
        
        if (globalStreamerDoc.exists()) {
          globalStreamerData = globalStreamerDoc.data() as GlobalStreamerData;
          const baseStreamer = mapToStreamer(globalStreamerData);
          
          // Combine with user's analysis
          streamerData = {
            ...baseStreamer,
            aiScore: userAnalysis.aiScore,
            relevanceScore: userAnalysis.relevanceScore || 0,
            aiSummary: userAnalysis.aiSummary || '',
            aiRecommendation: userAnalysis.aiRecommendation || ''
          };
        }
      }

      if (!streamerData) {
        // Step 2: Check global Twitch database
        const globalStreamerRef = doc(db, 'streamers', username.toLowerCase());
        const globalStreamerDoc = await getDoc(globalStreamerRef);
        
        if (globalStreamerDoc.exists()) {
          // Use cached Twitch data but generate fresh analysis
          globalStreamerData = globalStreamerDoc.data() as GlobalStreamerData;
          const baseStreamer = mapToStreamer(globalStreamerData);
          
          setLoadingState('analyzing_brand');
          // Process with Claude for fresh analysis
          const processedData = await processWithClaude({
            name: globalStreamerData.name,
            image: globalStreamerData.image,
            followers: globalStreamerData.followers,
            description: globalStreamerData.description,
            socials: [],
            panelElements: globalStreamerData.panelElements || [],
            panelImageURLs: globalStreamerData.panelImageURLs || [],
            panelLinkUrls: globalStreamerData.panelLinkUrls || []
          });

          streamerData = {
            ...baseStreamer,
            ...processedData,
            id: username.toLowerCase()
          };
        } else {
          // Step 3: Fetch from Twitch API and process with Claude
          const twitchResponse = await fetch(`/api/fetch-twitch-data?username=${username}`);
          if (!twitchResponse.ok) {
            throw new Error('Failed to fetch Twitch data');
          }
          
          const twitchData: TwitchStreamer = await twitchResponse.json();
          
          setLoadingState('analyzing_brand');
          streamerData = await processWithClaude(twitchData);
          
          // Cache the Twitch data globally
          const globalData: GlobalStreamerData = {
            id: username.toLowerCase(),
            username: username.toLowerCase(),
            name: streamerData.name,
            image: streamerData.image,
            followers: streamerData.followers,
            views: 0,
            description: streamerData.description,
            language: 'en',
            createdAt: new Date().toISOString(),
            lastStreamedAt: new Date().toISOString(),
            averageViewers: 0,
            peakViewers: 0,
            streamTitle: '',
            game_name: streamerData.categories[0] || '',
            tags: streamerData.tags,
            sponsors: streamerData.sponsors || [],
            panelElements: twitchData.panelElements || [],
            panelImageURLs: twitchData.panelImageURLs || [],
            panelLinkUrls: twitchData.panelLinkUrls || []
          };

          await setDoc(doc(db, 'streamers', username.toLowerCase()), globalData);
        }
      }

      if (streamerData) {
        setLoadingState('analyzing_brand');
        let evaluationWithScores = { ...streamerData };

        // Calculate brand-specific scores
        if (companyProfile) {
          // Get brand fit analysis and score from Claude
          const analysisResponse = await fetch('/api/analyze-brand-fit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              streamer: streamerData,
              company: companyProfile
            })
          });

          if (!analysisResponse.ok) {
            throw new Error('Failed to analyze brand fit');
          }

          const { aiSummary, aiRecommendation, relevanceScore } = await analysisResponse.json();
          
          evaluationWithScores = {
            ...evaluationWithScores,
            relevanceScore,
            aiSummary,
            aiRecommendation
          };
        }

        // Calculate non-brand-specific score
        const aiScore = calculateAIScore(streamerData);
        evaluationWithScores.aiScore = aiScore;

        // Save user-specific analysis and history
        const batch = writeBatch(db);
        
        // Save analysis
        const analysisRef = doc(db, `users/${user.uid}/streamerAnalysis`, username.toLowerCase());
        batch.set(analysisRef, {
          aiScore,
          relevanceScore: evaluationWithScores.relevanceScore ?? null,
          aiSummary: evaluationWithScores.aiSummary || null,
          aiRecommendation: evaluationWithScores.aiRecommendation || null,
          updatedAt: serverTimestamp()
        });

        // Add to user's history
        const historyRef = doc(db, `users/${user.uid}/history`, username.toLowerCase());
        batch.set(historyRef, {
          streamerId: username.toLowerCase(),
          name: streamerData.name,
          image: streamerData.image,
          followers: streamerData.followers,
          aiScore,
          relevanceScore: evaluationWithScores.relevanceScore ?? null,
          lastAnalyzed: serverTimestamp(),
          categories: streamerData.categories,
          tags: streamerData.tags,
          sponsors: streamerData.sponsors || []
        });

        await batch.commit();

        // Get the latest global data to ensure we have all fields
        const globalStreamerRef = doc(db, 'streamers', username.toLowerCase());
        const globalStreamerDoc = await getDoc(globalStreamerRef);
        
        if (globalStreamerDoc.exists()) {
          const globalData = globalStreamerDoc.data() as GlobalStreamerData;
          evaluationWithScores = {
            ...mapToStreamer(globalData), // This ensures we have all fields including sponsors
            ...evaluationWithScores // This overwrites with our new scores
          };
        }

        setEvaluation(evaluationWithScores);
        setLoadingState('done');
      }

    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to evaluate streamer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoadingState('idle');
    }
  };

  useEffect(() => {
    if (typeof username === 'string' && companyProfile !== null) {
      handleEvaluate();
    }
  }, [username, companyProfile]);

  return (
    <ProtectedRoute>
      <Layout>
        <VStack spacing={8} align="stretch" maxW="800px" mx="auto">
          <Box>
            <Heading size="lg" mb={2}>Evaluate Streamer</Heading>
            <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
              Enter a Twitch URL or username to analyse their potential
            </Text>
          </Box>

          <Card p={6} bg={colorMode === 'light' ? 'white' : 'gray.800'}>
            <VStack spacing={4}>
              <Input
                placeholder="https://twitch.tv/username or just username"
                value={twitchUrl}
                onChange={(e) => setTwitchUrl(e.target.value)}
                size="lg"
                bg={colorMode === 'light' ? 'white' : 'gray.700'}
                borderColor={colorMode === 'light' ? 'gray.200' : 'gray.600'}
                _hover={{
                  borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300'
                }}
                _focus={{
                  borderColor: colorMode === 'light' ? 'blue.500' : 'blue.300',
                  boxShadow: `0 0 0 1px ${colorMode === 'light' ? 'blue.500' : 'blue.300'}`
                }}
              />
              <Button
                colorScheme={colorMode === 'light' ? 'blue' : 'gray'}
                onClick={handleEvaluate}
                isLoading={loadingState !== 'idle' && loadingState !== 'done'}
                loadingText="Evaluating..."
                width="full"
                size="lg"
                bg={colorMode === 'light' ? 'blue.500' : 'gray.700'}
                color={colorMode === 'light' ? 'white' : 'gray.100'}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                  bg: colorMode === 'light' ? 'blue.600' : 'gray.600'
                }}
                _active={{
                  bg: colorMode === 'light' ? 'blue.700' : 'gray.500'
                }}
                transition="all 0.2s"
              >
                Evaluate
              </Button>
            </VStack>
          </Card>

          {loadingState !== 'idle' && loadingState !== 'done' ? (
            <LoadingAnimation loadingState={loadingState} />
          ) : evaluation && (
            <Box>
              <Heading size="md" mb={4}>Evaluation Result</Heading>
              <StreamerCard 
                streamer={evaluation} 
                isRecomputing={false} 
                onRecompute={undefined}
                relevanceScore={evaluation.relevanceScore} 
              />
            </Box>
          )}
        </VStack>
      </Layout>
    </ProtectedRoute>
  );
} 