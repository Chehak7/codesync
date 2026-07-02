"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeRoomsListener() {
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const channel = supabase.channel('realtime-rooms')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rooms' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    console.log('Change received!', payload);
                    router.refresh();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'room_members' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    console.log('Member change received!', payload);
                    router.refresh(); // Refresh if membership changes (e.g. joined/left)
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, router]);

    return null;
}
