#!/usr/bin/env node

import { existsSync } from "node:fs";
import { join } from "node:path";

const requiredEnvGroups = [
  {
    name: "App",
    keys: ["NEXT_PUBLIC_APP_URL"],
  },
  {
    name: "Supabase",
    keys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
  {
    name: "World ID",
    keys: [
      "NEXT_PUBLIC_WORLD_APP_ID",
      "NEXT_PUBLIC_WORLD_ENV",
      "WORLD_RP_ID",
      "WORLD_RP_SIGNING_KEY",
    ],
  },
];

const optionalEnvGroups = [
  {
    name: "Processing and notifications",
    keys: ["OPENAI_API_KEY", "RESEND_API_KEY", "RESEND_FROM_EMAIL"],
  },
];

const requiredFiles = [
  "supabase/migrations/002_claim_contact_email.sql",
  "src/app/api/claims/route.ts",
  "src/app/api/documents/process/route.ts",
  "src/app/api/notifications/route.ts",
  "src/app/api/rp-signature/route.ts",
  "src/app/api/verify-proof/route.ts",
];

function printSection(title) {
  console.log(`\n${title}`);
}

function printKeyStatus(key, present) {
  console.log(`  ${present ? "[ok]" : "[missing]"} ${key}`);
}

let missingRequired = false;

console.log("OpenClaims Ops deployment readiness check");
console.log(`Workspace: ${process.cwd()}`);

printSection("Environment variables");
for (const group of requiredEnvGroups) {
  console.log(`- ${group.name}`);
  for (const key of group.keys) {
    const present = Boolean(process.env[key]);
    printKeyStatus(key, present);
    if (!present) {
      missingRequired = true;
    }
  }
}

printSection("Optional integrations");
for (const group of optionalEnvGroups) {
  console.log(`- ${group.name}`);
  for (const key of group.keys) {
    printKeyStatus(key, Boolean(process.env[key]));
  }
}
console.log("  [info] Receipt extraction can use OPENAI_API_KEY or RCAC_GENAI_API_KEY.");

printSection("Required files");
for (const file of requiredFiles) {
  const present = existsSync(join(process.cwd(), file));
  printKeyStatus(file, present);
  if (!present) {
    missingRequired = true;
  }
}

printSection("Next checks for Vercel");
console.log("  1. Import the project into Vercel.");
console.log("  2. Copy the required environment variables into the Vercel project.");
console.log("  3. Run the Supabase migration 002_claim_contact_email.sql.");
console.log("  4. Verify /api/rp-signature, /api/verify-proof, and the public claim flow in the deployed app.");
console.log("  5. Verify the World ID simulator or staging app against the deployed URL.");

if (missingRequired) {
  console.error(
    "\nDeployment readiness check failed. Fill in the missing required items before shipping.",
  );
  process.exitCode = 1;
} else {
  console.log("\nDeployment readiness check passed.");
}
