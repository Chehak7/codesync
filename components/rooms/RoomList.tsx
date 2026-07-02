"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomCard } from "./RoomCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";

export interface RoomWithRole {
    id: string;
    name: string;
    room_code: string;
    is_public: boolean;
    owner_id: string;
    created_at: string;
    role?: "owner" | "member"; // if user is a member
    participant_count: number;
}

interface RoomListProps {
    myRooms: RoomWithRole[];
    publicRooms: RoomWithRole[];
    userId: string;
}

export function RoomList({ myRooms, publicRooms, userId }: RoomListProps) {
    const [search, setSearch] = useState("");

    const filterRooms = (rooms: RoomWithRole[]) => {
        return rooms.filter(room =>
            room.name.toLowerCase().includes(search.toLowerCase()) ||
            room.room_code.toLowerCase().includes(search.toLowerCase())
        );
    };

    const filteredMyRooms = filterRooms(myRooms);
    const filteredPublicRooms = filterRooms(publicRooms);

    return (
        <div className="space-y-8">
            <div className="relative max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-neon-cyan transition-colors" />
                <Input
                    placeholder="Search rooms..."
                    className="pl-12 h-14 bg-glass-surface border-white/5 rounded-2xl placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-neon-cyan/50 focus-visible:border-neon-cyan/50 transition-all text-white font-semibold text-[15px] backdrop-blur-md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <Tabs defaultValue="my-rooms" className="w-full">
                <TabsList className="bg-transparent h-auto p-0 gap-8 mb-4 border-b border-white/5 w-full justify-start rounded-none">
                    <TabsTrigger
                        value="my-rooms"
                        className="px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-cyan data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/30 data-[state=active]:text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-all data-[state=active]:drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    >
                        My Rooms ({myRooms.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="public-rooms"
                        className="px-0 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-purple data-[state=active]:bg-transparent data-[state=active]:shadow-none text-white/30 data-[state=active]:text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-all data-[state=active]:drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    >
                        Public Rooms ({publicRooms.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="my-rooms" className="mt-4">
                    {filteredMyRooms.length === 0 ? (
                        <EmptyState
                            title="No rooms found"
                            description={search ? `No rooms matching "${search}"` : "You haven't joined or created any rooms yet."}
                            icon={Search}
                            action={!search ? {
                                label: "Create a Room",
                                onClick: () => {
                                    // Trigger create room dialog
                                    const event = new CustomEvent('open-create-room');
                                    window.dispatchEvent(event);
                                }
                            } : undefined}
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredMyRooms.map((room) => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    currentUserId={userId}
                                    participantCount={room.participant_count}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="public-rooms" className="mt-4">
                    {filteredPublicRooms.length === 0 ? (
                        <EmptyState
                            title="No public rooms"
                            description={search ? `No public rooms matching "${search}"` : "There are no public rooms available right now."}
                            icon={Search}
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPublicRooms.map((room) => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    currentUserId={userId}
                                    participantCount={room.participant_count}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
