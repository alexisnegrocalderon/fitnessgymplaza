import { describe, expect, it } from "vitest";
import {
  creditsForTier,
  membershipExpiryFrom,
  renewalsForTier,
} from "../shared/credits";

describe("shared/credits", () => {
  it("entrega los créditos correctos por tier", () => {
    expect(creditsForTier("single")).toBe(1);
    expect(creditsForTier("eight")).toBe(8);
    expect(creditsForTier("twelve")).toBe(12);
    expect(creditsForTier("pack3")).toBe(12);
    expect(creditsForTier("pack6")).toBe(12);
  });

  it("los packs de 3 y 6 meses recargan mensualmente, no entregan todo de una vez", () => {
    // pack3 = compra inicial + 2 recargas más = 3 ciclos de 12 en total.
    expect(renewalsForTier("pack3")).toBe(2);
    // pack6 = compra inicial + 5 recargas más = 6 ciclos de 12 en total.
    expect(renewalsForTier("pack6")).toBe(5);
    expect(renewalsForTier("single")).toBe(0);
    expect(renewalsForTier("eight")).toBe(0);
    expect(renewalsForTier("twelve")).toBe(0);
  });

  it("vence a los 30 días de la fecha de inicio, no a fin de mes calendario", () => {
    const startsAt = new Date("2026-01-15T12:00:00Z");
    const expiresAt = membershipExpiryFrom(startsAt);
    expect(expiresAt.toISOString()).toBe("2026-02-14T12:00:00.000Z");
  });
});
