export function mensagemAuth(mensagem: string) {
  const texto = mensagem.toLowerCase();
  if (texto.includes("invalid login") || texto.includes("invalid credentials")) {
    return "E-mail ou senha não conferem.";
  }
  if (texto.includes("email not confirmed")) {
    return "Este e-mail ainda não foi confirmado.";
  }
  if (texto.includes("too many") || texto.includes("rate limit")) {
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  }
  if (texto.includes("fetch") || texto.includes("network") || texto.includes("failed")) {
    return "Não foi possível falar com o servidor.";
  }
  return "Não foi possível entrar. Tente de novo.";
}
