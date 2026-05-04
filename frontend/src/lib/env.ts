/**
 * Environment variables with runtime validation
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue
  if (!value && !defaultValue) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value || ""
}

function getOptionalEnvVar(key: string, defaultValue = ""): string {
  const value = import.meta.env[key]
  return value ?? defaultValue
}

export const env = {
  VITE_API_URL: getEnvVar("VITE_API_URL", "http://localhost:8000"),
  VITE_APP_NAME: getEnvVar("VITE_APP_NAME", "ITNB Hub"),
  VITE_APP_URL: getEnvVar("VITE_APP_URL", "http://localhost:5173"),
  VITE_ID_CARD_FRONT_TEMPLATE_URL: getOptionalEnvVar("VITE_ID_CARD_FRONT_TEMPLATE_URL"),
  VITE_ID_CARD_BACK_TEMPLATE_URL: getOptionalEnvVar("VITE_ID_CARD_BACK_TEMPLATE_URL"),
}
