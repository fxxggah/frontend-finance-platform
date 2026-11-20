import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { validateReleaseEnvironment } from "../lib/release-environment.mjs";

const release = {
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_API_URL: "https://api.example.com",
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: "fixture.apps.googleusercontent.com",
  NEXT_PUBLIC_USE_MOCK: "false",
  NEXT_PUBLIC_VOICE_PILOT_ENABLED: "false",
  NEXT_PUBLIC_BILLING_ENABLED: "false",
};

test("a configuração é validada no Preview e o desenvolvimento mantém o fallback", () => {
  assert.doesNotThrow(() => validateReleaseEnvironment({}));
  assert.doesNotThrow(() => validateReleaseEnvironment(release));
  for (const value of [undefined, "http://api.example.com", "https://localhost", "https://127.0.0.1", "https://[::1]", "https://railway.internal", "https://user:secret@api.example.com"]) {
    assert.throws(() => validateReleaseEnvironment({...release, NEXT_PUBLIC_API_URL:value}), error => {
      assert.match(error.message, /NEXT_PUBLIC_API_URL/);
      assert.doesNotMatch(error.message, /user:secret/);
      return true;
    });
  }
  assert.throws(() => validateReleaseEnvironment({...release, NEXT_PUBLIC_GOOGLE_CLIENT_ID:undefined}), /NEXT_PUBLIC_GOOGLE_CLIENT_ID/);
});

test("o lançamento exige pilotos e mocks desligados e aprovação pública em Production", () => {
  for (const key of ["NEXT_PUBLIC_USE_MOCK", "NEXT_PUBLIC_VOICE_PILOT_ENABLED", "NEXT_PUBLIC_BILLING_ENABLED"]) {
    assert.throws(() => validateReleaseEnvironment({...release, [key]:"true"}), new RegExp(key));
  }
  const production = {...release, VERCEL_ENV:"production"};
  assert.throws(() => validateReleaseEnvironment(production), /FIN_PUBLIC_COPY_APPROVED/);
  assert.throws(() => validateReleaseEnvironment({...production, FIN_PUBLIC_COPY_APPROVED:"true"}), /FIN_PRIVACY_CONTACT_EMAIL/);
  assert.doesNotThrow(() => validateReleaseEnvironment({...production, FIN_PUBLIC_COPY_APPROVED:"true", FIN_PRIVACY_CONTACT_EMAIL:"privacy@example.com"}));
});

test("metas e datas civis preservam o dia em São Paulo e em Auckland", async () => {
  const source = await readFile(new URL("../lib/format/date.ts", import.meta.url), "utf8");
  const {outputText} = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext, target:ts.ScriptTarget.ES2022}});
  const dates = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Pacific/Auckland";
    assert.equal(dates.formatDate("2026-11-20"), "20/11/2026");
    assert.equal(dates.formatInvoiceReference("2026-12-01"), "2026-12");
    assert.equal(dates.formatDate("2026-11-21T01:30:00Z"), "20/11/2026");
    assert.equal(dates.getToday(new Date("2026-11-21T01:30:00Z")), "2026-11-20");
    assert.equal(dates.getToday(new Date("2026-11-21T03:00:00Z")), "2026-11-21");
  } finally {
    if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
  }
});
