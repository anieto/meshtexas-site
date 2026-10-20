---
title: MeshCore vs. Meshtastic
description: Same radios, different networks. What each one is good at, how
  they differ, and why MeshTexas builds on MeshCore.
order: 6
---
If you've bought a LoRa radio recently, it probably shipped with Meshtastic on it. Meshtastic is the better-known project, and plenty of Texans use it. MeshTexas runs on MeshCore instead. Here's what that means for you, and why we made that call.

## Same radios, different languages

Meshtastic and MeshCore run on the same hardware (Heltec, RAK, LilyGo, Seeed and so on), but they speak different protocols. **A Meshtastic node and a MeshCore node can't message each other**, even when they're sitting right next to each other on the same frequency.

The good news is that nothing is permanent. Switching a radio from one to the other is a browser reflash that takes a few minutes, and you can switch back whenever you like. Plenty of people keep one radio on each.

## What Meshtastic is great at

Meshtastic is a mature, well-supported project, and for a lot of uses it's the right tool:

- **Small groups and short trips.** Hiking, camping, events, a group of friends across a neighborhood. Everyone's radio helps relay, so a handful of nodes covers a lot of ground with no planning.
- **Sensors and telemetry.** It has built-in modules for environment sensors, position tracking, remote hardware and more.
- **Integrations.** ATAK support, MQTT, and a large ecosystem of apps and add-ons.
- **Community size.** It has more users, more guides and more people who've already solved your problem.

## How MeshCore is different

MeshCore splits the network into two kinds of nodes:

- **Companions** are the radios you carry and pair with your phone. They send and receive your messages, but **they don't relay anyone else's traffic.**
- **Repeaters** (and [Room Servers](/learn/room-servers) set to repeat) are fixed infrastructure, ideally up high, whose whole job is relaying.

That one design choice drives most of the other differences:

- **Fewer transmissions per message.** In Meshtastic, any node may rebroadcast a message it hears, although it holds back if a neighbor already did. In MeshCore only repeaters relay, so a crowd of phones at an event doesn't add to the airtime.
- **Direct messages learn a route.** The first DM to a contact floods the network to find a path. After that, messages travel along that path through only the repeaters they need, and fall back to flooding if the path breaks. Meshtastic added similar next-hop routing for DMs in version 2.6, so the gap here is smaller than older comparisons suggest.
- **Longer reach.** Meshtastic caps messages at 7 hops (3 by default). MeshCore repeaters can be set to allow up to 64, which matters when a message has to cross hundreds of miles of repeaters.
- **Infrastructure you can plan.** Because the relays are known, fixed nodes, a network can be mapped, monitored and improved deliberately. Our [repeater map](/repeaters), live map and analyzer are built around this.

Group channel messages flood in both systems. The difference is that in MeshCore only repeaters do the flooding.

## Why MeshTexas uses MeshCore

MeshTexas is trying to build something big: a connected network across a state that stretches nearly 800 miles in each direction. When every node can relay, adding users also adds transmissions, and busy areas can get congested as a network grows. A backbone of well-placed repeaters grows differently. A new user adds their own messages and nothing more, and new repeaters go where coverage is actually missing.

That's a tradeoff, not a free win. MeshCore depends on people putting up repeaters, and one radio on its own does less than a Meshtastic node would. That's why so much of this site is about [hosting a node](/host-a-node). But for a statewide network, we think it's the right foundation.

## Already on Meshtastic?

You're welcome here either way. Several Texas groups run both networks side by side, including the San Antonio and Austin communities. See [Communities](/communities) to find one near you. If you want to try MeshCore, [Getting Started](/learn/getting-started) walks you through flashing a radio you already own.
