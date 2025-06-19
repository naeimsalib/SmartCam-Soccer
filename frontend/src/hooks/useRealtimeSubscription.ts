import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface RealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtimeSubscription<T>({
  table,
  schema = 'public',
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: RealtimeSubscriptionOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleInsert = useCallback((payload: any) => {
    onInsert?.(payload);
  }, [onInsert]);

  const handleUpdate = useCallback((payload: any) => {
    onUpdate?.(payload);
  }, [onUpdate]);

  const handleDelete = useCallback((payload: any) => {
    onDelete?.(payload);
  }, [onDelete]);

  useEffect(() => {
    if (!table) return;

    const channelName = filter ? `${table}-changes-${filter}` : `${table}-changes`;
    
    // Create the channel
    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table,
          filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              handleInsert(payload.new);
              break;
            case 'UPDATE':
              handleUpdate(payload.new);
              break;
            case 'DELETE':
              handleDelete(payload.old);
              break;
          }
        }
      )
      .on('subscription_error', (error) => {
        setError(error);
        setIsConnected(false);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setError(null);
          setIsConnected(true);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    setChannel(newChannel);

    // Cleanup subscription
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, schema, filter, handleInsert, handleUpdate, handleDelete]);

  return { channel, error, isConnected };
} 