import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface WireframeRequest {
  type: 'search' | 'form';
  title: string;
  filters?: string[];
  columns?: string[];
  fields?: Array<{
    name: string;
    type: string;
    mandatory?: boolean;
    length?: number;
  }>;
}

interface WireframeResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  type: string;
}

export function useWireframeGenerator() {
  return useMutation<WireframeResponse, Error, WireframeRequest>({
    mutationFn: async (data) => {
      const response = await apiRequest('POST', '/api/generate-wireframe', data);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate wireframe');
      }
      
      return result;
    },
  });
}