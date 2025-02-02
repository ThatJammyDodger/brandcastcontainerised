import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useColorMode,
  useToast,
  Container,
  Card,
  CardBody,
  HStack,
  FormErrorMessage,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/hooks/useAuth';
import { useRouter } from 'next/router';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string>('');
  const { login, signup, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { colorMode } = useColorMode();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');  // Clear any previous errors
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      if (isRegistering) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push('/');
    } catch (error: any) {
      // Show error in the form
      const errorMessage = error.code ? getAuthErrorMessage(error.code) : 'An error occurred. Please try again.';
      setError(errorMessage);
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      <Container maxW="container.sm" pt={20}>
        <Card bg={colorMode === 'light' ? 'white' : 'gray.800'}>
          <CardBody>
            <VStack spacing={8} as="form" onSubmit={handleSubmit}>
              <Box textAlign="center">
                <Heading size="lg" mb={2}>{isRegistering ? 'Create Account' : 'Welcome Back'}</Heading>
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
                  {isRegistering ? 'Sign up to get started with Brandcast' : 'Sign in to continue to Brandcast'}
                </Text>
              </Box>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              <VStack spacing={4} w="100%">
                <FormControl isRequired isInvalid={!!error}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(''); // Clear error when user types
                    }}
                    placeholder="Enter your email"
                  />
                </FormControl>

                <FormControl isRequired isInvalid={!!error}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(''); // Clear error when user types
                    }}
                    placeholder="Enter your password"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  isLoading={loading}
                >
                  {isRegistering ? 'Sign Up' : 'Sign In'}
                </Button>

                <HStack spacing={2} w="100%" justify="center">
                  <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'}>
                    {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                  </Text>
                  <Button
                    variant="link"
                    color={colorMode === 'light' ? 'blue.500' : 'blue.200'}
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError(''); // Clear error when switching modes
                    }}
                  >
                    {isRegistering ? 'Sign In' : 'Sign Up'}
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
} 