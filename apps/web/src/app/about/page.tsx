export default function AboutPage() {
  return (
    <article className="max-w-2xl mx-auto prose prose-invert">
      <h1>About Odoggle</h1>
      <p>
        Odoggle is a privacy-first 1v1 dog video face-off arena. Two strangers go head-to-head on live
        webcam for 15 seconds, then the higher PDL rating wins and ELO decides who climbs the global leaderboard.
      </p>
      <p>
        Solo players can calibrate their on-device PDL score in The Lab — a private, browser-only
        dog facial-keypoint analysis built on DogFLW landmarks.
      </p>
      <h2>Our principles</h2>
      <ul>
        <li>Camera frames stay on your device. Raw video is never uploaded.</li>
        <li>Live matches are peer-to-peer (WebRTC).</li>
        <li>Server-authoritative ELO. Match outcomes verified server-side.</li>
        <li>No social graph. No DMs. Each match starts and ends in the round.</li>
      </ul>
    </article>
  );
}
