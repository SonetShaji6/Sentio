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
      // Handle pdf-parse export variability
      const pdfFn =
        typeof pdfParse === "function"
          ? pdfParse
          : (pdfParse as any).default || require("pdf-parse");
      const pdfData = await pdfFn(buffer);
      const text = pdfData.text || "";
      return {
        extractedText: text.trim(),
        extractionStatus: "COMPLETED",
        metadata: {
          wordCount: text.split(/\s+/).filter(Boolean).length,
          slideCount: pdfData.numpages,
        },
      };
    }

    // PowerPoint & Office Documents (PPTX, DOCX, XLSX)
    if (
      extension === "pptx" ||
      extension === "docx" ||
      mimeType.includes("presentation") ||
      mimeType.includes("wordprocessing")
    ) {
      const parserFn =
        (officeParser as any).parseOffice ||
        (officeParser as any).parseOfficeAsync;
      let text = "";
      if (typeof parserFn === "function") {
        text = await parserFn(buffer);
      } else {
        text = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
      }

      return {
        extractedText: text.trim(),
        extractionStatus: "COMPLETED",
        metadata: { wordCount: text.split(/\s+/).filter(Boolean).length },
      };
    }

    // Images & Other Media (OCR not configured)
    if (mimeType.startsWith("image/")) {
      return {
        extractedText: "",
        extractionStatus: "UNSUPPORTED",
      };
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
