import assert from "node:assert/strict";
import { test } from "node:test";
import { AU_KM, AU_LIGHT_MINUTES, earthToMarsAu, nextLaunchDay } from "./orbits.ts";

test("Earth and Mars are where the sky says they were", () => {
  // The famous close pass of 27 August 2003: 55.76 million km.
  const close = earthToMarsAu(Date.UTC(2003, 7, 27, 10)) * AU_KM;
  assert.ok(Math.abs(close - 55.76e6) < 0.5e6, `close pass was ${(close / 1e6).toFixed(2)} million km`);
  // A radio message takes between about 3 and 22 minutes, never more.
  for (let day = 0; day < 6000; day += 10) {
    const minutes = earthToMarsAu(Date.UTC(2020, 0, 1) + day * 86_400_000) * AU_LIGHT_MINUTES;
    assert.ok(minutes > 3 && minutes < 22.5, `${minutes} minutes`);
  }
});

test("launch days come about every 26 months, and match real launches", () => {
  // Perseverance left Earth on 30 July 2020.
  const in2020 = nextLaunchDay(Date.UTC(2020, 0, 1));
  assert.equal(new Date(in2020).getUTCFullYear(), 2020);
  assert.ok([5, 6, 7].includes(new Date(in2020).getUTCMonth()), new Date(in2020).toISOString());
  const months = (nextLaunchDay(in2020) - in2020) / 86_400_000 / 30.44;
  assert.ok(months > 24 && months < 28, `${months} months apart`);
});
