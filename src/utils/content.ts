export function formatContentTitle(rawTitle: string | undefined, fallbackId: string) {
  if (rawTitle && rawTitle.trim().length > 0) return rawTitle.trim();

  return fallbackId
    .split('/')
    .pop()
    ?.replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase()) ?? fallbackId;
}

export function extractMarkdownTitle(body: string, fallbackId: string) {
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return formatContentTitle(heading, fallbackId);
}

export function extractMarkdownDescription(body: string) {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && line !== '---');

  return lines[0] ?? 'Type system specifications for CHIBA level-1.';
}