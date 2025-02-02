import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Spinner,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Progress,
  Badge,
  Button,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/router';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface StreamerResult {
  username: string;
  probability: number;
}

interface StreamerAnalysis {
  username: string;
  aiSummary: string;
  aiRecommendation: string;
  relevanceScore: number;
  loading: boolean;
}

interface ClaudeAnalysis {
  username: string;
  aiSummary: string;
  aiRecommendation: string;
  relevanceScore: number;
}

async function analyzeStreamersWithClaude(streamers: StreamerResult[]): Promise<ClaudeAnalysis[]> {
  const url = `/api/analyze-streamers`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ streamers }),
  });
  const data = await response.json();
  console.log(data);
  return data.analyses;
}

function FindStreamersContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [streamers, setStreamers] = useState<StreamerAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndAnalyzeStreamers = async () => {
      if (!user) {
        console.log('No user found, returning early');
        return;
      }

      if (isLoading) {
        console.log('Already loading, returning early');
        return;
      }

      setIsLoading(true);

      try {
        // First, get user's history
        const historySnapshot = await getDocs(collection(db, `users/${user.uid}/history`));
        const analyzedStreamerIds = new Set(historySnapshot.docs.map(doc => doc.id.toLowerCase()));

        // Fetch streamers from ngrok endpoint
        const url = `/api/streamerSearch/${user.uid}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format from Twitch API');
        }

        if (data.length === 0) {
          throw new Error('No streamers found. Please try again later.');
        }

        // Filter out streamers that are already in history
        const newStreamers = data.filter(s => !analyzedStreamerIds.has(s.username.toLowerCase()));

        if (newStreamers.length === 0) {
          throw new Error('All suggested streamers have already been analyzed. Please try again.');
        }

        // Get top three from remaining streamers
        const topThree = newStreamers.slice(0, 3).map(s => {
          if (!s || !s.username) {
            throw new Error('Invalid streamer data received');
          }
          return s;
        });

        // Set initial loading state
        setStreamers(topThree.map(s => ({
          username: s.username,
          aiSummary: '',
          aiRecommendation: '',
          relevanceScore: 0,
          loading: true
        })));

        // Analyze all streamers with Claude
        const analyses = await analyzeStreamersWithClaude(topThree);
        
        // Map the analyses back to our streamers
        const analyzedResults = analyses.map((analysis: ClaudeAnalysis) => ({
          username: analysis.username,
          aiSummary: analysis.aiSummary,
          aiRecommendation: analysis.aiRecommendation,
          relevanceScore: analysis.relevanceScore,
          loading: false,
        }));

        setStreamers(analyzedResults);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchAndAnalyzeStreamers:', error);
        setError(
          error instanceof Error 
            ? `Error: ${error.message}` 
            : 'Failed to fetch streamers. Please try again later.'
        );
        setIsLoading(false);
      }
    };

    fetchAndAnalyzeStreamers();
  }, [user]);

  const handleEvaluate = (username: string) => {
    router.push({
      pathname: '/evaluate',
      query: { username }
    });
  };

  if (error) {
    return (
      <Box>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Finding relevant streamers...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {streamers.map((streamer, index) => (
            <Card key={streamer.username}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">{streamer.username}</Heading>
                  {streamer.loading ? (
                    <VStack spacing={4}>
                      <Spinner />
                      <Text>Analyzing fit...</Text>
                    </VStack>
                  ) : (
                    <>
                      <Box>
                        <Text fontWeight="bold" mb={2}>Brand Fit Score</Text>
                        <Progress
                          value={streamer.relevanceScore * 100}
                          colorScheme={streamer.relevanceScore >= 0.7 ? 'green' : streamer.relevanceScore >= 0.5 ? 'yellow' : 'red'}
                          mb={2}
                        />
                        <Badge
                          colorScheme={streamer.relevanceScore >= 0.7 ? 'green' : streamer.relevanceScore >= 0.5 ? 'yellow' : 'red'}
                        >
                          {(streamer.relevanceScore * 10).toFixed(1)}/10
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={2}>AI Summary</Text>
                        <Text fontSize="sm">{streamer.aiSummary}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" mb={2}>Recommendations</Text>
                        <Text fontSize="sm">{streamer.aiRecommendation}</Text>
                      </Box>
                      <Button
                        colorScheme="blue"
                        onClick={() => handleEvaluate(streamer.username)}
                        isLoading={streamer.loading}
                      >
                        Evaluate and Save
                      </Button>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}

export default function FindStreamers() {
  return (
    <ProtectedRoute>
      <Layout>
        <FindStreamersContent />
      </Layout>
    </ProtectedRoute>
  );
} 