// PPTX 텍스트 추출 (zip + XML 파싱)
import JSZip from "jszip";

/**
 * PPTX 파일 버퍼에서 슬라이드 텍스트를 추출합니다.
 */
export async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );

  const textParts: string[] = [];

  for (const file of slideFiles.sort()) {
    const xml = await zip.files[file].async("string");
    // Extract <a:t> text nodes
    const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
    const slideText = matches
      .map((m) => m.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join(" ");
    if (slideText) textParts.push(slideText);
  }

  return textParts.join("\n");
}
