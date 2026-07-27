---
title: Getting Started with MeshCore
description: New to MeshCore? Here's how to get a radio flashed, paired, and
  sending your first message on the mesh.
order: 1
---
MeshCore turns a small, inexpensive LoRa radio into a long-range messenger — no cell service, no internet, no monthly bill. Here's the fastest path from "radio in a box" to your first message on the mesh.

## 1. Get a radio

Any MeshCore-compatible LoRa device works — popular options include the Heltec V3, RAK4631, and LilyGo T-Echo. Handheld all-in-one units and pocket-sized companion radios both work fine; the main thing to decide is whether you want a screen-and-buttons device or a small companion radio that pairs with your phone. Most hardware ships with Meshtastic firmware pre-installed, which is fine — you'll flash over it in the next step.

## 2. Flash the firmware

Head to [flasher.meshcore.io](https://flasher.meshcore.io) and connect your device over USB. It's browser-based — no software to install, no command line — and takes a couple of minutes. Pick the firmware variant that matches your hardware and role (companion radio is the right choice for a first device).

## 3. Pair and set up

Install the MeshCore app ([iOS](https://apps.apple.com/us/app/meshcore/id6742354151), Android, or the web app at [app.meshcore.nz](https://app.meshcore.nz)) and pair it with your freshly-flashed radio over Bluetooth or USB. Set a node name and your region during setup — this only takes a few minutes.

## 4. Send your first message

Join a public channel and say hello. You'll see direct messages, channel traffic, and repeater relays arrive in real time — a good way to get a feel for how the mesh actually moves your packets around.

## 5. Join the Texas network

The steps above get any MeshCore radio talking to the mesh in general. To see your device's traffic on MeshTexas's own live map and analyzer — or to set one up as a dedicated **observer node** that feeds our regional broker — head to [Connect](/connect) for the specific configuration.

---

Curious about the terms above — companion, repeater, hop, dBm? Check the [Glossary](/learn/glossary). Thinking about a fixed installation? See [Antennas](/learn/antennas), [Repeaters](/learn/repeaters), or [Room Servers](/learn/room-servers).

*Thanks to [mesh101.com](https://mesh101.com/) for putting together a genuinely useful, hardware-focused guide to this ecosystem — worth a look if you want more detail on device options.*
