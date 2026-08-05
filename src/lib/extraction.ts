"use server";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { createAnthropicClient, EXTRACTION_MODEL } from "@/lib/anthropic";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const vehicleRegistrationSchema = z.object({
  make: z.string().nullable(),
  model: z.string().nullable(),
  year: z.number().int().nullable(),
  vin: z.string().nullable(),
  license_plate: z.string().nullable(),
  registration_expiry: z
    .string()
    .nullable()
    .describe("Expiration date in ISO format YYYY-MM-DD"),
});

export type ExtractedVehicleRegistration = z.infer<
  typeof vehicleRegistrationSchema
>;

const invoiceSchema = z.object({
  vendor: z.string().nullable(),
  amount: z.number().nullable(),
  invoice_date: z
    .string()
    .nullable()
    .describe("Invoice date in ISO format YYYY-MM-DD"),
  category: z
    .enum([
      "fuel",
      "toll",
      "fine",
      "parking",
      "registration_fee",
      "insurance_premium",
      "other",
    ])
    .nullable(),
  description: z.string().nullable(),
});

export type ExtractedInvoice = z.infer<typeof invoiceSchema>;

async function fileToContentBlock(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const data = bytes.toString("base64");

  if (file.type === "application/pdf") {
    return {
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: "application/pdf" as const,
        data,
      },
    };
  }

  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error(
      "Unsupported file type. Upload a JPEG, PNG, GIF, WebP image or a PDF."
    );
  }

  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      data,
    },
  };
}

function getUploadedFile(formData: FormData): File | { error: string } {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      error:
        "AI extraction isn't configured yet — ask an admin to add ANTHROPIC_API_KEY.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file first." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File is too large (max 10MB)." };
  }
  return file;
}

export async function extractVehicleRegistration(
  formData: FormData
): Promise<{ data?: ExtractedVehicleRegistration; error?: string }> {
  const file = getUploadedFile(formData);
  if ("error" in file) return file;

  try {
    const block = await fileToContentBlock(file);
    const client = createAnthropicClient();

    const response = await client.messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            block,
            {
              type: "text",
              text: "This is a vehicle registration document. Extract the vehicle's make, model, year, VIN, license plate and registration expiry date. Use null for any field that isn't present or legible.",
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(vehicleRegistrationSchema) },
    });

    if (!response.parsed_output) {
      return { error: "Could not read this document." };
    }

    return { data: response.parsed_output };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Extraction failed.",
    };
  }
}

export async function extractInvoice(
  formData: FormData
): Promise<{ data?: ExtractedInvoice; error?: string }> {
  const file = getUploadedFile(formData);
  if ("error" in file) return file;

  try {
    const block = await fileToContentBlock(file);
    const client = createAnthropicClient();

    const response = await client.messages.parse({
      model: EXTRACTION_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            block,
            {
              type: "text",
              text: "This is an invoice or receipt for a fleet expense (fuel, tolls, fines, parking, registration fees, insurance, or other). Extract the vendor name, total amount, invoice date, the best-matching category, and a one-line description. Use null for any field that isn't present or legible.",
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(invoiceSchema) },
    });

    if (!response.parsed_output) {
      return { error: "Could not read this document." };
    }

    return { data: response.parsed_output };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Extraction failed.",
    };
  }
}
