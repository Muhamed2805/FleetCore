"use server";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { createAnthropicClient, EXTRACTION_MODEL } from "@/lib/anthropic";
import {
  isScannableImageType,
  MAX_SCAN_FILE_MB,
  scanFileProblem,
} from "@/lib/document-scan";
import { expiringCategories, type ExpiringCategory } from "@/lib/documents";
import { getCurrentProfile } from "@/lib/supabase/queries";

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
      "repair",
      "other",
    ])
    .nullable(),
  description: z.string().nullable(),
});

export type ExtractedInvoice = z.infer<typeof invoiceSchema>;

const vehicleDocumentSchema = z.object({
  license_plate: z.string().nullable(),
  expiry_date: z
    .string()
    .nullable()
    .describe("Last day the document is valid, in ISO format YYYY-MM-DD"),
});

export type ExtractedVehicleDocument = z.infer<typeof vehicleDocumentSchema>;

const vehicleDocumentKinds: Record<ExpiringCategory, string> = {
  registration: "a vehicle registration document",
  insurance: "a vehicle insurance policy or insurance certificate",
  inspection: "a vehicle technical inspection certificate",
};

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

  // getUploadedFile has already rejected anything else.
  if (!isScannableImageType(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: file.type,
      data,
    },
  };
}

async function getUploadedFile(
  formData: FormData
): Promise<File | { error: string }> {
  const t = await getTranslations("common.documentScan");

  // Server actions can be called by anyone who can reach the app, and every
  // scan spends API credits, so only signed-in members may scan.
  if (!(await getCurrentProfile())) {
    return { error: t("notSignedIn") };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: t("notConfigured") };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t("chooseFileFirst") };
  }
  const problem = scanFileProblem(file);
  if (problem) {
    return { error: t(problem, { max: MAX_SCAN_FILE_MB }) };
  }
  return file;
}

export async function extractVehicleRegistration(
  formData: FormData
): Promise<{ data?: ExtractedVehicleRegistration; error?: string }> {
  const file = await getUploadedFile(formData);
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
      const t = await getTranslations("common.documentScan");
      return { error: t("couldNotRead") };
    }

    return { data: response.parsed_output };
  } catch (error) {
    const t = await getTranslations("common.documentScan");
    return {
      error: error instanceof Error ? error.message : t("genericError"),
    };
  }
}

export async function extractInvoice(
  formData: FormData
): Promise<{ data?: ExtractedInvoice; error?: string }> {
  const file = await getUploadedFile(formData);
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
              text: "This is an invoice or receipt for a fleet expense (fuel, tolls, fines, parking, registration fees, insurance, repairs, or other). Extract the vendor name, total amount, invoice date, the best-matching category, and a one-line description. Use null for any field that isn't present or legible.",
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(invoiceSchema) },
    });

    if (!response.parsed_output) {
      const t = await getTranslations("common.documentScan");
      return { error: t("couldNotRead") };
    }

    return { data: response.parsed_output };
  } catch (error) {
    const t = await getTranslations("common.documentScan");
    return {
      error: error instanceof Error ? error.message : t("genericError"),
    };
  }
}

export async function extractVehicleDocument(
  formData: FormData
): Promise<{ data?: ExtractedVehicleDocument; error?: string }> {
  const category = z.enum(expiringCategories).safeParse(formData.get("category"));
  if (!category.success) {
    const t = await getTranslations("common.documentScan");
    return { error: t("genericError") };
  }

  const file = await getUploadedFile(formData);
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
              text: `This is ${vehicleDocumentKinds[category.data]}. Extract the license plate of the vehicle it covers and the date it expires (the last day it is valid). Use null for any field that isn't present or legible.`,
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(vehicleDocumentSchema) },
    });

    if (!response.parsed_output) {
      const t = await getTranslations("common.documentScan");
      return { error: t("couldNotRead") };
    }

    return { data: response.parsed_output };
  } catch (error) {
    const t = await getTranslations("common.documentScan");
    return {
      error: error instanceof Error ? error.message : t("genericError"),
    };
  }
}
