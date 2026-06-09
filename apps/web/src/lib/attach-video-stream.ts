/** Bind a MediaStream to a video element and ensure playback starts. */
export function attachVideoStream(video: HTMLVideoElement | null, stream: MediaStream | null): void {
  if (!video || !stream) return;
  if (video.srcObject !== stream) {
    video.srcObject = stream;
  }
  void video.play().catch(() => {
    /* autoplay policies — muted videos should still work */
  });
}
