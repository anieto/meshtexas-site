---
title: Room Servers
description: What a MeshCore Room Server does, how it differs from a
  repeater, and what it takes to run one.
order: 4
---
A Room Server is an infrastructure node role built around one job: holding onto recent channel messages so anyone who was out of range can catch up when they reconnect. Think of it as an off-grid bulletin board — no internet, no cell towers, no cloud service required.

## What it does

Room Servers store the most recent messages on a channel — on the order of a few dozen per channel — and hand them over to any device that reconnects after being offline. That's the core difference from a plain repeater: a repeater only relays what's actively passing through, while a Room Server keeps a short-term memory of it. Message storage isn't unlimited — older messages drop once the queue fills — and reliable syncing gets weaker the further out (multi-hop) a device is from the Room Server itself.

## Room Server vs. repeater

Room Servers *can* also relay traffic like a repeater (`set repeater true` in the CLI), but turning that on trades away some message capacity and repeater-specific behavior. In practice, pick one primary job for a given node — pure message storage, or pure relay — rather than expecting full performance at both simultaneously.

## Extra connectivity

A Room Server can broadcast its own Wi-Fi access point, letting devices connect directly instead of over LoRa — handy for a fixed location where people gather nearby. It can also bridge stored messages to an MQTT broker once internet connectivity is available, independent of the observer/broker setup described in [Connect](/connect).

## Setup

Like any MeshCore device, flashing starts at [flasher.meshcore.io](https://flasher.meshcore.io) — pick the Room Server firmware variant for your board. Configuration (channel keys, Wi-Fi AP, MQTT bridging) happens through [config.meshcore.io](https://config.meshcore.io). Room Server firmware is functional but newer and less battle-tested than the Companion or Repeater roles, so expect some rough edges.

Power, solar sizing, and headless/remote management work the same way as for a [repeater](/learn/repeaters) — a Room Server is just as often a fixed, unattended, solar-powered install.

## Typical uses

- A local coordination hub — announcements, check-ins, day-to-day chatter for a neighborhood or group
- Emergency communication when normal infrastructure is down
- A message board for a remote camp, trailhead, or backcountry group

---

Curious how this compares to a plain repeater? See [Repeaters](/learn/repeaters). Want the antenna side of a fixed install? See [Antennas](/learn/antennas). Credit to [mesh101.com](https://mesh101.com/) for a genuinely useful deep-dive on Room Servers that this page draws on.
