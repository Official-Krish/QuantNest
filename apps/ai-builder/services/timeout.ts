import { AiBuilderError } from "../errors";

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message = "AI provider timed out.",
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AiBuilderError("PROVIDER_TIMEOUT", message, 504));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
