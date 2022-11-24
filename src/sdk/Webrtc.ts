export class WebRTC {
    private pc: RTCPeerConnection;
    public signalEvent: Function | null = null;
    public streamEvent: Function | null = null;

    constructor() {
        this.pc = new RTCPeerConnection({
            iceServers: [
                {
                  urls: "stun:openrelay.metered.ca:80",
                },
                {
                  urls: "turn:openrelay.metered.ca:80",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
                {
                  urls: "turn:openrelay.metered.ca:443",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
                {
                  urls: "turn:openrelay.metered.ca:443?transport=tcp",
                  username: "openrelayproject",
                  credential: "openrelayproject",
                },
              ],
        });
        this.handleRemoteStream();
        this.handleRemoteCandidate();
    }

    public addLocalStream = async (stream: MediaStream) => {
        const tracks = stream.getTracks();
        for (const track of tracks) {
            this.pc.addTrack(track, stream);
        }
    }

    private handleRemoteStream = async () => {
        this.pc.ontrack = (event) => {
            console.log("receiving remote stream", event.streams[0]);
            if (this.streamEvent) {
                console.log("trying to change remote stream state in ui");
                this.streamEvent(event.streams[0]);
            }
        }
    }

    private handleRemoteCandidate = async () => {
        this.pc.onicecandidate = (event) => {
            console.log("sending candidate");
            this.sendSignal({ type: "candidate", data: event.candidate });
        }
    }

    public addSignal = async (signal: any) => {
        const { type, data } = signal;
        console.log(`received call signal with type ${type}`);
        switch (type) {
            case "offer": 
                this.handleOffer(data);
                break;
            case "answer":
                this.handleAnswer(data)
                break;
            case "candidate":
                this.handleCandidate(data);
                break;
            default:
                console.log("unhandled signal");
                break;
        }
    }

    public makeCall = async () => {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.sendSignal({ type:"offer", data: offer});
    }

    private handleOffer = async (offer: any) => {
        await this.pc.setRemoteDescription(offer);
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.sendSignal({ type: "answer", data: answer });
    }

    private handleAnswer = async (answer: any) => {
        await this.pc.setRemoteDescription(answer);
    }

    private handleCandidate = async (candidate: any) => {
        await this.pc.addIceCandidate(candidate);
    }

    private sendSignal = async (signal: any) => {
        if (this.signalEvent) {
            this.signalEvent(signal);
        }
    }
}