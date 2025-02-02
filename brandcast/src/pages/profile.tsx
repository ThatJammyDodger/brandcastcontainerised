import { Box, VStack, Heading, Text, Card, CardBody, Icon, Link, Flex, useColorMode, Button } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import { FiMail, FiPhone } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';

export default function Profile() {
  const { colorMode } = useColorMode();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="800px" mx="auto">
        <Box>
          <Heading size="lg" mb={2}>Account Settings</Heading>
          <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Manage your account information and preferences
          </Text>
        </Box>

        <Card
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
        >
          <CardBody>
            <VStack spacing={6} align="start">
              <Box width="full">
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm" mb={1}>
                  Profile
                </Text>
                <Heading size="md" mb={4} color={colorMode === 'light' ? 'gray.700' : 'white'}>
                  Personal Information
                </Heading>
                <Box py={2} borderBottom="1px" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}>
                  <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm">
                    Email
                  </Text>
                  <Text color={colorMode === 'light' ? 'gray.800' : 'gray.100'} fontWeight="medium">
                    {user.email}
                  </Text>
                </Box>
                <Box py={2} borderBottom="1px" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}>
                  <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm">
                    User ID
                  </Text>
                  <Text color={colorMode === 'light' ? 'gray.800' : 'gray.100'} fontSize="sm" fontFamily="mono">
                    {user.uid}
                  </Text>
                </Box>
              </Box>

              <Box width="full">
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm" mb={1}>
                  Account
                </Text>
                <Heading size="md" mb={4} color={colorMode === 'light' ? 'gray.700' : 'white'}>
                  Account Management
                </Heading>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={handleLogout}
                  _hover={{
                    bg: colorMode === 'light' ? 'red.50' : 'red.900',
                    borderColor: colorMode === 'light' ? 'red.500' : 'red.700'
                  }}
                  borderColor={colorMode === 'light' ? 'red.500' : 'red.700'}
                  color={colorMode === 'light' ? 'red.500' : 'red.400'}
                >
                  Sign Out
                </Button>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  );
} 