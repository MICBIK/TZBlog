import { describe, expect, it } from "vitest";

type MotionTokenModule = {
  motionTokens: {
    duration: {
      fast: 200;
      normal: 600;
      slow: 800;
    };
    distance: {
      xs: 2;
      sm: 6;
      md: 12;
    };
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)";
      emphasized: "cubic-bezier(0.16, 1, 0.3, 1)";
    };
    stagger: {
      tight: 60;
      normal: 80;
      relaxed: 120;
    };
  };
  motionCssVars: {
    durationFast: "--duration-fast";
    durationNormal: "--duration-normal";
    durationSlow: "--duration-slow";
    easeOutExpo: "--ease-out-expo";
    revealDelay: "--reveal-delay";
  };
  revealStyle: (index: number, step?: keyof MotionTokenModule["motionTokens"]["stagger"]) => {
    "--reveal-delay": string;
  };
};

describe("motionTokens", () => {
  it("exposesSharedMotionTokens", async () => {
    const { motionCssVars, motionTokens, revealStyle } =
      await loadMotionTokens();

    expect(motionTokens).toEqual({
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
    });
    expect(motionCssVars).toEqual({
      durationFast: "--duration-fast",
      durationNormal: "--duration-normal",
      durationSlow: "--duration-slow",
      easeOutExpo: "--ease-out-expo",
      revealDelay: "--reveal-delay",
    });
    expect(revealStyle(2)).toEqual({ "--reveal-delay": "160ms" });
    expect(revealStyle(3, "tight")).toEqual({ "--reveal-delay": "180ms" });
  });
});

async function loadMotionTokens(): Promise<MotionTokenModule> {
  const modulePath = "./motionTokens";
  return (await import(modulePath)) as MotionTokenModule;
}
