/**
 * Standalone connection check - run with:  npm run health -w server
 * Performs a REAL request against the configured Gemma 4 endpoint.
 */
import "dotenv/config";
import { probe, generateContent, CONFIG, GemmaError } from "../gemma.js";

const health = await probe();
console.log("health:", JSON.stringify(health, null, 2));
if (!health.ok) {
  console.error("\nResult: NOT VERIFIED - fix the issue above.");
  process.exit(1);
}
if (CONFIG.demoMode) {
  console.log("\nResult: DEMO mode. No model call performed.");
  process.exit(0);
}

try {
  const t0 = Date.now();
  const text = await generateContent([
    {
      role: "user",
      parts: [
        {
          text: 'Reply with exactly this JSON and nothing else: {"status":"ok","model":"gemma-4"}',
        },
      ],
    },
  ]);
  console.log(`\nreal generateContent call: ${Date.now() - t0} ms`);
  console.log("raw response:", text.slice(0, 400));
  console.log(`\nResult: VERIFIED against model "${CONFIG.model}".`);
} catch (err) {
  if (err instanceof GemmaError) {
    console.error(`\nResult: FAILED [${err.kind}] ${err.message}`);
    if (err.detail) console.error("detail:", err.detail);
  } else {
    console.error("\nResult: FAILED", err);
  }
  process.exit(1);
}
