/**
 * Mock Implementations
 *
 * Utilities for mocking external services in tests
 */

import { vi } from "vitest";

/**
 * Mock the current time for consistent test results
 */
export function mockTime(timestamp: number = Date.now()): () => void {
  const originalNow = Date.now;
  vi.spyOn(Date, "now").mockReturnValue(timestamp);

  // Return cleanup function
  return () => {
    vi.spyOn(Date, "now").mockImplementation(originalNow);
  };
}

/**
 * Create a mock for Anthropic SDK
 */
export function createAnthropicMock(response: string = "Mocked response") {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        id: "mock-id",
        content: [{ type: "text", text: response }],
        model: "claude-3-sonnet-20240229",
        role: "assistant",
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
    },
  };
}

/**
 * Create a mock for OpenAI SDK
 */
export function createOpenAIMock(response: string = "Mocked response") {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: "mock-id",
          choices: [
            {
              message: { role: "assistant", content: response },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      },
    },
  };
}

/**
 * Create a mock for Google Generative AI SDK
 */
export function createGoogleAIMock(response: string = "Mocked response") {
  return {
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => response,
          candidates: [{ content: { parts: [{ text: response }] } }],
        },
      }),
    }),
  };
}

/**
 * Mock fetch for API testing
 */
export function mockFetch(responses: Record<string, unknown>): () => void {
  const originalFetch = global.fetch;

  global.fetch = vi.fn().mockImplementation((url: string) => {
    const response = responses[url];
    if (response) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
      });
    }
    return Promise.reject(new Error(`Unmocked URL: ${url}`));
  });

  return () => {
    global.fetch = originalFetch;
  };
}

/**
 * Create mock file for upload tests
 */
export function createMockFile(
  name: string = "test.png",
  type: string = "image/png",
  size: number = 1024
): File {
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}

/**
 * Mock console methods to suppress output in tests
 */
export function silenceConsole(): () => void {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();

  return () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  };
}
