import { useCallback, useState } from 'react';

interface UseBrainDrawerDataProps {
  agentId: string;
  leadId: string;
}

interface BrainDrawerData {
  chatMessages: any[];
  chatSessions: any[];
  internalReasoning?: any;
  sentimento?: string;
  problema?: string;
  renegociacao?: any;
  memoryData?: any;
}

export function useBrainDrawerData({ agentId, leadId }: UseBrainDrawerDataProps) {
  const [data, setData] = useState<BrainDrawerData>({
    chatMessages: [],
    chatSessions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrainData = useCallback(async () => {
    if (!leadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/agents/${agentId}/brain/${leadId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch brain data: ${response.statusText}`);
      }
      
      const brainData: BrainDrawerData = await response.json();
      setData(brainData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.warn(`[BrainDrawer] Failed to fetch data for ${agentId}/${leadId}:`, message);
    } finally {
      setLoading(false);
    }
  }, [agentId, leadId]);

  return { data, loading, error, fetchBrainData };
}
