// 파일 텍스트 추출 파서 유틸리티 (PRD v5 Feature 1 처리 파이프라인 4단계)
// PDF, DOCX, XLSX, PPTX, 이미지(Gemini 멀티모달) 지원

// pdf-parse는 ESM default export가 없으므로 require() 사용
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "text/plain"
  | "image/jpeg"
  | "image/png";

export interface ParseResult {
  text: string;
  mimeType: SupportedMimeType;
  isImage: boolean;
  imageBase64?: string;
}

/**
 * 파일 버퍼와 MIME 타입을 받아 텍스트 또는 이미지(base64)를 추출합니다.
 * 이미지의 경우 Gemini 멀티모달 입력을 위해 base64로 반환합니다.
 */
export async function extractContent(
  buffer: Buffer,
  mimeType: SupportedMimeType
): Promise<ParseResult> {
  switch (mimeType) {
    case "application/pdf": {
      const result = await pdfParse(buffer);
      return { text: result.text, mimeType, isImage: false };
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, mimeType, isImage: false };
    }

    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const texts = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        return XLSX.utils.sheet_to_txt(sheet);
      });
      return { text: texts.join("\n\n"), mimeType, isImage: false };
    }

    case "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
      // PPTX는 zip + XML 파싱으로 텍스트 추출
      const { extractPptxText } = await import("./pptx-parser");
      const text = await extractPptxText(buffer);
      return { text, mimeType, isImage: false };
    }

    case "text/plain": {
      return { text: buffer.toString("utf-8"), mimeType, isImage: false };
    }

    case "image/jpeg":
    case "image/png": {
      const imageBase64 = buffer.toString("base64");
      return {
        text: "",
        mimeType,
        isImage: true,
        imageBase64,
      };
    }

    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}
