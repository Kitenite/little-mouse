export const HOSTED_GAME = 'https://little-mouse-cat-play-kietho.weedypiece1.chatgpt.site';
export const DEFAULT_GAME = process.env.EXPO_PUBLIC_GAME_URL || HOSTED_GAME;

export function normalizeGameUrl(input: string): string {
  const url = new URL(input.trim());
  const host = url.hostname;
  const octets = host.split('.');
  const ipv4 = octets.length === 4 && octets.every(octet => /^\d{1,3}$/.test(octet) && Number(octet) <= 255);
  const [a, b] = octets.map(Number);
  const local = host === 'localhost' || host === '[::1]' || host.endsWith('.local') ||
    (ipv4 && (a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)));
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new Error('Use an HTTPS address, or an HTTP address on your home network.');
  }
  if (url.username || url.password) throw new Error('Use an address without a username or password.');
  url.hash = '';
  url.search = '';
  url.pathname = '/';
  return url.toString();
}
export function companionUrl(game: string): string {
  return new URL('/companion', normalizeGameUrl(game)).toString();
}

export function isAllowedWebUrl(url: string): boolean {
  if (url === "about:blank") return true;
  try { normalizeGameUrl(url); return true; } catch { return false; }
}
