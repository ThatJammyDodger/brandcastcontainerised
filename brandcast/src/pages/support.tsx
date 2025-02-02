import { Box, VStack, Heading, Text, Card, CardBody, Icon, Link, Flex, useColorMode } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import { FiMail, FiPhone } from 'react-icons/fi';

export default function Support() {
  const { colorMode } = useColorMode();

  return (
    <Layout>
      <VStack spacing={8} align="stretch" maxW="800px" mx="auto">
        <Box>
          <Heading size="lg" mb={2}>Support</Heading>
          <Text color={colorMode === 'light' ? 'gray.600' : 'gray.300'}>
            Get help from our team
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
                  Contact
                </Text>
                <Heading size="md" mb={4} color={colorMode === 'light' ? 'gray.700' : 'white'}>
                  Contact Information
                </Heading>
                <Box py={2} borderBottom="1px" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}>
                  <Flex align="center">
                    <Icon as={FiMail} boxSize={5} color={colorMode === 'light' ? 'blue.500' : 'blue.400'} mr={3} />
                    <Box>
                      <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm">
                        Email
                      </Text>
                      <Link 
                        href="mailto:developer@brandcast.com"
                        color={colorMode === 'light' ? 'gray.800' : 'gray.100'}
                        fontWeight="medium"
                        _hover={{ color: colorMode === 'light' ? 'blue.500' : 'blue.400' }}
                      >
                        developer@brandcast.com
                      </Link>
                    </Box>
                  </Flex>
                </Box>
                <Box py={2} borderBottom="1px" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}>
                  <Flex align="center">
                    <Icon as={FiPhone} boxSize={5} color={colorMode === 'light' ? 'blue.500' : 'blue.400'} mr={3} />
                    <Box>
                      <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm">
                        Phone
                      </Text>
                      <Link 
                        href="tel:+44-20-7123-4567"
                        color={colorMode === 'light' ? 'gray.800' : 'gray.100'}
                        fontWeight="medium"
                        _hover={{ color: colorMode === 'light' ? 'blue.500' : 'blue.400' }}
                      >
                        +44 (20) 7123 4567
                      </Link>
                    </Box>
                  </Flex>
                </Box>
              </Box>

              <Box width="full">
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm" mb={1}>
                  Hours
                </Text>
                <Heading size="md" mb={4} color={colorMode === 'light' ? 'gray.700' : 'white'}>
                  Support Hours
                </Heading>
                <Box py={2} borderBottom="1px" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}>
                  <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm">
                    Monday - Friday
                  </Text>
                  <Text color={colorMode === 'light' ? 'gray.800' : 'gray.100'} fontWeight="medium">
                    9:00 AM - 5:00 PM GMT
                  </Text>
                </Box>
                <Box py={2} borderBottom="1px" borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}>
                  <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm">
                    Saturday - Sunday
                  </Text>
                  <Text color={colorMode === 'light' ? 'gray.800' : 'gray.100'} fontWeight="medium">
                    Closed
                  </Text>
                </Box>
              </Box>

              <Box width="full">
                <Text color={colorMode === 'light' ? 'gray.600' : 'gray.400'} fontSize="sm" mb={1}>
                  Note
                </Text>
                <Box
                  mt={2}
                  p={4}
                  borderRadius="md"
                  bg={colorMode === 'light' ? 'blue.50' : 'blue.900'}
                  color={colorMode === 'light' ? 'gray.700' : 'gray.100'}
                >
                  <Text fontSize="sm">
                    For urgent matters outside of business hours, please email us and we'll respond as soon as possible on the next business day.
                  </Text>
                </Box>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  );
} 