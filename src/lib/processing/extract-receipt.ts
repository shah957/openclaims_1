import OpenAI from "openai";
import type { ExtractionResult } from "@/types/claims";

const SYSTEM_PROMPT = `You are a receipt data extraction system for reimbursement claims.
Return ONLY valid JSON with:
merchant_name, date, total_amount, currency, line_items, category_guess, confidence.
Use null when uncertain, prefer USD when currency is not explicit, and keep confidence between 0 and 1.`;

function createLowConfidenceFallback(): ExtractionResult {
  return {
    merchant_name: null,
    date: null,
    total_amount: null,
    currency: "USD",
    line_items: [],
    category_guess: "other",
    confidence: 0.2,
  };
}

function getExtractionClientConfig() {
  if (process.env.RCAC_GENAI_API_KEY) {
    return {
      apiKey: process.env.RCAC_GENAI_API_KEY,
      baseURL: process.env.RCAC_GENAI_BASE_URL ?? "https://genai.rcac.purdue.edu/api",
      model: process.env.RCAC_GENAI_MODEL ?? "llama4:latest",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: undefined,
      model: "gpt-4o",
    };
  }

  return null;
}

export async function extractReceiptData(
  imageUrl: string,
): Promise<ExtractionResult> {
  const config = getExtractionClientConfig();

  if (!config) {
    return createLowConfidenceFallback();
  }

  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      temperature: 0,
      max_completion_tokens: 500,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the structured fields from this receipt or proof document.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return createLowConfidenceFallback();
    }

    return JSON.parse(content) as ExtractionResult;
  } catch {
    return createLowConfidenceFallback();
  }
}
