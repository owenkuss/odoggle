export interface BlogPost {
  slug: string;
  title: string;
  tag: string;
  date: string;
  excerpt: string;
  body: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "pdl-rating-explained",
    title: "How PDL rating actually works",
    tag: "PDL",
    date: "2026-06-01",
    excerpt: "Five on-device sub-scores combine into your 1–10 Perceived Dog Level.",
    body: [
      "PDL (Perceived Dog Level) is Odoggle's dog-themed answer to facial rating — but built for snouts, not humans.",
      "When you scan in The Lab, your browser runs two ONNX models trained on DogFLW: a face localizer crops your dog, then a 46-point landmark regressor maps symmetry, harmony, muzzle shape, coat texture, and eye alertness.",
      "Each sub-score is normalized 0–100, weighted (harmony and symmetry matter most), then mapped to a 1–10 band with clustering in the middle — so a 5.5 and a 6.2 feel meaningfully different.",
      "Nothing leaves your device. PDL is advisory. The bark battle is decided by audience vote, not your scan.",
    ],
  },
  {
    slug: "eye-alertness",
    title: "What is eye alertness?",
    tag: "FACIAL",
    date: "2026-06-02",
    excerpt: "Canthal tilt for dogs — why bright eyes score higher in The Lab.",
    body: [
      "Eye alertness measures the angle between inner and outer eye corners — the same canthal tilt idea used in human PSL, adapted for DogFLW landmarks.",
      "Dogs with level, engaged eyes tend to score higher than droopy or asymmetric corners. Breed matters: some breeds naturally have different baseline tilts, so treat sub-scores as fun calibration, not judgment.",
      "Good lighting helps the landmark model. Run Camera Check first if your score looks off.",
    ],
  },
  {
    slug: "win-first-battle",
    title: "5 tips to win your first bark battle",
    tag: "STRATEGY",
    date: "2026-06-03",
    excerpt: "Framing, energy, and getting friends to vote on /spectate.",
    body: [
      "1. Frame the face — fill 40–70% of the frame. Camera Check exists for a reason.",
      "2. Light the snout — backlight kills landmark confidence and makes you look sleepy on cam.",
      "3. Energy in the 15 seconds — still dogs lose crowd votes to wiggle energy.",
      "4. Share /spectate — matches need at least 3 audience votes. Queue friends or open a second tab.",
      "5. Skip toxic matches — report bad actors. ELO is server-authoritative; votes are the only thing that matters.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
