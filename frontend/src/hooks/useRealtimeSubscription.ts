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

<<<<<<< HEAD
  const setupSubscription = useCallback(async () => {
    if (!filter) {
      return null;
    }

    try {
      const channelName = `${table}-changes-${filter}`;
      
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
                onInsert?.(payload.new);
                break;
              case 'UPDATE':
                onUpdate?.(payload.new);
                break;
              case 'DELETE':
                onDelete?.(payload.old);
                break;
            }
=======
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
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
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
            setChannel(newChannel);
          } else if (status === 'CLOSED') {
            setIsConnected(false);
          }
        });

<<<<<<< HEAD
      return newChannel;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnected(false);
      return null;
    }
  }, [table, schema, filter, onInsert, onUpdate, onDelete]);
=======
    setChannel(newChannel);

    // Cleanup subscription
    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, schema, filter, handleInsert, handleUpdate, handleDelete]);
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0

  useEffect(() => {
    let mounted = true;
    let currentChannel: RealtimeChannel | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = async () => {
      if (!mounted) return;

      if (currentChannel) {
        await supabase.removeChannel(currentChannel);
      }

      currentChannel = await setupSubscription();

      if (!currentChannel && mounted) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }
    };
  }, [setupSubscription]);

  return { channel, error, isConnected };
} 