import OpenAI from "openai";
import type { ExtractionResult } from "@/types/claims";

const STRUCTURING_SYSTEM_PROMPT = `You are a receipt data extraction system for reimbursement claims.
You receive OCR text from a receipt, invoice, or proof document.
Return ONLY valid JSON with:
merchant_name, date, total_amount, currency, line_items, category_guess, confidence.
Use null when uncertain, prefer USD when currency is not explicit, and keep confidence between 0 and 1.`;

function createLowConfidenceFallback(rawText?: string): ExtractionResult {
  const normalizedText = rawText?.trim() ?? "";
  const amounts = Array.from(
    normalizedText.matchAll(/\b(?:\$)?(\d{1,4}(?:\.\d{2})?)\b/g),
    (match) => Number(match[1]),
  ).filter((value) => Number.isFinite(value));
  const plausibleAmounts = amounts.filter((value) => value >= 1 && value <= 1000);
  const totalAmount = plausibleAmounts.length > 0 ? Math.max(...plausibleAmounts) : null;

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const merchant =
    lines.find((line) => /[a-z]/i.test(line) && !/^\$?\d/.test(line)) ?? null;

  const dateMatch = normalizedText.match(
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/,
  );
  const lower = normalizedText.toLowerCase();
  const categoryGuess =
    /restaurant|cafe|coffee|pizza|burger|meal|lunch|dinner|breakfast|receipt/.test(
      lower,
    )
      ? "food"
      : "other";

  return {
    merchant_name: merchant,
    date: dateMatch?.[1] ?? null,
    total_amount: totalAmount,
    currency: "USD",
    line_items: [],
    category_guess: categoryGuess,
    confidence: normalizedText.length > 40 ? 0.45 : 0.2,
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

async function runImageOcr(fileBuffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  try {
    const result = await worker.recognize(fileBuffer);
    return result.data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });

  try {
    const textResult = await parser.getText();
    const extractedText = textResult.text?.trim() ?? "";

    if (extractedText.length >= 24) {
      return extractedText;
    }

    const screenshotResult = await parser.getScreenshot({ first: 1, scale: 1.5 });
    const firstPage = screenshotResult.pages[0]?.data;

    if (!firstPage) {
      return extractedText;
    }

    return await runImageOcr(Buffer.from(firstPage));
  } finally {
    await parser.destroy();
  }
}

async function extractDocumentText(
  fileBuffer: Buffer,
  contentType: string | null | undefined,
): Promise<string> {
  if (contentType?.includes("pdf")) {
    return extractTextFromPdf(fileBuffer);
  }

  return runImageOcr(fileBuffer);
}

async function structureReceiptText(
  rawText: string,
  config: NonNullable<ReturnType<typeof getExtractionClientConfig>>,
): Promise<ExtractionResult> {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

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
        content: STRUCTURING_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `OCR text from the uploaded receipt follows. Extract the structured fields from it.\n\n${rawText}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    return createLowConfidenceFallback(rawText);
  }

  return JSON.parse(content) as ExtractionResult;
}

export async function extractReceiptData(input: {
  fileBuffer: Buffer;
  contentType?: string | null;
}): Promise<ExtractionResult> {
  try {
    const config = getExtractionClientConfig();
    const rawText = await extractDocumentText(input.fileBuffer, input.contentType);

    if (!rawText.trim()) {
      return createLowConfidenceFallback();
    }

    if (!config) {
      return createLowConfidenceFallback(rawText);
    }

    return await structureReceiptText(rawText, config);
  } catch (error) {
    console.error("[receipt-extraction]", error);
    return createLowConfidenceFallback();
  }
}
