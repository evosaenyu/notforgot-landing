/** One-off health check — npm run db:check-promo-signups */
import fs from "node:fs";

const paths = ["./.env.local", "./.env"];
for (const p of paths) {
  try {
    const raw = fs.readFileSync(p, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const i = trimmed.indexOf("=");
      if (i === -1) return;
      const k = trimmed.slice(0, i).trim();
      let v = trimmed.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    });
    break;
  } catch {
    /* try next */
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY (.env.local).");
  process.exit(2);
}

const endpoint = `${url.replace(/\/$/, "")}/rest/v1/promo_signups?select=id&limit=1`;

const res = await fetch(endpoint, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});

console.log(`HTTP ${res.status}`);
if (!res.ok) {
  const body = await res.text();
  console.error(body.slice(0, 500));
  if (res.status === 404 && body.includes("PGRST205")) {
    console.error(
      "\nTable missing — paste and run supabase/migrations/20260521153000_promo_signups.sql in Supabase SQL, then rerun this script."
    );
  }
  process.exit(1);
}
console.log("OK: promo_signups exists and credentials reach the not-forgot API.");
process.exit(0);
