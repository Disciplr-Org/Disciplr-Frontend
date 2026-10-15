import { build } from 'vite';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

describe('logger in a production Vite browser build', () => {
  it('suppresses debug, info, and warn when process is unavailable', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    let result;
    try {
      result = await build({
        configFile: false,
        mode: 'production',
        build: {
          write: false,
          minify: false,
          rollupOptions: {
            input: resolve(__dirname, '../../../design-system/src/utils/logger.ts'),
            preserveEntrySignatures: 'strict',
            output: { format: 'es', inlineDynamicImports: true },
          },
        },
      });
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
    }

    const output = Array.isArray(result) ? result[0] : result;
    const bundle = output.output[0];
    if (!bundle || bundle.type !== 'chunk') throw new Error('Expected a logger JavaScript bundle');

    const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundle.code).toString('base64')}`;
    const { logger } = await import(moduleUrl);
    const calls = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    const processDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'process');

    try {
      Object.defineProperty(globalThis, 'process', {
        configurable: true,
        value: undefined,
      });
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(calls.debug).not.toHaveBeenCalled();
      expect(calls.info).not.toHaveBeenCalled();
      expect(calls.warn).not.toHaveBeenCalled();
      expect(calls.error).toHaveBeenCalledWith('error');
    } finally {
      if (processDescriptor) {
        Object.defineProperty(globalThis, 'process', processDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'process');
      }
      vi.restoreAllMocks();
    }
  });
});
