import { classifyEvidenceUrl } from '../evidenceKind';

describe('evidenceKind', () => {
  describe('classifyEvidenceUrl', () => {
    it('should classify GitHub URLs', () => {
      expect(classifyEvidenceUrl('https://github.com/user/repo')).toEqual({
        kind: 'github',
        host: 'github.com'
      });
    });

    it('should classify Figma URLs', () => {
      expect(classifyEvidenceUrl('https://www.figma.com/file/abc123')).toEqual({
        kind: 'figma',
        host: 'www.figma.com'
      });
    });

    it('should classify IPFS URLs with hostname containing ipfs', () => {
      expect(classifyEvidenceUrl('https://ipfs.io/ipfs/QmXoyp')).toEqual({
        kind: 'ipfs',
        host: 'ipfs.io'
      });
    });

    it('should classify other URLs', () => {
      expect(classifyEvidenceUrl('https://example.com')).toEqual({
        kind: 'other',
        host: 'example.com'
      });
    });

    it('should return null for invalid URLs', () => {
      expect(classifyEvidenceUrl('not-a-valid-url')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(classifyEvidenceUrl('')).toBeNull();
    });
  });
});
