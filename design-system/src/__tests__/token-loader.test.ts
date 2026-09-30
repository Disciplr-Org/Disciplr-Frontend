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

    it('should throw a SyntaxError for malformed JSON', () => {
      mockedFs.readFileSync.mockReturnValue('{"invalid": }');
      expect(() => loadTokens('invalid.json')).toThrow(SyntaxError);
    });

    it('should throw when JSON is empty string', () => {
      mockedFs.readFileSync.mockReturnValue('');
      expect(() => loadTokens('empty.json')).toThrow(SyntaxError);
    });

    it('should return null when JSON parses to null', () => {
      mockedFs.readFileSync.mockReturnValue('null');
      expect(loadTokens('null.json')).toBeNull();
    });

    it('should return a primitive when JSON parses to a primitive', () => {
      mockedFs.readFileSync.mockReturnValue('42');
      expect(loadTokens('number.json')).toBe(42);
    });

    it('should return an array when JSON parses to an array', () => {
      mockedFs.readFileSync.mockReturnValue('[1,2,3]');
      expect(loadTokens('array.json')).toEqual([1, 2, 3]);
    });

    it('should propagate non-Error thrown values from readFileSync', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw 'string failure';
      });
      expect(() => loadTokens('weird.json')).toThrow();
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
        if (path.toString().includes('z-index.json')) return '{"zIndex": 100}';
        if (path.toString().includes('opacity.json')) return '{"opacity": 0.5}';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        if (path.toString().includes('toast.json')) return '{"toast": {"maxVisible": 5}}';
        return '{}';
      });

      const allTokens = getAllTokens();
      expect(allTokens).toEqual({
        "color": "red",
        "font": "sans",
        "space": "4px",
        "shadow": "1px",
        "motion": "ease",
        "border": "1px",
        "zIndex": 100,
        "opacity": 0.5,
        "breakpoint": "768px",
        "toast": { "maxVisible": 5 }
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
        if (path.toString().includes('z-index.json')) return '{"zIndex": 100}';
        if (path.toString().includes('opacity.json')) return '{"opacity": 0.5}';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        if (path.toString().includes('toast.json')) return '{"toast": {"maxVisible": 5}}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({
        "color": "red",
        "space": "4px",
        "shadow": "1px",
        "motion": "ease",
        "border": "1px",
        "zIndex": 100,
        "opacity": 0.5,
        "breakpoint": "768px",
        "toast": { "maxVisible": 5 }
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
        if (path.toString().includes('z-index.json')) return '{"zIndex": 100}';
        if (path.toString().includes('opacity.json')) return '{"opacity": 0.5}';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        if (path.toString().includes('toast.json')) return '{"toast": {"maxVisible": 5}}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({
        "color": "red",
        "space": "4px",
        "shadow": "1px",
        "motion": "ease",
        "border": "1px",
        "zIndex": 100,
        "opacity": 0.5,
        "breakpoint": "768px",
        "toast": { "maxVisible": 5 }
      });
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load typography.json:',
        expect.any(SyntaxError)
      );
    });

    it('should warn with SyntaxError for malformed JSON and continue', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) return '{"invalid": }';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({ breakpoint: '768px' });
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load colors.json:',
        expect.any(SyntaxError)
      );
    });

    it('should let later files override earlier keys via Object.assign', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) return '{"token": "from-colors"}';
        if (path.toString().includes('breakpoints.json')) return '{"token": "from-breakpoints"}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({"token": "from-breakpoints"});
    });

    it('should still merge a file ordered after a failing one', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) throw new Error('File not found');
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({"breakpoint": "768px"});
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to load colors.json:',
        expect.any(Error)
      );
    });

    it('should not mutate previously merged tokens when a later file fails', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) return '{"color": "red"}';
        if (path.toString().includes('typography.json')) throw new Error('File not found');
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({ color: 'red' });
      expect(allTokens).not.toHaveProperty('font');
    });

    it('should handle a file returning null without throwing', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) return 'null';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({ breakpoint: '768px' });
    });

    it('should handle a file returning a primitive without throwing', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) return '42';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({ breakpoint: '768px' });
    });

    it('should handle a file returning an array without throwing', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) return '[1,2,3]';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        return '{}';
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({ breakpoint: '768px' });
    });

    it('should return an empty object and warn once per file when all files fail', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const allTokens = getAllTokens();

      expect(allTokens).toEqual({});
      expect(console.warn).toHaveBeenCalledTimes(9);
    });

    it('should be deterministic across repeated invocations with same inputs', () => {
      mockedFs.readFileSync.mockImplementation((path) => {
        if (path.toString().includes('colors.json')) return '{"color": "red"}';
        if (path.toString().includes('breakpoints.json')) return '{"breakpoint": "768px"}';
        return '{}';
      });

      const first = getAllTokens();
      const second = getAllTokens();

      expect(first).toEqual(second);
    });
  });
});