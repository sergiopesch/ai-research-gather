const port = process.env.PORT || "3001";
const target = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${port}/api/health`;
const timeout = Number(process.env.HEALTHCHECK_TIMEOUT_MS || "5000");

try {
  const response = await fetch(target, { signal: AbortSignal.timeout(timeout) });
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);

  const payload = JSON.parse(body);
  if (payload.ok !== true) throw new Error(`Unexpected response: ${body.slice(0, 200)}`);

  console.log(`Healthy: ${target}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Healthcheck failed for ${target}: ${message}`);
  process.exit(1);
}
