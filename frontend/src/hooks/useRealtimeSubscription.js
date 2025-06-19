import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
export function useRealtimeSubscription({ table, schema = 'public', filter, onInsert, onUpdate, onDelete, }) {
    const [channel, setChannel] = useState(null);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef(null);
    const isSubscribingRef = useRef(false);
    const currentChannelNameRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const handleInsert = useCallback((payload) => {
        onInsert?.(payload);
    }, [onInsert]);
    const handleUpdate = useCallback((payload) => {
        onUpdate?.(payload);
    }, [onUpdate]);
    const handleDelete = useCallback((payload) => {
        onDelete?.(payload);
    }, [onDelete]);
    const cleanup = useCallback(() => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        if (channelRef.current) {
            try {
                supabase.removeChannel(channelRef.current);
            }
            catch (e) {
                // Silent cleanup
            }
            channelRef.current = null;
            setChannel(null);
            setIsConnected(false);
        }
    }, []);
    const createSubscription = useCallback(() => {
        if (!table || !filter)
            return;
        const channelName = `${table}-changes-${filter}`;
        // If the channel name hasn't changed and we already have an active subscription, don't recreate
        if (currentChannelNameRef.current === channelName && channelRef.current && isConnected) {
            return;
        }
        // Clean up existing channel before creating a new one
        cleanup();
        // Prevent race conditions during subscription setup
        if (isSubscribingRef.current) {
            return;
        }
        isSubscribingRef.current = true;
        currentChannelNameRef.current = channelName;
        // Create the channel
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
                    handleInsert(payload.new);
                    break;
                case 'UPDATE':
                    handleUpdate(payload.new);
                    break;
                case 'DELETE':
                    handleDelete(payload.old);
                    break;
            }
        })
            .on('subscription_error', (error) => {
            setError(error);
            setIsConnected(false);
            isSubscribingRef.current = false;
        })
            .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setError(null);
                setIsConnected(true);
                isSubscribingRef.current = false;
            }
            else if (status === 'CLOSED') {
                setIsConnected(false);
                isSubscribingRef.current = false;
            }
            else if (status === 'CHANNEL_ERROR') {
                setError(new Error('Channel subscription failed'));
                setIsConnected(false);
                isSubscribingRef.current = false;
            }
            else if (status === 'TIMED_OUT') {
                setIsConnected(false);
                isSubscribingRef.current = false;
                // Retry after 5 seconds
                retryTimeoutRef.current = setTimeout(() => {
                    cleanup();
                    createSubscription();
                }, 5000);
            }
        });
        channelRef.current = newChannel;
        setChannel(newChannel);
    }, [table, schema, filter, handleInsert, handleUpdate, handleDelete, cleanup, isConnected]);
    useEffect(() => {
        if (!table || !filter) {
            cleanup();
            return;
        }
        createSubscription();
        // Cleanup subscription
        return () => {
            isSubscribingRef.current = false;
            currentChannelNameRef.current = null;
            cleanup();
        };
    }, [table, schema, filter, createSubscription, cleanup]);
    return { channel, error, isConnected };
}
