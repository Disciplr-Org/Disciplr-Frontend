import { loadTokens, getAllTokens } from '../utils/token-loader';
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('token-loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('loadTokens', () => {
    it('should parse valid JSON', () => {
      mockedFs.readFileSync.mockReturnValue('{"color": {"primary": "red"}}');
      const tokens = loadTokens('colors.json');
      expect(tokens).toEqual({"color": {"primary": "red"}});
    });

    it('should throw if file does not exist', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      expect(() => loadTokens('nonexistent.json')).toThrow('File not found');
    });

    it('should throw if JSON is malformed', () => {
        mockedFs.readFileSync.mockReturnValue('{"invalid": }');
        expect(() => loadTokens('invalid.json')).toThrow();
    });
  });

  describe('getAllTokens', () => {
    it('should merge all tokens', () => {
        mockedFs.readFileSync.mockImplementation((path) => {
            if (path.toString().includes('colors.json')) return '{"color": "red"}';
            if (path.toString().includes('typography.json')) return '{"font": "sans"}';
            if (path.toString().includes('spacing.json')) return '{"space": "4px"}';
            if (path.toString().includes('shadows.json')) return '{"shadow": "1px"}';
            if (path.toString().includes('motion.json')) return '{"motion": "ease"}';
            if (path.toString().includes('borders.json')) return '{"border": "1px"}';
            return '{}';
        });

        const allTokens = getAllTokens();
        expect(allTokens).toEqual({
            "color": "red",
            "font": "sans",
            "space": "4px",
            "shadow": "1px",
            "motion": "ease",
            "border": "1px"
        });
    });

    it('should continue and warn if a file fails to load', () => {
        mockedFs.readFileSync.mockImplementation((path) => {
            if (path.toString().includes('typography.json')) throw new Error('File not found');
            if (path.toString().includes('colors.json')) return '{"color": "red"}';
            if (path.toString().includes('spacing.json')) return '{"space": "4px"}';
            if (path.toString().includes('shadows.json')) return '{"shadow": "1px"}';
            if (path.toString().includes('motion.json')) return '{"motion": "ease"}';
            if (path.toString().includes('borders.json')) return '{"border": "1px"}';
            return '{}';
        });

        const allTokens = getAllTokens();

        // The failed file is omitted, every other file is still merged.
        expect(allTokens).toEqual({
            "color": "red",
            "space": "4px",
            "shadow": "1px",
            "motion": "ease",
            "border": "1px"
        });
        expect(allTokens).not.toHaveProperty('font');
    });

    it('should warn with the name of the file that failed to load', () => {
        mockedFs.readFileSync.mockImplementation((path) => {
            if (path.toString().includes('typography.json')) throw new Error('File not found');
            return '{}';
        });

        getAllTokens();

        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith(
            'Failed to load typography.json:',
            expect.any(Error)
        );
    });
    
    it('should continue and warn if a file has malformed JSON', () => {
        mockedFs.readFileSync.mockImplementation((path) => {
            if (path.toString().includes('typography.json')) return '{"invalid": }';
            if (path.toString().includes('colors.json')) return '{"color": "red"}';
            if (path.toString().includes('spacing.json')) return '{"space": "4px"}';
            if (path.toString().includes('shadows.json')) return '{"shadow": "1px"}';
            if (path.toString().includes('motion.json')) return '{"motion": "ease"}';
            if (path.toString().includes('borders.json')) return '{"border": "1px"}';
            return '{}';
        });

        const allTokens = getAllTokens();

        // A parse error is caught just like a read error: the bad file is dropped.
        expect(allTokens).toEqual({
            "color": "red",
            "space": "4px",
            "shadow": "1px",
            "motion": "ease",
            "border": "1px"
        });
        expect(console.warn).toHaveBeenCalledWith(
            'Failed to load typography.json:',
            expect.any(SyntaxError)
        );
    });

    it('should let later files override earlier keys via Object.assign', () => {
        // colors.json is merged first, borders.json last; the shared "token"
        // key must reflect the last file processed.
        mockedFs.readFileSync.mockImplementation((path) => {
            if (path.toString().includes('colors.json')) return '{"token": "from-colors"}';
            if (path.toString().includes('borders.json')) return '{"token": "from-borders"}';
            return '{}';
        });

        const allTokens = getAllTokens();

        expect(allTokens).toEqual({"token": "from-borders"});
    });

    it('should still merge a file ordered after a failing one', () => {
        mockedFs.readFileSync.mockImplementation((path) => {
            // colors (first) fails, borders (last) must still be merged.
            if (path.toString().includes('colors.json')) throw new Error('File not found');
            if (path.toString().includes('borders.json')) return '{"border": "1px"}';
            return '{}';
        });

        const allTokens = getAllTokens();

        expect(allTokens).toEqual({"border": "1px"});
        expect(console.warn).toHaveBeenCalledWith(
            'Failed to load colors.json:',
            expect.any(Error)
        );
    });

    it('should return an empty object and warn once per file when all files fail', () => {
        mockedFs.readFileSync.mockImplementation(() => {
            throw new Error('File not found');
        });

        const allTokens = getAllTokens();

        expect(allTokens).toEqual({});
        expect(console.warn).toHaveBeenCalledTimes(6);
    });
  });
});
