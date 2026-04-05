export function hasSupabaseConfig() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasWorldConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_WORLD_APP_ID &&
      process.env.WORLD_RP_ID &&
      process.env.WORLD_RP_SIGNING_KEY,
  );
}

export function isWorldBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.WORLD_ID_BYPASS === "true" &&
    process.env.NEXT_PUBLIC_WORLD_ID_BYPASS === "true"
  );
}
