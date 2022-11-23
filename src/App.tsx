import { useCallback, useEffect, useMemo, useRef } from "react";
import { SignalingServer, WebRTC } from "./sdk";

const serverUrl = "wss://rkg-webrtc-poc.herokuapp.com/";
const contraints = { video: true, audio: false }

const App = () => {
    const localStream = useRef<HTMLVideoElement>(null);
    const remoteStream = useRef<HTMLVideoElement>(null);
    const server = useMemo(() => new SignalingServer(serverUrl), [])
    const webrtc = useMemo(() => new WebRTC(), [])

    const handleMemberJoined = useCallback(async (username: string) => {
        console.log(`${username} joined`);
        await webrtc.makeCall();
    }, [])

    const handleCallSignal = useCallback(async (username: string, data: any) => {
        console.log(`${username} sent call signal`, data);
        webrtc.addSignal(data);
    }, [])

    const getMediaDevices = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia(contraints);
        if (localStream.current) {
            localStream.current.srcObject = stream;
            webrtc.addLocalStream(stream);
        }
    }, [])

    const remoteStreamListener = useCallback(async (stream: MediaStream) => {
        if (remoteStream.current) {
            remoteStream.current.srcObject = stream;
        }
    }, [])

    const callSignalListener = useCallback(async (signal: any) => {
        server.emit("call-signal", signal);
    }, [])
    
    useEffect(() => {
        webrtc.streamEvent = remoteStreamListener;
    }, [remoteStream])

    useEffect(() => {
        webrtc.signalEvent = callSignalListener
        getMediaDevices();
        const myUsername = prompt("what's your username?") as string;
        server.join(myUsername);
        server.on("member-joined", handleMemberJoined);
        server.on("call-signal", handleCallSignal);
    }, []);


    return (
        <div>
            <h1>Video Call</h1>
            <video ref={localStream} autoPlay playsInline></video>
            <video ref={remoteStream} autoPlay playsInline></video>
        </div>
    )
}

export default App;