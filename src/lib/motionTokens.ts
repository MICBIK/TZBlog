export const motionTokens = {
  duration: {
    fast: 200,
    normal: 600,
    slow: 800,
  },
  distance: {
    xs: 2,
    sm: 6,
    md: 12,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  stagger: {
    tight: 60,
    normal: 80,
    relaxed: 120,
  },
} as const;

export const motionCssVars = {
  durationFast: "--duration-fast",
  durationNormal: "--duration-normal",
  durationSlow: "--duration-slow",
  easeOutExpo: "--ease-out-expo",
  revealDelay: "--reveal-delay",
} as const;

type StaggerKey = keyof typeof motionTokens.stagger;

export function revealStyle(
  index: number,
  step: StaggerKey = "normal",
): { "--reveal-delay": string } {
  return {
    "--reveal-delay": `${index * motionTokens.stagger[step]}ms`,
  };
}
