/**
 * Token loader utilities
 */

import { DesignTokens } from '../types/tokens';
import * as fs from 'fs';
import * as path from 'path';

export function loadTokens(tokenFile: string): DesignTokens {
  const tokenPath = path.join(process.cwd(), 'tokens', tokenFile);
  const tokenData = fs.readFileSync(tokenPath, 'utf-8');
  return JSON.parse(tokenData) as DesignTokens;
}

export function getAllTokens(): DesignTokens {
  const tokenFiles = ['colors.json', 'typography.json', 'spacing.json', 'shadows.json', 'motion.json', 'borders.json'];
  const allTokens: DesignTokens = {};
  
  tokenFiles.forEach(file => {
    try {
      const tokens = loadTokens(file);
      Object.assign(allTokens, tokens);
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
    }
  });
  
  return allTokens;
}
