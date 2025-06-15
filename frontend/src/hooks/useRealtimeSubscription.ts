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

    // Create the channel
    const newChannel = supabase
      .channel(`${table}-changes`)
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
      .subscribe();

    setChannel(newChannel);

    // Cleanup subscription
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, schema, filter, handleInsert, handleUpdate, handleDelete]);

  return channel;
} 