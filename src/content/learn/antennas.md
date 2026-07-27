---
title: Antennas
description: How antenna choice affects MeshCore range, and what actually
  changes between a stock whip and a proper fiberglass antenna.
order: 2
---
If you're setting up a fixed installation — a repeater, a room server, a base station, anything that isn't just riding in your pocket — antenna choice matters more than almost anything else you'll configure.

## Antenna basics

Antenna performance is measured in **[dBi](/learn/glossary#dbi)** — gain relative to a theoretical antenna radiating equally in every direction. Higher-gain antennas focus more of their energy horizontally, at the cost of vertical coverage, which is usually the right trade for a fixed device mounted well above the surrounding terrain.

A rough guide to what's out there:

- **Rubber duck / whip antennas** — what most devices ship with. Low gain (around 2 dBi), fine for handhelds and short-range testing, not what you want for a permanent site.
- **Fiberglass omnidirectional antennas** — the common choice for repeaters, room servers, and base stations, typically 5–8 dBi, giving even coverage in all horizontal directions.
- **Directional (Yagi or panel) antennas** — 10+ dBi, but focused in one direction. Useful for a deliberate point-to-point link, not general coverage.

## Connectors and swapping

Devices connect to external antennas through an SMA connector (or a U.FL/IPEX pigtail on smaller boards, which adapts up to SMA). Swapping a stock whip for even a modest fiberglass antenna is usually the single biggest range upgrade available — a 7–8 dBi fiberglass antenna at standard transmit power will outperform a stock whip at max power. If you only make one hardware change to a fixed device, make it this one.

## Installation practices

Buying the right antenna is only half of it — how it's installed determines whether you actually get that gain in practice.

- **Keep the feedline short, and use decent cable.** Every foot of coax between the radio and the antenna eats into your gain, and cheap cable eats a lot more than good cable. At 900 MHz, RG-58 loses roughly 16 dB per 100 feet, while LMR-400 loses closer to 4 dB over the same run — on a long cable pull, that gap alone can undo most of the benefit of a higher-gain antenna. For a short jumper (a few feet), it barely matters; for anything longer, it matters a lot. Mounting the radio near the antenna, rather than running a long cable back to it, sidesteps the problem entirely.
- **Match polarization.** Nearly all MeshCore antennas are vertically polarized — mount them straight up and down, not at an angle or horizontally. A tilted or horizontal antenna can lose a large chunk of signal talking to everyone else's (correctly) vertical ones.
- **Weatherproof every outdoor connector.** Water intrusion at an SMA or N connector is one of the most common causes of a repeater or room server quietly degrading over months. Wrap exposed connectors with self-vulcanizing (rubber) tape, then a layer of regular electrical tape over that as UV protection.
- **Keep clearance from metal and obstructions.** Mounting an antenna flush against a metal roof, gutter, or enclosure detunes it and distorts its pattern. A little standoff — even a few inches — makes a real difference; more, on a mast, is better still.
- **Ground it, and consider a lightning arrestor.** For any permanent outdoor install, especially on a mast or tower, an inline lightning arrestor on the feedline (bonded to a proper ground) is cheap insurance against the one storm that would otherwise take out the whole node.

---

Putting that antenna on a fixed installation? See [Repeaters](/learn/repeaters) for placement and power guidance, or [Room Servers](/learn/room-servers) if you're after message storage instead of pure relay. And [mesh101.com](https://mesh101.com/) has a hands-on antenna catalog worth browsing if you're comparing specific hardware.
