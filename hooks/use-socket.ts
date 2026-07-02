import { useSocket } from "@/components/providers/socket-provider";

export const useSocketContext = () => {
    const { socket, isConnected } = useSocket();
    return { socket, isConnected };
};
