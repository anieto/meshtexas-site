---
title: Is the Mesh Private?
description: Off-grid doesn't mean private. This guide explains what anyone
  with a radio can hear, what our observers do, and how to keep your
  conversations to yourself.
order: 7
---
A fair question comes up a lot: are tools like CoreScope, and sites like MeshTexas, taking private off-grid messages and putting them online?

The short answer is no. The mesh was never private to begin with. It runs on open radio, and anyone in range can listen. What *is* private on the mesh is protected by encryption, and that protection holds no matter who's listening, us included. This page explains how that works and how to make sure your conversations stay yours.

## Off-grid doesn't mean private

"Off-grid" means your messages don't need the internet, cell towers or anyone's servers to get where they're going. That's what makes MeshCore useful in an outage, out in the country, or anywhere the usual networks don't reach.

It doesn't mean nobody else can hear you. MeshCore radios talk over the 902–928 MHz [ISM band](/learn/glossary#ism-band), unlicensed spectrum that's open to everyone. Every packet your radio sends goes out in all directions, and it reaches every radio in range, not just the one it's meant for. [Repeaters](/learn/repeaters) then send it out again, so it can travel far beyond the people you're talking to.

Anyone can listen. A $20 radio and free software can pick up every packet within range, and recording them takes no special skill. Someone doing that doesn't have to tell anyone, doesn't have to transmit anything, and has no way of being detected. Their reasons may not be good ones.

## It's like talking in a coffee shop

Picture a conversation at a busy coffee shop. Nothing about it involves the internet. It's just you and a friend talking. But the person at the next table can hear every word, and they could be writing it down or recording it on their phone. You'd never know.

That's the mesh. A public channel is like talking out loud at that coffee shop, and an observer is the person at the next table who can hear the room. The difference with MeshTexas is that we put a sign on our table saying we're listening, what we write down, how long we keep it, and why.

If you want a conversation nobody can follow, you don't stop the room from hearing you. You speak in a language only your friend understands. On the mesh, that's encryption. More on that [below](#how-to-keep-your-conversations-private).

## What observers do (and don't do)

An [observer](/learn/glossary#observer-node) is a radio that listens to mesh traffic and reports what it hears to our [broker](/learn/glossary#broker). The broker feeds the [analyzer](https://analyzer.meshtexas.org) and [live map](https://livemap.meshtexas.org).

An observer is **not a bridge between the mesh and the internet**:

- **It only listens.** It hears the same packets every other radio in range hears, nothing more. It can't decrypt anything a regular radio couldn't.
- **The data goes one way.** Packets go up to the analyzer and the map. Nothing from the internet gets sent back into the mesh through them.
- **Your messages don't depend on it.** A message between two radios travels over radio from start to finish. It never needs an observer, a server or the internet to arrive.
- **The mesh doesn't notice if it's gone.** If every observer in Texas shut off tomorrow, messages would keep flowing exactly as they do today. The only thing that would stop is the map.

Some observers are also repeaters. The repeater part relays packets over radio like any other repeater. Only the observer part sends anything online, and it only reports what it heard.

Bots like `MeshTexasBot` are a different thing. A bot is a regular node that answers commands sent to it on the mesh, and some of its answers (like weather) come from the internet. It's a participant you choose to talk to, not a listener.

## Why we listen in the open

Anyone can set up an observer, and plenty of listeners don't announce themselves. We can't do anything about those. What we can do is be upfront about ours:

- **We say what we collect.** Our [privacy page](/privacy) lists exactly what we record from each packet.
- **We don't keep it long.** Mesh packets are deleted after 7 days, and backups after 3.
- **We use it to make the network better.** The data shows where coverage is good and where it's missing, which repeaters have gone quiet, how messages actually travel, and where a new [repeater](/learn/repeaters) would help most. That's how a statewide network gets planned instead of guessed at.
- **We can't read your private messages.** Direct messages and private channels are stored only in encrypted form, and we don't have the keys.

Taking our observers down wouldn't make the mesh any more private. The same traffic would still be on the air for anyone to hear, and other sites archive it too. It would just mean the listening was done by people who don't tell you about it.

## What anyone can read

These parts of the mesh are readable by anyone with a radio in range, whether or not they're an observer:

- **Public channel messages.** The Public channel uses a key that's built into the software and the same for everyone. Every MeshCore radio can read it.
- **Hashtag channel messages.** Channels like `#meshtexas` or `#sabot` get their key from the channel name. Anyone who knows or guesses the name can read them. They're convenient for open groups, but they aren't private.
- **Adverts.** When your node announces itself, it broadcasts its name, its public key, its type and, if you've turned it on, its location.
- **Routing details.** Which repeaters relayed a packet, plus signal strength and timing.

## What stays encrypted

Some traffic can be heard but not understood:

- **Direct messages** are end-to-end encrypted between your radio and the person you're messaging. The key is worked out by your two radios and is never sent over the air. Repeaters, observers and anyone listening can see that a message went by, but not what it says.
- **Private channels** created with a random secret key are encrypted the same way, and only radios with that key can read them. Even the sender's name is inside the encrypted part.

An observer records these messages like everything else, but only as scrambled data. We can't read them, and neither can anyone else without the key.

## What encryption doesn't hide

Encryption hides *what* you said. It doesn't hide *that* you said something. Anyone listening, including us, can still see:

- that a message was sent, when, and roughly how long it was;
- which repeaters carried it, which hints at the area it came from;
- a short fragment of the sender's and recipient's IDs. It's only a couple of characters, so it usually matches many nodes, but it isn't nothing.

For most people that's fine. If even that level of detail matters to you, keep it in mind, and remember that how often you message and where you transmit from can say something on their own.

## How to keep your conversations private

1. **Use direct messages for one-on-one conversations.** They're encrypted automatically. You don't have to set anything up.
2. **Use a private channel for groups.** In the MeshCore app, create a new *private* channel rather than a hashtag one. The app generates a random secret key, and you share it with the people you want in the group, usually as a QR code.
3. **Share the key privately.** Show the QR code in person or send the key through a channel you trust. Anyone who has the key can read everything on that channel, so never post it publicly.
4. **Treat public and hashtag channels as public.** Say what you'd be comfortable saying out loud at that coffee shop.
5. **Think twice about broadcasting your location.** If your node's adverts include a location, everyone can see it. Turn it off, or use a nearby public spot instead of your house.
6. **Watch what's in your node name.** It goes out with every advert. Your callsign or a nickname is fine. Your full name and street aren't.

## The short version

The mesh is open radio, so anyone in range can listen. MeshTexas is just upfront about it. Our observers only listen and report to the map. They don't connect the mesh to the internet or send anything back into it. If you want a conversation to stay private, use a direct message or a private channel with a random key, and nobody, us included, will be able to read it.

Questions about what we store? See our [Privacy & Data Retention](/privacy) page. New to all this? Start with [Getting Started](/learn/getting-started).
