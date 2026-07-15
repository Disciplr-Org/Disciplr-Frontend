/**
 * Token loader utilities
 */

import { DesignTokens } from '../types/tokens';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

export function loadTokens(tokenFile: string): DesignTokens {
  // Reject anything that isn't a plain basename with a .json extension
  if (!/^[^/\\]+\.json$/.test(tokenFile)) {
    throw new Error(`Invalid token file name: "${tokenFile}"`);
  }

  const tokensDir = path.resolve(process.cwd(), 'tokens');
  const tokenPath = path.resolve(tokensDir, tokenFile);

  // Ensure resolved path stays within the tokens directory
  if (!tokenPath.startsWith(tokensDir + path.sep) && tokenPath !== tokensDir) {
    throw new Error(`Path traversal detected for token file: "${tokenFile}"`);
  }

  const tokenData = fs.readFileSync(tokenPath, 'utf-8');
  return JSON.parse(tokenData) as DesignTokens;
}

export function getAllTokens(): DesignTokens {
  const tokenFiles = ['colors.json', 'typography.json', 'spacing.json', 'shadows.json', 'motion.json', 'borders.json', 'z-index.json'];
  const allTokens: DesignTokens = {};
  
  tokenFiles.forEach(file => {
    try {
      const tokens = loadTokens(file);
      Object.assign(allTokens, tokens);
    } catch (error) {
      logger.warn(`Failed to load ${file}:`, error);
    }
  });
  
  return allTokens;
}


/**
 * Resolve a single token by its dotted path (e.g. "color.brand.primary").
 * Returns the token's $value, or the value of a sub-property if a sub-path
 * is provided (e.g. "color.brand.primary.contrast.light" returns the
 * `contrast.light` numeric field).
 *
 * Returns `undefined` if any segment of the path is missing. Use this from
 * component code to fetch individual tokens without re-walking the full
 * tree.
 */
export function getTokenValue(
  root: DesignTokens,
  path: string,
): unknown {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return undefined;
  let cursor: unknown = root;
  for (const part of parts) {
    if (cursor && typeof cursor === "object" && part in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  // If the final node is a token object with $value, return $value.
  if (cursor && typeof cursor === "object" && "$value" in (cursor as Record<string, unknown>)) {
    return (cursor as Record<string, unknown>).$value;
  }
  return cursor;
}
