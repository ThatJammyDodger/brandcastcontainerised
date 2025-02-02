import { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  useToast,
  Card,
  useColorMode,
  FormControl,
  FormLabel,
  Select,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Divider,
} from '@chakra-ui/react';
import { FiPlus, FiUpload } from 'react-icons/fi';
import Layout from '@/components/Layout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';

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
}

export default function CompanyProfile() {
  const initialProfile: CompanyProfile = {
    name: '',
    description: '',
    industry: '',
    targetAudience: {
      ageRange: '',
      interests: [],
      demographics: [],
    },
    adContent: {
      description: '',
      tone: '',
      keywords: [],
    },
  };

  const [profile, setProfile] = useState<CompanyProfile>(initialProfile);
  const [newInterest, setNewInterest] = useState('');
  const [newDemographic, setNewDemographic] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const { setCompanyProfile } = useCompany();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const docRef = doc(db, `users/${user.uid}/companyProfile/main`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Raw profile data:', data); // Debug log

        // Initialize empty objects if they don't exist
        if (!data.targetAudience) {
          data.targetAudience = {};
        }
        if (!data.adContent) {
          data.adContent = {};
        }

        const loadedProfile: CompanyProfile = {
          name: data.name || '',
          description: data.description || '',
          industry: data.industry || '',
          targetAudience: {
            ageRange: data.targetAudience.ageRange || '',
            interests: Array.isArray(data.targetAudience.interests) ? data.targetAudience.interests : [],
            demographics: Array.isArray(data.targetAudience.demographics) ? data.targetAudience.demographics : [],
          },
          adContent: {
            description: data.adContent.description || '',
            tone: data.adContent.tone || '',
            keywords: Array.isArray(data.adContent.keywords) ? data.adContent.keywords : [],
          },
        };

        console.log('Processed profile data:', loadedProfile); // Debug log
        setProfile(loadedProfile);
        setCompanyProfile(loadedProfile);
      } else {
        // If no profile exists, create one with initial data
        const newProfile = { ...initialProfile };
        await setDoc(doc(db, `users/${user.uid}/companyProfile/main`), newProfile);
        setProfile(newProfile);
        setCompanyProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error loading profile',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Validate required fields
      if (!profile.name || !profile.industry) {
        toast({
          title: 'Missing required fields',
          description: 'Please fill in company name and industry',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Ensure all arrays exist and are valid
      const updatedProfile = {
        name: profile.name || '',
        description: profile.description || '',
        industry: profile.industry || '',
        targetAudience: {
          ageRange: profile.targetAudience?.ageRange || '',
          interests: Array.isArray(profile.targetAudience?.interests) ? profile.targetAudience.interests : [],
          demographics: Array.isArray(profile.targetAudience?.demographics) ? profile.targetAudience.demographics : [],
        },
        adContent: {
          description: profile.adContent?.description || '',
          tone: profile.adContent?.tone || '',
          keywords: Array.isArray(profile.adContent?.keywords) ? profile.adContent.keywords : [],
        },
        updatedAt: Date.now(),
      };

      console.log('Saving profile:', updatedProfile); // Debug log

      // Save to Firebase under user's collection
      await setDoc(doc(db, `users/${user.uid}/companyProfile/main`), updatedProfile);

      // Update global company profile state
      setCompanyProfile(updatedProfile);

      // Clear cached scores since company profile changed
      const scoresRef = collection(db, `users/${user.uid}/streamerScores`);
      const scoresSnapshot = await getDocs(scoresRef);
      const batch = writeBatch(db);
      
      scoresSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      toast({
        title: 'Success',
        description: 'Company profile saved successfully',
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error saving profile',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = (field: 'interests' | 'demographics' | 'keywords', value: string) => {
    if (!value.trim()) return;
    
    if (field === 'keywords') {
      setProfile({
        ...profile,
        adContent: {
          ...profile.adContent,
          keywords: [...profile.adContent.keywords, value.trim()],
        },
      });
    } else {
      setProfile({
        ...profile,
        targetAudience: {
          ...profile.targetAudience,
          [field]: [...profile.targetAudience[field], value.trim()],
        },
      });
    }
  };

  const removeItem = (field: 'interests' | 'demographics' | 'keywords', index: number) => {
    if (field === 'keywords') {
      const newKeywords = [...profile.adContent.keywords];
      newKeywords.splice(index, 1);
      setProfile({
        ...profile,
        adContent: {
          ...profile.adContent,
          keywords: newKeywords,
        },
      });
    } else {
      const newItems = [...profile.targetAudience[field]];
      newItems.splice(index, 1);
      setProfile({
        ...profile,
        targetAudience: {
          ...profile.targetAudience,
          [field]: newItems,
        },
      });
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Box 
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}
          overflowY="auto"
          pt="64px" // Account for the header height
        >
          <VStack spacing={8} align="stretch" maxW="800px" mx="auto" p={8} pb={16}>
            <Box>
              <Heading size="lg" mb={2}>Company Profile</Heading>
              <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
                Configure your company's advertising preferences
              </Text>
            </Box>

            <Tabs variant="line">
              <TabList mb={4}>
                <Tab
                  _selected={{
                    color: colorMode === 'light' ? 'blue.500' : 'blue.200',
                    borderColor: colorMode === 'light' ? 'blue.500' : 'blue.200',
                  }}
                  _hover={{
                    color: colorMode === 'light' ? 'blue.400' : 'blue.300',
                  }}
                >
                  View Current Data
                </Tab>
                <Tab
                  _selected={{
                    color: colorMode === 'light' ? 'blue.500' : 'blue.200',
                    borderColor: colorMode === 'light' ? 'blue.500' : 'blue.200',
                  }}
                  _hover={{
                    color: colorMode === 'light' ? 'blue.400' : 'blue.300',
                  }}
                >
                  Edit Profile
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0} pt={4}>
                  <Card p={6} bg={colorMode === 'light' ? 'white' : 'gray.800'} shadow="sm">
                    <VStack spacing={6} align="stretch">
                      <Box>
                        <Heading size="sm" mb={2}>Company Information</Heading>
                        <Divider mb={3} />
                        <Text><strong>Name:</strong> {profile.name || 'Not set'}</Text>
                        <Text><strong>Industry:</strong> {profile.industry || 'Not set'}</Text>
                        <Text whiteSpace="pre-wrap"><strong>Description:</strong> {profile.description || 'Not set'}</Text>
                      </Box>

                      <Box>
                        <Heading size="sm" mb={2}>Target Audience</Heading>
                        <Divider mb={3} />
                        <Text><strong>Age Range:</strong> {profile.targetAudience.ageRange || 'Not set'}</Text>
                        <Text><strong>Interests:</strong></Text>
                        <HStack wrap="wrap" spacing={2} mt={2}>
                          {profile.targetAudience.interests.length > 0 ? (
                            profile.targetAudience.interests.map((interest, index) => (
                              <Tag key={index} size="md" colorScheme="blue">
                                {interest}
                              </Tag>
                            ))
                          ) : (
                            <Text fontSize="sm" color="gray.500">No interests set</Text>
                          )}
                        </HStack>
                        <Text mt={3}><strong>Demographics:</strong></Text>
                        <HStack wrap="wrap" spacing={2} mt={2}>
                          {profile.targetAudience.demographics.length > 0 ? (
                            profile.targetAudience.demographics.map((demographic, index) => (
                              <Tag key={index} size="md" colorScheme="green">
                                {demographic}
                              </Tag>
                            ))
                          ) : (
                            <Text fontSize="sm" color="gray.500">No demographics set</Text>
                          )}
                        </HStack>
                      </Box>

                      <Box>
                        <Heading size="sm" mb={2}>Ad Content</Heading>
                        <Divider mb={3} />
                        <Text whiteSpace="pre-wrap"><strong>Description:</strong> {profile.adContent.description || 'Not set'}</Text>
                        <Text><strong>Tone:</strong> {profile.adContent.tone || 'Not set'}</Text>
                        <Text><strong>Keywords:</strong></Text>
                        <HStack wrap="wrap" spacing={2} mt={2}>
                          {profile.adContent.keywords.length > 0 ? (
                            profile.adContent.keywords.map((keyword, index) => (
                              <Tag key={index} size="md" colorScheme="purple">
                                {keyword}
                              </Tag>
                            ))
                          ) : (
                            <Text fontSize="sm" color="gray.500">No keywords set</Text>
                          )}
                        </HStack>
                      </Box>
                    </VStack>
                  </Card>
                </TabPanel>

                <TabPanel p={0} pt={4}>
                  <Card p={6} bg={colorMode === 'light' ? 'white' : 'gray.800'} shadow="sm">
                    <VStack spacing={6} align="stretch">
                      <FormControl>
                        <FormLabel>Company Name</FormLabel>
                        <Input
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Company Description</FormLabel>
                        <Textarea
                          value={profile.description}
                          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Industry</FormLabel>
                        <Select
                          value={profile.industry}
                          onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                        >
                          <option value="">Select Industry</option>
                          <option value="gaming">Gaming</option>
                          <option value="technology">Technology</option>
                          <option value="fashion">Fashion</option>
                          <option value="food">Food & Beverage</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="sports">Sports</option>
                          <option value="other">Other</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Target Age Range</FormLabel>
                        <Select
                          value={profile.targetAudience.ageRange}
                          onChange={(e) => setProfile({
                            ...profile,
                            targetAudience: { ...profile.targetAudience, ageRange: e.target.value }
                          })}
                        >
                          <option value="">Select Age Range</option>
                          <option value="13-17">13-17</option>
                          <option value="18-24">18-24</option>
                          <option value="25-34">25-34</option>
                          <option value="35-44">35-44</option>
                          <option value="45+">45+</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Target Interests</FormLabel>
                        <HStack mb={2}>
                          <Input
                            value={newInterest}
                            onChange={(e) => setNewInterest(e.target.value)}
                            placeholder="Add interest"
                          />
                          <IconButton
                            aria-label="Add interest"
                            icon={<FiPlus />}
                            onClick={() => {
                              addItem('interests', newInterest);
                              setNewInterest('');
                            }}
                          />
                        </HStack>
                        <HStack wrap="wrap" spacing={2}>
                          {profile.targetAudience.interests.map((interest, index) => (
                            <Tag key={index} size="md" borderRadius="full" variant="solid" colorScheme="blue">
                              <TagLabel>{interest}</TagLabel>
                              <TagCloseButton onClick={() => removeItem('interests', index)} />
                            </Tag>
                          ))}
                        </HStack>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Target Demographics</FormLabel>
                        <HStack mb={2}>
                          <Input
                            value={newDemographic}
                            onChange={(e) => setNewDemographic(e.target.value)}
                            placeholder="Add demographic"
                          />
                          <IconButton
                            aria-label="Add demographic"
                            icon={<FiPlus />}
                            onClick={() => {
                              addItem('demographics', newDemographic);
                              setNewDemographic('');
                            }}
                          />
                        </HStack>
                        <HStack wrap="wrap" spacing={2}>
                          {profile.targetAudience.demographics.map((demographic, index) => (
                            <Tag key={index} size="md" borderRadius="full" variant="solid" colorScheme="green">
                              <TagLabel>{demographic}</TagLabel>
                              <TagCloseButton onClick={() => removeItem('demographics', index)} />
                            </Tag>
                          ))}
                        </HStack>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Ad Content Description</FormLabel>
                        <Textarea
                          value={profile.adContent.description}
                          onChange={(e) => setProfile({
                            ...profile,
                            adContent: { ...profile.adContent, description: e.target.value }
                          })}
                          placeholder="Describe your typical ad content and campaign goals"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Brand Tone</FormLabel>
                        <Select
                          value={profile.adContent.tone}
                          onChange={(e) => setProfile({
                            ...profile,
                            adContent: { ...profile.adContent, tone: e.target.value }
                          })}
                        >
                          <option value="">Select Tone</option>
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="humorous">Humorous</option>
                          <option value="edgy">Edgy</option>
                          <option value="inspirational">Inspirational</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Ad Keywords</FormLabel>
                        <HStack mb={2}>
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Add keyword"
                          />
                          <IconButton
                            aria-label="Add keyword"
                            icon={<FiPlus />}
                            onClick={() => {
                              addItem('keywords', newKeyword);
                              setNewKeyword('');
                            }}
                          />
                        </HStack>
                        <HStack wrap="wrap" spacing={2}>
                          {profile.adContent.keywords.map((keyword, index) => (
                            <Tag key={index} size="md" borderRadius="full" variant="solid" colorScheme="purple">
                              <TagLabel>{keyword}</TagLabel>
                              <TagCloseButton onClick={() => removeItem('keywords', index)} />
                            </Tag>
                          ))}
                        </HStack>
                      </FormControl>

                      <Box mt={8}>
                        <Button
                          colorScheme="blue"
                          onClick={handleSave}
                          isLoading={loading}
                          width="full"
                        >
                          Save Profile
                        </Button>
                      </Box>
                    </VStack>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      </Layout>
    </ProtectedRoute>
  );
} 