export function previewAtivo() {
  return process.env.NODE_ENV !== "production" && process.env.MIRAGE_PREVIEW === "1";
}
