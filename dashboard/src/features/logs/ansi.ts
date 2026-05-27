// FiveM console caret colors (^0–^9), txAdmin-style. Returns safe HTML: the
// text is HTML-escaped and only our own <span style="color:…"> tags are added,
// and any open color is force-closed at end of line (no bleed into next line).

const CARET: Record<string, string> = {
  '0': '#d4d4d4', // white / default
  '1': '#f44747', // red
  '2': '#4ec9b0', // green
  '3': '#dcdcaa', // yellow
  '4': '#569cd6', // blue
  '5': '#4fc1ff', // cyan
  '6': '#c586c0', // magenta / pink
  '7': '#d4d4d4', // white
  '8': '#ce9178', // orange
  '9': '#808080', // grey
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Deterministic color for a console prefix/resource — the same channel always
// gets the same color; different channels get different (hue, sat, light) tuples
// so even a hue collision lands on a distinct shade. Constrained to stay readable
// on the dark background.
export function channelColor(channel: string): string {
  let h1 = 2166136261;
  let h2 = 5381;
  for (let i = 0; i < channel.length; i++) {
    const c = channel.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = (h1 * 16777619) >>> 0;
    h2 = ((h2 * 33) ^ c) >>> 0;
  }
  const hue = h1 % 360;
  const sat = 60 + (h2 % 24); // 60–83%
  const light = 60 + ((h1 >>> 8) % 16); // 60–75%
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function consoleLineToHtml(raw: string): string {
  // Drop ANSI escape sequences if present (we color from caret codes).
  const text = raw.replace(/\[[0-9;]*m/g, '');

  let html = '';
  let buf = '';
  let open = false;
  const flush = () => {
    if (buf) {
      html += escapeHtml(buf);
      buf = '';
    }
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (ch === '^' && next !== undefined && next >= '0' && next <= '9') {
      flush();
      if (open) {
        html += '</span>';
        open = false;
      }
      html += `<span style="color:${CARET[next]}">`;
      open = true;
      i++; // consume the digit
    } else {
      buf += ch;
    }
  }
  flush();
  if (open) html += '</span>'; // force reset at end of line
  return html;
}
