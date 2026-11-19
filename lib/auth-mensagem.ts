export function mensagemAuth(mensagem: string, acao: "entrar" | "criar" = "entrar") {
  const texto = mensagem.toLowerCase();
  if (texto.includes("invalid login") || texto.includes("invalid credentials")) {
    return "E-mail ou senha não conferem.";
  }
  if (texto.includes("email not confirmed")) {
    return "Este e-mail ainda não foi confirmado.";
  }
  if (texto.includes("already registered") || texto.includes("already been registered") || texto.includes("user already")) {
    return "Já existe uma conta com este e-mail. Entre com a senha.";
  }
  if (texto.includes("password") && (texto.includes("at least") || texto.includes("short") || texto.includes("weak") || texto.includes("6"))) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (texto.includes("unable to validate email") || texto.includes("invalid email")) {
    return "Este e-mail não parece válido.";
  }
  if (texto.includes("signups not allowed") || texto.includes("signup is disabled")) {
    return "O cadastro está fechado neste momento.";
  }
  if (texto.includes("too many") || texto.includes("rate limit")) {
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  }
  if (texto.includes("fetch") || texto.includes("network") || texto.includes("failed")) {
    return "Não foi possível falar com o servidor.";
  }
  if (acao === "criar") return "Não foi possível criar a conta. Tente de novo.";
  return "Não foi possível entrar. Tente de novo.";
}
