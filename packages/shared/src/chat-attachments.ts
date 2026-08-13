/** Chat file attachments for widget + Ask Humaner (client encode, server validate). */

export const CHAT_ATTACHMENT_MAX_COUNT = 4;
export const CHAT_ATTACHMENT_MAX_BYTES = 600_000;
export const CHAT_TEXT_ATTACHMENT_MAX_CHARS = 80_000;

export const CHAT_IMAGE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type ChatImageMediaType = (typeof CHAT_IMAGE_MEDIA_TYPES)[number];

export type ChatAttachmentPayload =
  | {
      kind: "image";
      name: string;
      mediaType: ChatImageMediaType;
      data: string;
    }
  | {
      kind: "document";
      name: string;
      mediaType: "application/pdf";
      data: string;
    }
  | {
      kind: "text";
      name: string;
      mediaType: string;
      text: string;
    };

const IMAGE_TYPE_SET = new Set<string>(CHAT_IMAGE_MEDIA_TYPES);
const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "html",
  "htm",
  "xml",
  "log",
  "yml",
  "yaml",
]);

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function inferChatAttachmentMediaType(file: {
  name: string;
  type: string;
}): string {
  const type = file.type.trim().toLowerCase();
  if (type === "image/jpg") {
    return "image/jpeg";
  }
  if (type && type !== "application/octet-stream") {
    return type;
  }
  const ext = fileExtension(file.name);
  if (ext === "md" || ext === "markdown") return "text/markdown";
  if (ext === "txt") return "text/plain";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "csv") return "text/csv";
  if (ext === "json") return "application/json";
  return type || "application/octet-stream";
}

export function formatChatAttachmentNote(fileNames: string[]): string {
  if (fileNames.length === 0) {
    return "";
  }
  return `Attached: ${fileNames.join(", ")}`;
}

export function formatChatUserDisplay(
  text: string,
  fileNames: string[],
): string {
  return [text.trim(), formatChatAttachmentNote(fileNames)]
    .filter(Boolean)
    .join("\n\n");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function skippedPayload(name: string, reason: string): ChatAttachmentPayload {
  return {
    kind: "text",
    name,
    mediaType: "text/plain",
    text: `[Could not include "${name}": ${reason}]`,
  };
}

async function encodeOneFile(file: File): Promise<ChatAttachmentPayload> {
  const name = file.name.trim() || "attachment";
  if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
    return skippedPayload(
      name,
      `file is larger than ${Math.round(CHAT_ATTACHMENT_MAX_BYTES / 1024)}KB`,
    );
  }

  const mediaType = inferChatAttachmentMediaType(file);
  const ext = fileExtension(name);

  if (IMAGE_TYPE_SET.has(mediaType)) {
    try {
      const data = await fileToBase64(file);
      return {
        kind: "image",
        name,
        mediaType: mediaType as ChatImageMediaType,
        data,
      };
    } catch {
      return skippedPayload(name, "image could not be read");
    }
  }

  if (mediaType === "application/pdf" || ext === "pdf") {
    try {
      const data = await fileToBase64(file);
      return {
        kind: "document",
        name,
        mediaType: "application/pdf",
        data,
      };
    } catch {
      return skippedPayload(name, "PDF could not be read");
    }
  }

  if (
    mediaType.startsWith("text/") ||
    TEXT_EXTENSIONS.has(ext) ||
    mediaType === "application/json"
  ) {
    try {
      const raw = await file.text();
      const text = raw.slice(0, CHAT_TEXT_ATTACHMENT_MAX_CHARS);
      if (!text.trim()) {
        return skippedPayload(name, "file was empty");
      }
      return {
        kind: "text",
        name,
        mediaType: mediaType.startsWith("text/") ? mediaType : "text/plain",
        text,
      };
    } catch {
      return skippedPayload(name, "text could not be read");
    }
  }

  return skippedPayload(
    name,
    "unsupported type — send an image, PDF, Markdown, or text file",
  );
}

export async function encodeChatAttachments(
  files: File[],
): Promise<ChatAttachmentPayload[]> {
  const limited = files.slice(0, CHAT_ATTACHMENT_MAX_COUNT);
  return Promise.all(limited.map(encodeOneFile));
}
