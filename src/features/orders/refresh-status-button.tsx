'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { refreshOrderStatus } from '@/app/actions/orders';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface RefreshStatusButtonProps {
  orderId: string;
  onRefresh?: (status: any) => void;
}

export function RefreshStatusButton({ orderId, onRefresh }: RefreshStatusButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      const result = await refreshOrderStatus(orderId);

      if (result.success && result.latestStatus) {
        toast.success('Order status updated!', {
          description: `Current status: ${result.latestStatus.status}`,
        });

        if (onRefresh) {
          onRefresh(result.latestStatus);
        }

        // Refresh the page data
        router.refresh();
      } else {
        toast.error('Failed to refresh status', {
          description: result.error || 'Could not fetch latest status from Thanks.io',
        });
      }
    } catch (error: any) {
      console.error('Error refreshing status:', error);
      toast.error('Error refreshing status', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
    </Button>
  );
}
