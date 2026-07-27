---
title: MeshCore Glossary
description: Plain-language definitions for the MeshCore and LoRa terms
  you'll run into as you get on the network.
order: 5
intro: MeshCore and LoRa radio come with their own vocabulary. Here's what the common terms actually mean, without the jargon.
---
### Broker

The server MeshCore observer nodes publish packet data to over MQTT. MeshTexas runs its own regional broker — see [About: How It Works](/about#how-it-works) for how ours fits together.

### Channel

A named group for broadcast messages — public (visible to anyone on that channel) or private (key-protected, invite-only). A device can be a member of several channels at once.

### Companion

The most common node role: a client device that sends and receives messages but never relays other nodes' traffic. Lower power draw, better battery life — the right role for a phone-paired handheld or pocket radio.

### dBi

A unit of antenna gain, relative to a theoretical antenna that radiates equally in all directions. Higher dBi means a more focused beam — great if you need range in a specific direction, less useful if you need coverage all around a site. Typical LoRa antennas run from about 2 to 8+ dBi. See [Antennas](/learn/antennas) for a practical breakdown.

### dBm

A unit of absolute radio power, referenced to 1 milliwatt. Most MeshCore devices transmit around +22 dBm. The relationship isn't linear — every +3 dBm roughly doubles transmit power, but only nets a modest range increase, which is why antenna choice and elevation tend to matter more than raw power (see [Antennas](/learn/antennas) and [Repeaters](/learn/repeaters)).

### Flood Routing

A routing strategy where every node rebroadcasts everything it hears, up to a hop limit. Simple and robust, but noisier on busy networks — the default strategy in some other mesh firmware.

### Hop

One retransmission by an intermediate node on the way to a message's destination. MeshCore supports paths of up to 64 hops, considerably more headroom than flood-routing networks typically allow.

### ISM Band

Unlicensed radio spectrum set aside for Industrial, Scientific, and Medical use — no license required to transmit. MeshCore devices in the US operate in the 902–928 MHz ISM band.

### Node Identity

Every MeshCore device generates its own public/private keypair on setup — there's no account, registration, or central authority. That keypair is the device's identity on the mesh, and it's what encrypts your traffic end-to-end by default.

### Observer Node

MeshTexas-specific terminology: a MeshCore device configured to forward the packets it hears to our broker, feeding the live map and analyzer. Not every node needs to be one — see [Connect](/connect) for what's involved in setting one up.

### Path-Based Routing

A routing strategy where nodes learn and cache the best-known route to a destination, then send along that specific path instead of rebroadcasting to everyone. Cuts down on network-wide chatter compared to flood routing — MeshCore uses this approach.

### Repeater

A fixed, usually solar-powered node whose whole job is receiving and retransmitting to extend coverage — it doesn't originate its own chat traffic. Elevation matters far more than transmit power for a repeater's usefulness; see [Repeaters](/learn/repeaters). Interested in hosting one? See [Host a Node](/host-a-node).

### Room Server

An infrastructure node role focused on message storage — it holds onto recent channel history so a device that was offline can catch up when it reconnects, and can optionally relay traffic too. See [Room Servers](/learn/room-servers) for the details.

### RSSI

"Received Signal Strength Indicator" — how strong an incoming packet was, in dBm. Roughly: -80 dBm is a strong link, -110 dBm is marginal, and anything approaching -130 dBm is close to the noise floor.

### Sensor

A node role built for one-way telemetry — periodically transmitting readings like GPS position, temperature, or battery level onto the mesh, rather than participating in two-way messaging.

### SNR

"Signal-to-Noise Ratio" — how far the signal sits above (or below) the background noise, in dB. LoRa's a bit unusual here: it can successfully decode packets even at a *negative* SNR, where the signal is technically weaker than the noise around it.
