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

const { data, error } = await supabase
  .from("assessment_components")
  .select(`
    name,
    code,
    maximum_score,
    weight_percentage,
    sort_order,
    is_active
  `)
  .eq("is_active", true)
  .order("sort_order");

if (error) {
  console.error(error);
  process.exit(1);
}

console.table(data);

const total = data.reduce(
  (sum, component) =>
    sum + Number(component.weight_percentage),
  0,
);

console.log(`Total active weight: ${total}`);
