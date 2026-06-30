/** POST JSON and stream a text/plain response, invoking onChunk with the accumulated text.
 *  Aborts after timeoutMs so a stalled/timed-out server stream never hangs the UI forever. */
export async function streamPost(
  url: string,
  body: unknown,
  onChunk: (accumulated: string) => void,
  timeoutMs = 70000
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.body) throw new Error("No response stream.");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      onChunk(acc);
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("This took too long and timed out. Try again — briefs run faster on retry.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
