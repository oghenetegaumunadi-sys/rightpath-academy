import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const [
  { data: components, error: componentError },
  { data: currentTerm, error: termError },
] = await Promise.all([
  supabase
    .from("assessment_components")
    .select(`
      id,
      name,
      code,
      maximum_score,
      weight_percentage,
      sort_order,
      is_active
    `)
    .order("sort_order"),

  supabase
    .from("terms")
    .select(`
      id,
      name,
      term_number,
      starts_on,
      ends_on,
      status,
      is_current,
      academic_sessions (
        id,
        name
      )
    `)
    .eq("is_current", true)
    .maybeSingle(),
]);

if (componentError) {
  console.error("COMPONENT ERROR:", componentError);
} else {
  console.log("\nASSESSMENT COMPONENTS");
  console.table(components ?? []);
}

if (termError) {
  console.error("TERM ERROR:", termError);
} else {
  console.log("\nCURRENT TERM");
  console.dir(currentTerm, { depth: null });
}
