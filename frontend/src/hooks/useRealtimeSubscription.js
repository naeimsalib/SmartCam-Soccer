import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
export function useRealtimeSubscription({ table, schema = 'public', filter, onInsert, onUpdate, onDelete, }) {
    const [channel, setChannel] = useState(null);
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
            }
        })
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
