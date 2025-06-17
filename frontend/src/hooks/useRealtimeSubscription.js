import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
export function useRealtimeSubscription({ table, schema = 'public', filter, onInsert, onUpdate, onDelete, }) {
    const [channel, setChannel] = useState(null);
<<<<<<< HEAD
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const setupSubscription = useCallback(async () => {
        if (!filter) {
            return null;
        }
        try {
            const channelName = `${table}-changes-${filter}`;
            const newChannel = supabase
                .channel(channelName)
                .on('postgres_changes', {
                event: '*',
                schema,
                table,
                filter,
            }, (payload) => {
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
            })
                .on('subscription_error', (error) => {
                setError(error);
                setIsConnected(false);
            })
                .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setError(null);
                    setIsConnected(true);
                    setChannel(newChannel);
                }
                else if (status === 'CLOSED') {
                    setIsConnected(false);
                }
            });
            return newChannel;
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsConnected(false);
            return null;
        }
    }, [table, schema, filter, onInsert, onUpdate, onDelete]);
    useEffect(() => {
        let mounted = true;
        let currentChannel = null;
        let reconnectTimeout;
        const connect = async () => {
            if (!mounted)
                return;
            if (currentChannel) {
                await supabase.removeChannel(currentChannel);
=======
    const handleInsert = useCallback((payload) => {
        onInsert?.(payload);
    }, [onInsert]);
    const handleUpdate = useCallback((payload) => {
        onUpdate?.(payload);
    }, [onUpdate]);
    const handleDelete = useCallback((payload) => {
        onDelete?.(payload);
    }, [onDelete]);
    useEffect(() => {
        if (!table)
            return;
        // Create the channel
        const newChannel = supabase
            .channel(`${table}-changes`)
            .on('postgres_changes', {
            event: '*',
            schema,
            table,
            filter,
        }, (payload) => {
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
            currentChannel = await setupSubscription();
            if (!currentChannel && mounted) {
                reconnectTimeout = setTimeout(connect, 5000);
            }
        };
<<<<<<< HEAD
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
=======
    }, [table, schema, filter, handleInsert, handleUpdate, handleDelete]);
    return channel;
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
}
