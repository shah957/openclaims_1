import OpenAI from "openai";
import type { ExtractionResult } from "@/types/claims";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const GEMINI_MODEL = "gemini-3-flash-preview";

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
    debug: {
      source: "heuristic",
      provider: "none",
    },
  };
}

function buildImageDataUrl(fileBuffer: Buffer, contentType: string | null | undefined) {
  const mimeType = contentType?.trim() || "image/jpeg";
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

export async function extractReceiptData(input: {
  fileBuffer: Buffer;
  contentType?: string | null;
}): Promise<ExtractionResult> {
  if (!process.env.GEMINI_API_KEY) {
    return createLowConfidenceFallback();
  }

  const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: process.env.GEMINI_BASE_URL ?? GEMINI_BASE_URL,
  });

  try {
    const response = await openai.chat.completions.create({
      model: process.env.GEMINI_MODEL ?? GEMINI_MODEL,
      temperature: 0,
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
                url: buildImageDataUrl(input.fileBuffer, input.contentType),
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

    const parsed = JSON.parse(content) as ExtractionResult;

    return {
      ...parsed,
      debug: {
        source: "llm",
        provider: "gemini",
        model: process.env.GEMINI_MODEL ?? GEMINI_MODEL,
        llm_output_raw: content,
      },
    };
  } catch (error) {
    console.error("[receipt-extraction]", error);
    return createLowConfidenceFallback();
  }
}
