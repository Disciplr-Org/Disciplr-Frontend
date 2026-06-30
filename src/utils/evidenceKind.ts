export type EvidenceKind = 'github' | 'figma' | 'ipfs' | 'other';

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
