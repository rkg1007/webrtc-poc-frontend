export class SignalingServer {
    private socket: WebSocket;
    public isConnected = false;
    private username: string;
    private events: Record<string, Function | null>;

    constructor(url: string) {
        this.socket = new WebSocket(url);
        this.socket.onmessage = this.handleMessage;
        this.socket.onopen = this.handleOpen;
        this.socket.onclose = this.handleClose;
        this.socket.onerror = this.handleError;
        this.events = {};
    }

    private handleOpen = () => { 
        console.log("connected to server"); 
        this.isConnected = true;
    }
    private handleClose = () => { console.log("disconnected to server"); }
    private handleError = () => { console.log("error in connection server"); }
    private handleMessage = (event: MessageEvent) => { 
        const { type, data } = JSON.parse(event.data);
        console.log(`received ${type} event from server with data`); 
        const { username } = data;
        const eventHandler = this.events[type];
        if (eventHandler) {
            eventHandler(username, data);
        }
    }

    public on = (event: string, cb: Function | null) => {
        this.events[event] = cb;
    }

    public join = (username: string) => {
        this.username = username;
        let time = 1;
        if (!this.isConnected) time = 1000;
        setTimeout(() => {
            this.send({ type: "join" });
        }, time);
    }

    public emit = (type: string, data: any) => {
        this.send({ type, data });
    }

    private send = (signal: any) => {
        if (!this.isConnected) {
            console.error("error: you are not connected to the server")
            return;
        }
        const message = { type: signal.type, data: { username: this.username }}
        if (signal.data) message.data = { ...message.data, ...signal.data };
        this.socket.send(JSON.stringify(message));
    }
}