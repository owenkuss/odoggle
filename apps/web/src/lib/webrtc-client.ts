"use client";

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onSignal: (payload: unknown) => void;
  onConnectionState: (state: RTCPeerConnectionState) => void;
}

export class WebRTCClient {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;

  constructor(private callbacks: WebRTCCallbacks) {
    const iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
    ];
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
    if (turnUrl && turnUser && turnCred) {
      iceServers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
    }

    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.ontrack = (ev) => {
      if (ev.streams[0]) this.callbacks.onRemoteStream(ev.streams[0]);
    };
    this.pc.onicecandidate = (ev) => {
      if (ev.candidate) this.callbacks.onSignal({ candidate: ev.candidate });
    };
    this.pc.onconnectionstatechange = () => {
      this.callbacks.onConnectionState(this.pc.connectionState);
    };
  }

  async startLocalVideo(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    this.localStream.getTracks().forEach((t) => this.pc.addTrack(t, this.localStream!));
    return this.localStream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleSignal(payload: Record<string, unknown>): Promise<void> {
    if (payload.offer) {
      await this.pc.setRemoteDescription(payload.offer as RTCSessionDescriptionInit);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.callbacks.onSignal({ answer });
    } else if (payload.answer) {
      await this.pc.setRemoteDescription(payload.answer as RTCSessionDescriptionInit);
    } else if (payload.candidate) {
      await this.pc.addIceCandidate(payload.candidate as RTCIceCandidateInit);
    }
  }

  mute(): void {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = false));
  }

  destroy(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc.close();
  }
}
