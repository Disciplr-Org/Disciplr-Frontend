export type EvidenceKind = 'github' | 'figma' | 'ipfs' | 'other';

/**
 * Brand colors for evidence-source badge UI.
 * Each value is the hex color for the source's brand mark.
 * The `other` entry uses a CSS variable because there is no single brand color.
 *
 * Usage:
 *   background: `color-mix(in srgb, ${EVIDENCE_BADGE_COLORS[kind]} 10%, transparent)`
 *   color:       EVIDENCE_BADGE_COLORS[kind]
 */
export const EVIDENCE_BADGE_COLORS: Record<EvidenceKind, string> = {
  github: '#24292e',
  figma: '#f24e1e',
  ipfs: '#65c3cb',
  other: 'var(--muted)',
};

export interface EvidenceInfo {
  kind: EvidenceKind;
  host: string;
}

export function classifyEvidenceUrl(url: string): EvidenceInfo | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('github.com')) {
      return { kind: 'github', host: 'github.com' };
    }

    if (parsed.hostname.includes('figma.com')) {
      return { kind: 'figma', host: 'figma.com' };
    }

    if (parsed.protocol === 'ipfs:' || parsed.hostname.includes('ipfs')) {
      return { kind: 'ipfs', host: parsed.hostname };
    }

    return { kind: 'other', host: parsed.hostname };
  } catch {
    return null;
  }
}
