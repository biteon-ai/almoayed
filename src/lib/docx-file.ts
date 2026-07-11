"use client";

export function isDocxFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    ext === "docx" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
