import Anthropic from "@anthropic-ai/sdk";

// Server-only. Never import this from a Client Component.
export function createAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export const EXTRACTION_MODEL = "claude-opus-5";
