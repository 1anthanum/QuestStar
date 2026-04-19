/**
 * fileExtractor.js — Extract text from uploaded files.
 * Supports: .txt, .md, .csv, .json, .pdf
 * PDF uses pdf.js loaded dynamically from CDN.
 */

// ── Supported extensions ──
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".pdf"];
export const ACCEPTED_MIME =
  ".txt,.md,.csv,.json,.pdf,text/plain,text/markdown,text/csv,application/json,application/pdf";

/**
 * Extract text content from a File object.
 * @param {File} file
 * @returns {Promise<{text: string, pages?: number, type: string}>}
 */
export async function extractText(file) {
  const name = file.name.toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));

  if ([".txt", ".md", ".csv", ".json"].includes(ext)) {
    return extractPlainText(file, ext);
  }
  if (ext === ".pdf") {
    return extractPdfText(file);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// ── Plain text / markdown / csv / json ──
function extractPlainText(file, ext) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result || "";
      resolve({ text, type: ext.replace(".", ""), pages: null });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file, "utf-8");
  });
}

// ── PDF via pdf.js CDN ──
let pdfjsLib = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  // Dynamically load pdf.js from CDN
  const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

  await new Promise((resolve, reject) => {
    if (document.getElementById("pdfjs-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "pdfjs-script";
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });

  // Wait for global to be available
  const lib = window.pdfjsLib;
  if (!lib) throw new Error("PDF.js not available");
  lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
  pdfjsLib = lib;
  return lib;
}

async function extractPdfText(file) {
  const lib = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  const pageTexts = [];
  // Limit to first 30 pages to avoid excessive processing
  const maxPages = Math.min(numPages, 30);

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    pageTexts.push(strings.join(" "));
  }

  const text = pageTexts.join("\n\n");

  return {
    text,
    type: "pdf",
    pages: numPages,
    truncated: numPages > maxPages,
  };
}

/**
 * Truncate text to a max character count for AI processing.
 * Keeps the beginning and end for context.
 */
export function truncateForAI(text, maxChars = 6000) {
  if (text.length <= maxChars) return text;
  const half = Math.floor(maxChars / 2);
  return (
    text.slice(0, half) +
    "\n\n[... content truncated ...]\n\n" +
    text.slice(-half)
  );
}

/**
 * Get a human-readable file size string.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
