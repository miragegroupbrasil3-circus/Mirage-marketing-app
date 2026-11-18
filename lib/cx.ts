export function cx(...partes: Array<string | false | null | undefined>) {
  return partes.filter(Boolean).join(" ");
}
