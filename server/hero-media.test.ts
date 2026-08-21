import { describe, expect, it } from "vitest";
import {
  MOBILE_VIDEO_URL,
  VIDEO_URL,
} from "../client/src/lib/gym-content";

describe("hero media sources", () => {
  it("serves the desktop hero video from a Vercel-compatible public route", () => {
    expect(VIDEO_URL).toMatch(/^\/media\/.+\.mp4$/);
  });

  it("keeps a dedicated Vercel-compatible source for the 3:4 mobile hero", () => {
    expect(MOBILE_VIDEO_URL).toMatch(/^\/media\/.+\.mp4$/);
    expect(MOBILE_VIDEO_URL).not.toBe(VIDEO_URL);
  });
});
