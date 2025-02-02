import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Select
} from '@chakra-ui/react';

interface StreamerSearchProps {
  onSearch: (username: string) => Promise<void>;
  sortType: string;
  onSortChange: (value: string) => void;
  isLoading: boolean;
}

export const StreamerSearch = ({
  onSearch,
  sortType,
  onSortChange,
  isLoading
}: StreamerSearchProps) => {
  const [username, setUsername] = useState('');
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a Twitch username',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    await onSearch(username.trim());
  };

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Twitch Username</FormLabel>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Twitch username"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Sort By</FormLabel>
          <Select value={sortType} onChange={(e) => onSortChange(e.target.value)}>
            <option value="relevance">Brand Match</option>
            <option value="aiScore">AI Score</option>
            <option value="followers">Followers</option>
          </Select>
        </FormControl>

        <Button
          colorScheme="blue"
          onClick={handleSubmit}
          isLoading={isLoading}
        >
          Analyse Streamer
        </Button>
      </VStack>
    </Box>
  );
}; 