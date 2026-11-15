// Real weather on Mars: the 30 newest sols measured by the REMS weather station on
// the Curiosity rover in Gale crater, as published in the daily weather report of
// the mission. Air temperature is the coldest and warmest of the sol; pressure is
// the daily mean. Copied on 2026-11-15 from
// https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json
// Data: NASA/JPL-Caltech/CAB (CSIC-INTA). The feed is offered for outreach use.
export type WeatherSol = { readonly sol: number; readonly date: string; readonly minC: number; readonly maxC: number; readonly pressurePa: number };

export const MARS_WEATHER: readonly WeatherSol[] = [
  { sol: 4995, date: "2026-08-25", minC: -71, maxC: -5, pressurePa: 777 },
  { sol: 4994, date: "2026-08-24", minC: -70, maxC: -7, pressurePa: 777 },
  { sol: 4993, date: "2026-08-23", minC: -70, maxC: -6, pressurePa: 780 },
  { sol: 4992, date: "2026-08-22", minC: -69, maxC: -6, pressurePa: 780 },
  { sol: 4991, date: "2026-08-21", minC: -69, maxC: -11, pressurePa: 779 },
  { sol: 4990, date: "2026-08-20", minC: -72, maxC: -8, pressurePa: 779 },
  { sol: 4989, date: "2026-08-19", minC: -72, maxC: -6, pressurePa: 778 },
  { sol: 4988, date: "2026-08-18", minC: -70, maxC: -10, pressurePa: 780 },
  { sol: 4987, date: "2026-08-17", minC: -70, maxC: -9, pressurePa: 781 },
  { sol: 4986, date: "2026-08-16", minC: -71, maxC: -9, pressurePa: 782 },
  { sol: 4985, date: "2026-08-15", minC: -70, maxC: -6, pressurePa: 781 },
  { sol: 4984, date: "2026-08-14", minC: -71, maxC: -6, pressurePa: 780 },
  { sol: 4983, date: "2026-08-13", minC: -70, maxC: -4, pressurePa: 782 },
  { sol: 4982, date: "2026-08-12", minC: -69, maxC: -6, pressurePa: 780 },
  { sol: 4981, date: "2026-08-11", minC: -69, maxC: -8, pressurePa: 783 },
  { sol: 4980, date: "2026-08-09", minC: -78, maxC: -7, pressurePa: 781 },
  { sol: 4979, date: "2026-08-08", minC: -71, maxC: -7, pressurePa: 785 },
  { sol: 4978, date: "2026-08-07", minC: -72, maxC: -7, pressurePa: 781 },
  { sol: 4977, date: "2026-08-06", minC: -70, maxC: -4, pressurePa: 786 },
  { sol: 4976, date: "2026-08-05", minC: -72, maxC: -5, pressurePa: 781 },
  { sol: 4975, date: "2026-08-04", minC: -71, maxC: -6, pressurePa: 786 },
  { sol: 4974, date: "2026-08-03", minC: -72, maxC: -8, pressurePa: 783 },
  { sol: 4973, date: "2026-08-02", minC: -69, maxC: -3, pressurePa: 784 },
  { sol: 4972, date: "2026-08-01", minC: -69, maxC: -6, pressurePa: 784 },
  { sol: 4971, date: "2026-07-31", minC: -70, maxC: -4, pressurePa: 782 },
  { sol: 4970, date: "2026-07-30", minC: -72, maxC: -5, pressurePa: 786 },
  { sol: 4969, date: "2026-07-29", minC: -71, maxC: -4, pressurePa: 783 },
  { sol: 4968, date: "2026-07-28", minC: -70, maxC: -3, pressurePa: 791 },
  { sol: 4967, date: "2026-07-27", minC: -72, maxC: -3, pressurePa: 784 },
  { sol: 4966, date: "2026-07-26", minC: -71, maxC: -3, pressurePa: 786 },
];
