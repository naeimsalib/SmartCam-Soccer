import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
export function useRealtimeSubscription({ table, schema = 'public', filter, onInsert, onUpdate, onDelete, }) {
    const [channel, setChannel] = useState(null);
    useEffect(() => {
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
            .subscribe();
        setChannel(newChannel);
        // Cleanup subscription
        return () => {
            if (newChannel) {
                supabase.removeChannel(newChannel);
            }
        };
    }, [table, schema, filter, onInsert, onUpdate, onDelete]);
    return channel;
}
