---
title: Repeaters
description: Why elevation beats transmit power for a repeater, plus power,
  solar sizing, and remote-management basics.
order: 3
---
A repeater's whole job is receiving and retransmitting to extend coverage — it doesn't originate its own chat traffic, it just relays everyone else's.

## Placement: elevation beats power

The single biggest lever for a repeater's usefulness isn't its transmit power — it's how high up it sits. LoRa's receive sensitivity is good enough that a well-placed repeater on high ground consistently beats a maxed-out radio down in a valley. If you only get to optimize one thing, optimize height and line of sight, not dBm.

A few siting principles that hold up in practice:

- **Don't stack repeaters close together.** Two repeaters covering the same area waste range and can interfere with each other — spread coverage out instead.
- **Point directional antennas at actual gaps**, not at each other or at areas already covered by a neighboring repeater.
- **Line of sight matters more than straight-line distance.** A repeater with a clear view of the horizon will usually outperform one that's technically closer but blocked by trees, buildings, or terrain — something to keep in mind across Texas's mix of flat plains, hill country, and urban cores.

See [Antennas](/learn/antennas) for how gain and antenna type factor into all this.

## Power and solar sizing

Most repeater sites don't have grid power nearby, so solar is the default. How much panel you need depends heavily on the board:

- **nRF52840-based boards** (e.g. RAK4631) are the more power-efficient option — a 5W panel can run one 24/7, though 8–10W gives comfortable margin for cloudy stretches.
- **ESP32-based boards** draw more power and generally want a 10W+ panel for reliable round-the-clock operation.

Pair the panel with a battery for overnight and overcast operation — a repeater that goes dark every night isn't much of a repeater.

## Remote management

Repeaters are typically **headless** — no screen, no keyboard — and are managed remotely over the mesh itself via a paired companion radio, rather than requiring physical access. That's what makes deploy-and-forget installations at hard-to-reach sites (rooftops, towers, remote hilltops) practical in the first place.

---

Want message storage and a local bulletin board instead of pure relay? See [Room Servers](/learn/room-servers) — the same siting and power guidance above applies there too. Thinking about putting a repeater up? MeshTexas is actively looking for good sites — see [Host a Node](/host-a-node) for what's involved. And [mesh101.com](https://mesh101.com/) has a hands-on device catalog worth browsing if you're comparing specific hardware.
