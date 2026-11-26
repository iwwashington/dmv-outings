# DMV Outings

A static site (GitHub Pages) of DC-area outings. Upcoming events show first. Events with `ongoing: true` (an open-ended exhibit or a year-round market, with `recur` describing when) never count as passed.

To update each week: append new events to `data.json` with `added` set to that day, and bump `updated`. When every date of an event has passed, or it is cancelled or its page is gone, move it out of `data.json` into `archive.json` with `removed` and `reason`. The site never shows or links `archive.json`; it is a record of past picks.
Each event: id, title, start, end, time, venue, area, price, fit (family, solo, friends, couples), why, urgency, source (organizer's own page), verified (date checked), added, lat/lng (reserved for a future map).
Keep personal calendars, home location and names off this site.
