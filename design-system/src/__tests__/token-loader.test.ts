import { loadTokens, getAllTokens } from '../utils/token-loader';
import * as fs from 'fs';
import fc from 'fast-check';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

const tokenFiles = [
  'colors.json',
  'typography.json',
  'spacing.json',
  'shadows.json',
  'motion.json',
  'borders.json',
] as const;

const tokenKey = fc.constantFrom(
  '$type',
  '$value',
  '$description',
  'color',
  'typography',
  'spacing',
  'shadow',
  'motion',
  'border',
  'light',
  'dark',
  'nested',
  'token',
  'level',
);

const jsonValue = fc.letrec((tie) => ({
  value: fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null),
    fc.array(tie('value'), { maxLength: 3 }),
    fc.dictionary(tokenKey, tie('value'), { maxKeys: 4 }),
  ),
}));

const tokenObject = fc.dictionary(tokenKey, jsonValue.value, {
  minKeys: 1,
  maxKeys: 4,
});

const filePayloads = fc.record({
  'colors.json': tokenObject.map((color) => ({ color })),
  'typography.json': tokenObject.map((typography) => ({ typography })),
  'spacing.json': tokenObject.map((spacing) => ({ spacing })),
  'shadows.json': tokenObject.map((shadow) => ({ shadow })),
  'motion.json': tokenObject.map((motion) => ({ motion })),
  'borders.json': tokenObject.map((border) => ({ border })),
});

const mockTokenFiles = (
  payloads: Record<(typeof tokenFiles)[number], Record<string, unknown>>,
  missingFile?: (typeof tokenFiles)[number],
) => {
  mockedFs.readFileSync.mockImplementation((filePath) => {
    const matchedFile = tokenFiles.find((file) =>
      filePath.toString().includes(file),
    );

    if (!matchedFile) {
      return '{}';
    }

    if (matchedFile === missingFile) {
      throw new Error(`Missing ${matchedFile}`);
    }

    return JSON.stringify(payloads[matchedFile]);
  });
};

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

    it('round-trips arbitrary nested token trees from JSON', () => {
      fc.assert(
        fc.property(tokenObject, (tree) => {
          mockedFs.readFileSync.mockReturnValue(JSON.stringify(tree));

          expect(loadTokens('colors.json')).toEqual(tree);
        }),
        { seed: 202601, numRuns: 50 },
      );
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

    it('merges arbitrary nested token file payloads without flattening them', () => {
      fc.assert(
        fc.property(filePayloads, (payloads) => {
          mockTokenFiles(payloads);

          expect(getAllTokens()).toEqual(
            Object.assign(
              {},
              payloads['colors.json'],
              payloads['typography.json'],
              payloads['spacing.json'],
              payloads['shadows.json'],
              payloads['motion.json'],
              payloads['borders.json'],
            ),
          );
        }),
        { seed: 202602, numRuns: 50 },
      );
    });

    it('skips arbitrary missing token files and preserves the rest', () => {
      fc.assert(
        fc.property(
          filePayloads,
          fc.constantFrom(...tokenFiles),
          (payloads, missingFile) => {
            mockTokenFiles(payloads, missingFile);

            const expectedPayloads = tokenFiles
              .filter((file) => file !== missingFile)
              .map((file) => payloads[file]);

            expect(getAllTokens()).toEqual(Object.assign({}, ...expectedPayloads));
            expect(console.warn).toHaveBeenCalledWith(
              `Failed to load ${missingFile}:`,
              expect.any(Error),
            );
          },
        ),
        { seed: 202603, numRuns: 50 },
      );
    });

    it('should continue and warn if a file fails to load', () => {
        mockedFs.readFileSync.mockImplementation((path) => {
            if (path.toString().includes('colors.json')) return '{"color": "red"}';
            if (path.toString().includes('typography.json')) throw new Error('File not found');
            return '{}';
        });

        const allTokens = getAllTokens();
        expect(allTokens).toEqual({"color": "red"});
        expect(console.warn).toHaveBeenCalled();
    });
    
    it('should continue and warn if a file has malformed JSON', () => {
        mockedFs.readFileSync.mockImplementation((path) => {
            if (path.toString().includes('colors.json')) return '{"color": "red"}';
            if (path.toString().includes('typography.json')) return '{"invalid": }';
            return '{}';
        });

        const allTokens = getAllTokens();
        expect(allTokens).toEqual({"color": "red"});
        expect(console.warn).toHaveBeenCalled();
    });
  });
});
