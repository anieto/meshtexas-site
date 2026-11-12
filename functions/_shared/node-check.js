// Node Check: turns the analyzer's view of one node into plain-language
// findings. Pure functions only, so the rules can be tried against saved
// analyzer responses without a network.

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const ADVERT = 4;

// Roles whose radios are on all the time and send adverts on their own.
const INFRASTRUCTURE = new Set(['repeater', 'room']);

export function parseQuery(raw) {
  const text = (raw || '').trim();
  if (!text) return null;
  // A contact shared from the MeshCore app: meshcore://contact/add?...&public_key=<hex>
  const link = text.match(/public_key=([0-9a-f]{64})/i);
  if (link) return { key: link[1].toLowerCase() };
  const hex = text.replace(/\s+/g, '');
  if (/^[0-9a-f]{8,64}$/i.test(hex)) return { key: hex.toLowerCase() };
  return { name: text.slice(0, 64) };
}

function hopsOf(observation) {
  try {
    const hops = JSON.parse(observation.path_json || '[]');
    return Array.isArray(hops) ? hops.length : null;
  } catch {
    return null;
  }
}

function round1(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function time(value) {
  const ms = value ? Date.parse(value) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

export function ago(ms, now) {
  const diff = Math.max(0, now - ms);
  if (diff < 2 * 60 * 1000) return 'just now';
  if (diff < HOUR) return `${Math.round(diff / 60000)} minutes ago`;
  if (diff < 2 * HOUR) return 'an hour ago';
  if (diff < DAY) return `${Math.round(diff / HOUR)} hours ago`;
  if (diff < 2 * DAY) return 'a day ago';
  return `${Math.round(diff / DAY)} days ago`;
}

function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** One advert and everyone who reported it, best signal first. */
function summarizeAdvert(advert, iataByObserver) {
  const seen = new Map();
  for (const observation of advert.observations || []) {
    const id = observation.observer_id;
    const hops = hopsOf(observation);
    const entry = {
      name: observation.observer_name || 'Unnamed observer',
      region: observation.observer_iata || iataByObserver.get(id) || null,
      hops,
      snr: round1(observation.snr),
      rssi: typeof observation.rssi === 'number' ? observation.rssi : null,
    };
    // An observer can report several copies; keep its shortest path.
    const previous = seen.get(id);
    if (!previous || (hops ?? 99) < (previous.hops ?? 99)) seen.set(id, entry);
  }
  const observers = [...seen.values()].sort(
    (a, b) => (a.hops ?? 99) - (b.hops ?? 99) || (b.snr ?? -99) - (a.snr ?? -99)
  );
  const regions = [...new Set(observers.map((o) => o.region).filter(Boolean))].sort();
  return {
    at: advert.timestamp || advert.first_seen || null,
    kind: advert.advert_kind || null,
    observers,
    regions,
  };
}

export function buildReport({ detail, health, skew, observers }, now = Date.now()) {
  const node = detail.node || {};
  const role = node.role || health?.node?.role || 'unknown';
  const key = (node.public_key || '').toLowerCase();
  const iataByObserver = new Map((observers || []).map((o) => [o.id, o.iata]));

  const transmissions = Array.isArray(detail.recentAdverts) ? detail.recentAdverts : [];
  const adverts = transmissions.filter((t) => t.payload_type === ADVERT);
  const latestAdvert = adverts[0] ? summarizeAdvert(adverts[0], iataByObserver) : null;
  const latestFlood = adverts.find((a) => a.advert_kind === 'flood');
  const floodSummary = latestFlood
    ? (latestFlood === adverts[0] ? latestAdvert : summarizeAdvert(latestFlood, iataByObserver))
    : null;

  const direct = (health?.observers || [])
    .map((o) => ({
      name: o.observer_name || 'Unnamed observer',
      region: iataByObserver.get(o.observer_id) || null,
      snr: round1(o.avgSnr),
      rssi: typeof o.avgRssi === 'number' ? Math.round(o.avgRssi) : null,
      packets: o.packetCount ?? null,
    }))
    .sort((a, b) => (b.snr ?? -99) - (a.snr ?? -99));

  const lastHeard = time(node.last_heard) ?? time(health?.stats?.lastHeard) ?? time(node.last_seen);
  const lastRelayed = time(node.last_relayed);
  const findings = [];
  const add = (level, title, detailText, fix) => findings.push({ level, title, detail: detailText, fix: fix || null });

  // Last heard.
  const quiet = lastHeard == null ? Infinity : now - lastHeard;
  if (INFRASTRUCTURE.has(role)) {
    // Repeaters show up whenever they relay; room servers mostly only through
    // their own adverts, which can be half a day apart.
    const quietAfter = role === 'room' ? DAY : 12 * HOUR;
    const silentAfter = role === 'room' ? 3 * DAY : 2 * DAY;
    if (quiet <= quietAfter) {
      add('good', `Heard ${ago(lastHeard, now)}`, 'Observers are hearing this node regularly.');
    } else if (quiet <= silentAfter) {
      add('warn', `Quiet: last heard ${ago(lastHeard, now)}`,
        role === 'room'
          ? 'A working room server usually sends an advert at least twice a day.'
          : 'A working repeater usually turns up every few hours, from its own adverts or the traffic it relays.',
        'Check that it still has power and its antenna is connected. If it runs on solar, check the battery.');
    } else {
      add('bad', lastHeard == null ? 'No recent traffic' : `Not heard for ${ago(lastHeard, now).replace(' ago', '')}`,
        `Nothing from this node has reached an observer in the last ${role === 'room' ? 'three' : 'two'} days.`,
        'Check power, the antenna and the radio settings, then send a flood advert.');
    }
  } else if (lastHeard != null) {
    add(quiet <= 14 * DAY ? 'info' : 'warn', `Last heard ${ago(lastHeard, now)}`,
      'Companions are only heard when they send something, so a quiet spell is normal.',
      quiet > 14 * DAY ? 'Send a flood advert to check that it still reaches the mesh.' : null);
  }

  // Reach of the most recent flood advert.
  if (floodSummary && floodSummary.observers.length) {
    const count = floodSummary.observers.length;
    const regionText = floodSummary.regions.length
      ? ` in ${plural(floodSummary.regions.length, 'region')} (${floodSummary.regions.join(', ')})`
      : '';
    const at = time(floodSummary.at);
    add('good',
      `Last flood advert reached ${plural(count, 'observer')}${regionText}`,
      at ? `Sent ${ago(at, now)}.` : 'The time it was sent is unknown.',
      count < 3 ? 'Only a few observers heard it. That can simply mean there are few observers near you, or that it needs another repeater in range to travel further.' : null);
  } else if (adverts.length) {
    add('info', 'No recent flood advert',
      'Its recent adverts were zero-hop, which only reach radios in direct range, so they don\'t show how far it gets.',
      'Send a flood advert to see how far it travels.');
  } else {
    add('info', 'No recent adverts', 'The analyzer has no recent adverts from this node.',
      'Send a flood advert to see how far it travels.');
  }

  // Nearest observer.
  if (direct.length) {
    const best = direct[0];
    add('good', `${plural(direct.length, 'observer')} ${direct.length === 1 ? 'hears' : 'hear'} it directly`,
      `The strongest is ${best.name}${best.snr != null ? ` at ${best.snr > 0 ? '+' : ''}${best.snr} dB SNR` : ''}.`);
  } else if (floodSummary?.observers.length) {
    const nearest = floodSummary.observers[0].hops;
    if (nearest != null && nearest > 0) {
      add('info', `Nearest observer is ${plural(nearest, 'hop')} away`,
        'No observer hears this node directly, so it reaches the mesh through repeaters. That\'s normal unless you expected an observer nearby to hear it.');
    }
  }

  // Repeaters should be relaying.
  if (role === 'repeater' && quiet <= 2 * DAY) {
    if (lastRelayed == null) {
      add('warn', 'Not seen relaying',
        'Observers hear this repeater, but haven\'t seen it pass on anyone else\'s traffic.',
        'Check that repeating is turned on. If it is, there may simply be no traffic near it yet.');
    } else if (now - lastRelayed > 2 * DAY) {
      add('warn', `Last relayed ${ago(lastRelayed, now)}`,
        'It\'s still heard, but hasn\'t relayed traffic for a while.',
        'Check that repeating is still on and nothing changed in its settings.');
    } else {
      add('good', 'Relaying traffic', `Other nodes' packets are passing through it. It last relayed one ${ago(lastRelayed, now)}.`);
    }
  }

  // Clock.
  const severity = skew?.severity;
  const offset = typeof skew?.recentMedianSkewSec === 'number' ? skew.recentMedianSkewSec : skew?.medianSkewSec;
  if (severity === 'warning' || severity === 'critical') {
    add('warn', `Clock is off by ${describeOffset(offset)}`,
      'Nodes with the wrong time can have their adverts treated as old.',
      'Sync the clock from the MeshCore app, or with the `clock sync` command.');
  } else if (severity === 'absurd' || severity === 'no_clock' || severity === 'bimodal_clock') {
    add('warn', severity === 'bimodal_clock' ? 'Clock keeps jumping' : 'Clock isn\'t set',
      severity === 'bimodal_clock'
        ? 'Its clock sometimes reads right and sometimes far off, which usually means it loses time on restart.'
        : 'Its clock is far from the real time, as if it was never set.',
      'Sync the clock from the MeshCore app, or with the `clock sync` command.');
  } else if (severity === 'ok' && INFRASTRUCTURE.has(role)) {
    add('good', 'Clock is right', 'Its clock is within a few minutes of the real time.');
  }

  // Location, only for nodes meant to be found on a map.
  const hasLocation = !(node.lat === 0 && node.lon === 0) && node.lat != null && node.lon != null;
  if (INFRASTRUCTURE.has(role) && !hasLocation) {
    add('info', 'No location set', 'It won\'t appear on the live map or the analyzer\'s map.',
      'Set a location in the node\'s settings if you\'re comfortable sharing it.');
  }

  // Problems first, then what's working, then notes.
  const order = { bad: 0, warn: 1, good: 2, info: 3 };
  findings.sort((a, b) => order[a.level] - order[b.level]);
  const worst = findings[0]?.level || 'info';
  const headline = worst === 'bad'
    ? 'This node has gone quiet'
    : worst === 'warn'
      ? 'Heard, with something to check'
      : worst === 'good'
        ? 'This node is getting out'
        : 'Heard before, but nothing recent to go on';

  return {
    status: 'ok',
    node: {
      key,
      name: node.name || 'Unnamed node',
      role,
      lastHeard: lastHeard ? new Date(lastHeard).toISOString() : null,
      firstSeen: node.first_seen || null,
    },
    verdict: { level: worst, headline },
    findings,
    latestAdvert: floodSummary || latestAdvert,
    direct,
    analyzerUrl: `https://analyzer.meshtexas.org/#/nodes/${key}`,
  };
}

function describeOffset(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return 'a while';
  const abs = Math.abs(seconds);
  const amount = abs < 3600 ? plural(Math.round(abs / 60), 'minute') : abs < 2 * 86400 ? plural(Math.round(abs / 3600), 'hour') : plural(Math.round(abs / 86400), 'day');
  return `${amount} ${seconds < 0 ? 'behind' : 'ahead'}`;
}

export function notFound(query) {
  return {
    status: 'not_found',
    query,
    findings: [
      { level: 'bad', title: 'We haven\'t heard this node',
        detail: 'No observer on the MeshTexas analyzer has picked it up.',
        fix: 'Send a flood advert, wait a minute, then check again. If it still doesn\'t show up, check that the radio uses the same settings as the rest of Texas (910.525 MHz, 62.5 kHz bandwidth, SF7, CR5) and that a repeater is in range.' },
    ],
  };
}
