import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { RAG_CONFIG } from "@/constants";

// Use dynamic import for pdf-parse (CommonJS module)
type PdfParseFunc = (buffer: Buffer, options?: object) => Promise<{ text: string; numpages: number; info: Record<string, string> }>;
let pdfParseModule: PdfParseFunc | null = null;

async function getPdfParse(): Promise<PdfParseFunc> {
  if (!pdfParseModule) {
    const mod = (await import("pdf-parse")) as any;
    // pdf-parse exports as CommonJS, handle both default and named export
    pdfParseModule = (typeof mod === "function" ? mod : mod.default ?? Object.values(mod)[0]) as PdfParseFunc;
  }
  return pdfParseModule;
}

export interface PDFParseResult {
  text: string;
  pages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    language?: string;
  };
}

export interface TextChunk {
  content: string;
  metadata: {
    page: number;
    chunk: number;
    source: string;
    pdfName: string;
    totalChunks: number;
  };
}

// =============================================================================
// PDF TEXT EXTRACTION
// =============================================================================

export async function extractTextFromPDF(
  buffer: Buffer,
  fileName: string
): Promise<PDFParseResult> {
  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      pages: data.numpages,
      metadata: {
        title: data.info?.Title ?? fileName,
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        language: data.info?.Language,
      },
    };
  } catch (error) {
    console.error("[PDF Service] Parse error:", error);
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

// =============================================================================
// TEXT CHUNKING
// =============================================================================

export async function chunkText(
  text: string,
  source: string,
  pdfName: string
): Promise<TextChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: RAG_CONFIG.chunkSize,
    chunkOverlap: RAG_CONFIG.chunkOverlap,
    separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
  });

  const rawChunks = await splitter.splitText(text);

  return rawChunks.map((content, index) => ({
    content: content.trim(),
    metadata: {
      page: estimatePageNumber(text, content),
      chunk: index,
      source,
      pdfName,
      totalChunks: rawChunks.length,
    },
  }));
}

// Estimate page number based on text position (form feed characters = page breaks)
function estimatePageNumber(fullText: string, chunk: string): number {
  const snippet = chunk.substring(0, 50);
  const position = fullText.indexOf(snippet);
  if (position === -1) return 1;
  const textBefore = fullText.substring(0, position);
  const pageBreaks = (textBefore.match(/\f/g) ?? []).length;
  return pageBreaks + 1;
}

// =============================================================================
// FETCH PDF FROM URL
// =============================================================================

export async function fetchPDFBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
