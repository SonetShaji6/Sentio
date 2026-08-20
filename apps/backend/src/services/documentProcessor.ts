import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import pdfParse from "pdf-parse";
// @ts-ignore
import * as officeParser from "officeparser";

export interface ExtractionResult {
  extractedText: string;
  extractionStatus: "COMPLETED" | "UNSUPPORTED" | "FAILED";
  metadata?: {
    wordCount?: number;
    slideCount?: number;
    keywords?: string[];
  };
}

export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<ExtractionResult> {
  const extension = originalName.split(".").pop()?.toLowerCase() || "";

  try {
    // Plain Text or Markdown
    if (
      mimeType.startsWith("text/") ||
      extension === "txt" ||
      extension === "md"
    ) {
      const text = buffer.toString("utf-8");
      return {
        extractedText: text,
        extractionStatus: "COMPLETED",
        metadata: { wordCount: text.split(/\s+/).filter(Boolean).length },
      };
    }

    // PDF Extraction
    if (mimeType === "application/pdf" || extension === "pdf") {
      let text = "";
      let slideCount: number | undefined = undefined;

      const PDFClass =
        (pdfParse as any)?.PDFParse ||
        (typeof pdfParse === "object" && (pdfParse as any)?.default?.PDFParse);

      if (typeof PDFClass === "function") {
        const parser = new PDFClass({ data: buffer });
        try {
          const textRes = await parser.getText();
          text = textRes?.text || "";
          slideCount = textRes?.total || textRes?.pages?.length;
        } finally {
          if (typeof parser.destroy === "function") {
            await parser.destroy();
          }
        }
      } else {
        const pdfFn =
          typeof pdfParse === "function"
            ? pdfParse
            : (pdfParse as any)?.default || require("pdf-parse");

        if (typeof pdfFn === "function") {
          const pdfData = await pdfFn(buffer);
          text = pdfData.text || "";
          slideCount = pdfData.numpages;
        } else if (pdfFn && typeof pdfFn.PDFParse === "function") {
          const parser = new pdfFn.PDFParse({ data: buffer });
          try {
            const textRes = await parser.getText();
            text = textRes?.text || "";
            slideCount = textRes?.total || textRes?.pages?.length;
          } finally {
            if (typeof parser.destroy === "function") {
              await parser.destroy();
            }
          }
        } else {
          throw new Error(
            "Unable to locate a valid PDF parser from pdf-parse module.",
          );
        }
      }

      return {
        extractedText: text.trim(),
        extractionStatus: "COMPLETED",
        metadata: {
          wordCount: text.trim().split(/\s+/).filter(Boolean).length,
          slideCount,
        },
      };
    }

    // PowerPoint & Office Documents (PPTX, DOCX, XLSX)
    if (
      extension === "pptx" ||
      extension === "docx" ||
      extension === "xlsx" ||
      mimeType.includes("presentation") ||
      mimeType.includes("wordprocessing") ||
      mimeType.includes("spreadsheet")
    ) {
      const parserFn =
        (officeParser as any).parseOffice ||
        (officeParser as any).default?.parseOffice ||
        (officeParser as any).parseOfficeAsync;

      let rawText = "";
      if (typeof parserFn === "function") {
        const fileType =
          extension ||
          (mimeType.includes("presentation")
            ? "pptx"
            : mimeType.includes("wordprocessing")
              ? "docx"
              : "docx");

        const parsed = await parserFn(buffer, { fileType });
        if (typeof parsed === "string") {
          rawText = parsed;
        } else if (parsed && typeof parsed.to === "function") {
          const textRes = await parsed.to("text");
          rawText = textRes?.value || "";
        } else if (parsed && typeof parsed.toText === "function") {
          rawText = parsed.toText();
        } else if (parsed && typeof parsed.text === "string") {
          rawText = parsed.text;
        } else if (
          parsed &&
          typeof parsed.toString === "function" &&
          parsed.toString() !== "[object Object]"
        ) {
          rawText = parsed.toString();
        }
      }

      if (!rawText) {
        rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
      }

      const text = (
        typeof rawText === "string" ? rawText : String(rawText || "")
      ).trim();

      return {
        extractedText: text,
        extractionStatus: "COMPLETED",
        metadata: { wordCount: text.split(/\s+/).filter(Boolean).length },
      };
    }

    // Images & Visual Media (Gemini AI Vision Analysis)
    const isImage =
      mimeType.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "tiff"].includes(
        extension,
      );

    if (isImage) {
      const geminiApiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENAI_API_KEY;

      if (!geminiApiKey) {
        console.warn(
          "[DocumentProcessor] GEMINI_API_KEY not configured in environment. Skipping Gemini image analysis.",
        );
        return {
          extractedText: "",
          extractionStatus: "FAILED",
        };
      }

      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

        // Normalise MIME type
        let cleanMime = mimeType;
        if (!cleanMime || !cleanMime.startsWith("image/")) {
          if (extension === "png") cleanMime = "image/png";
          else if (extension === "webp") cleanMime = "image/webp";
          else if (extension === "gif") cleanMime = "image/gif";
          else cleanMime = "image/jpeg";
        }

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: buffer.toString("base64"),
                  },
                },
                {
                  text: `You are an AI document and presentation intelligence assistant. Analyze this uploaded image thoroughly for knowledge base extraction:
1. Transcribe all text, numbers, labels, code, formulas, or diagrams visible in the image verbatim and accurately.
2. Provide a structured, clear description of the image content, context, and key concepts.
3. Highlight key keywords and takeaways so this document can be easily indexed and retrieved via full-text search.`,
                },
              ],
            },
          ],
        });

        const extractedText = (response.text || "").trim();

        return {
          extractedText,
          extractionStatus: extractedText ? "COMPLETED" : "FAILED",
          metadata: {
            wordCount: extractedText.split(/\s+/).filter(Boolean).length,
            keywords: [
              "image-analysis",
              "gemini-vision",
              extension || "image",
              originalName.replace(/\.[^/.]+$/, ""),
            ],
          },
        };
      } catch (geminiError) {
        console.error(
          `[DocumentProcessor] Gemini Vision extraction error for ${originalName}:`,
          geminiError,
        );
        return {
          extractedText: "",
          extractionStatus: "FAILED",
        };
      }
    }

    return {
      extractedText: "",
      extractionStatus: "UNSUPPORTED",
    };
  } catch (error) {
    console.error(
      `[DocumentProcessor] Failed text extraction for ${originalName}:`,
      error,
    );
    return {
      extractedText: "",
      extractionStatus: "FAILED",
    };
  }
}
