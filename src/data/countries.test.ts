import { describe, expect, it } from "vitest";
import { COUNTRIES } from "./countries";

// Guards the explicit requirement: generated names must not reproduce a real,
// well-known athlete's exact full name. We keep a denylist of the famous
// real names this data was originally (incorrectly) modeled after, and
// assert that no first+last combination in the current pools can produce
// any of them verbatim.
const REAL_NAME_DENYLIST = [
  "Lionel Messi",
  "Julian Alvarez",
  "Lautaro Martinez",
  "Erling Haaland",
  "Kylian Mbappe",
  "Mohamed Salah",
  "Kevin De Bruyne",
  "Virgil van Dijk",
  "Frenkie de Jong",
  "Luka Modric",
  "Robert Lewandowski",
  "Bruno Fernandes",
  "Son Heungmin",
  "Heungmin Son",
];

describe("countries name pools", () => {
  it("every country has matching-length first/last Korean transliteration arrays", () => {
    for (const c of COUNTRIES) {
      expect(c.firstNamesKo.length).toBe(c.firstNames.length);
      expect(c.lastNamesKo.length).toBe(c.lastNames.length);
      expect(c.firstNames.length).toBeGreaterThan(0);
      expect(c.lastNames.length).toBeGreaterThan(0);
    }
  });

  it("no first+last combination reproduces a known real athlete's exact name", () => {
    const combos = new Set<string>();
    for (const c of COUNTRIES) {
      for (const f of c.firstNames) {
        for (const l of c.lastNames) {
          combos.add(`${f} ${l}`);
        }
      }
    }
    for (const real of REAL_NAME_DENYLIST) {
      expect(combos.has(real)).toBe(false);
    }
  });
});
