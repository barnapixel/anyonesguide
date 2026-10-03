const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const supabasePublishableKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)
  || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim() ?? ''
const geoapifyApiKey = (import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined)?.trim() ?? ''

export const appConfig = {
  supabaseUrl,
  supabasePublishableKey,
  geoapifyApiKey,
  privacyOperator: (import.meta.env.VITE_PRIVACY_OPERATOR_NAME as string | undefined)?.trim() ?? '',
  privacyEmail: (import.meta.env.VITE_PRIVACY_CONTACT_EMAIL as string | undefined)?.trim() ?? '',
  cloudEnabled: Boolean(supabaseUrl && supabasePublishableKey),
  geoapifyEnabled: Boolean(geoapifyApiKey),
}
