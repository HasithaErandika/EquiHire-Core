import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from "@asgardeo/auth-react";

export const useInterviewSocket = (url: string = 'ws://localhost:9091/dashboard') => {
    const [transcripts, setTranscripts] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const { getAccessToken, state } = useAuthContext();

    useEffect(() => {
        if (!state.isAuthenticated) {
            return;
        }

        const connectSocket = async () => {
            try {
                const token = await getAccessToken();
                const wsUrl = `${url}?token=${token}`;
                const socket = new WebSocket(wsUrl);
                socketRef.current = socket;

                socket.onopen = () => {
                    console.log("Connected to Interview Socket");
                    setIsConnected(true);
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'transcription') {
                            setTranscripts(prev => [...prev, data.text]);
                        }
                    } catch (err) {
                        console.error("Error parsing message", err);
                    }
                };

                socket.onclose = () => {
                    console.log("Disconnected from Interview Socket");
                    setIsConnected(false);
                };
            } catch (error) {
                console.error("Failed to retrieve access token or connect", error);
            }
        };

        connectSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [url, state.isAuthenticated, getAccessToken]);

    return { transcripts, isConnected };
};
