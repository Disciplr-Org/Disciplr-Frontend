export type EnvWarning = {
  field: string
  message: string
}

export type EnvReport = {
  warnings: EnvWarning[]
}

const DEFAULT_SECRETS = ['SECRET_KEY', 'SOROBAN_SECRET']

const REQUIRED_SOROBAN_CONFIG = ['SOROBAN_RPC_URL', 'SOROBAN_NETWORK']

export function buildEnvReport(env: Record<string, string | undefined>): EnvReport {
  const warnings: EnvWarning[] = []

  for (const key of DEFAULT_SECRETS) {
    const value = env[key]
    if (value && value === 'default') {
      warnings.push({ field: key, message: `Insecure default secret set for ${key}` })
    }
  }

  const hasSomeSoroban = REQUIRED_SOROBAN_CONFIG.some(key => !!env[key])
  const hasAllSoroban = REQUIRED_SOROBAN_CONFIG.every(key => !!env[key])
  if (hasSomeSoroban && !hasAllSoroban) {
    const missing = REQUIRED_SOROBAN_CONFIG.filter(key => !env[key])
    for (const key of missing) {
      warnings.push({ field: key, message: `Partial Soroban configuration detected: ${key} is missing` })
    }
  }

  return { warnings }
}

export function getEnvWarningFields(report: EnvReport): string[] {
  return report.warnings.map(warning => warning.field)
}
