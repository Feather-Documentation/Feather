import { marked } from 'marked';
import DOMPurify from 'dompurify';

const MAGIC_SIGNATURES = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpeg: [0xff, 0xd8, 0xff],
  gif: [0x47, 0x49, 0x46, 0x38]
};

function verifyMagicBytes(bytes: Uint8Array, signature: number[]): boolean {
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function isWebP(bytes: Uint8Array): boolean {
  const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return isRiff && isWebp;
}

export async function validateImageFile(file: File): Promise<boolean> {
  const MAX_SIZE = 2 * 1024 * 1024;
  
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds 2MB limit. Please compress your image!");
  }

  const nameLower = file.name.toLowerCase();
  const typeLower = file.type.toLowerCase();

  if (typeLower === 'image/svg+xml' || nameLower.endsWith('.svg')) {
    throw new Error("SVG uploads are disabled for security reasons.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target || !e.target.result) {
        return reject(new Error("Could not read file data."));
      }
      const bytes = new Uint8Array(e.target.result as ArrayBuffer);
      
      const isPng = verifyMagicBytes(bytes, MAGIC_SIGNATURES.png);
      const isJpeg = verifyMagicBytes(bytes, MAGIC_SIGNATURES.jpeg);
      const isGif = verifyMagicBytes(bytes, MAGIC_SIGNATURES.gif);
      const isWebpType = isWebP(bytes);

      if (isPng || isJpeg || isGif || isWebpType) {
        resolve(true);
      } else {
        reject(new Error("Invalid image format. Only PNG, JPEG, GIF, and WebP are allowed."));
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

export function renderMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown) as string;
  
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'code', 'pre', 'br', 'blockquote',
      'img', 'span', 'div', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'target', 'title', 'class', 'src', 'alt', 'id'],
    SANITIZE_DOM: true,
    KEEP_CONTENT: false
  });
}

export function getContrastColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
    g = parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
    b = parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}