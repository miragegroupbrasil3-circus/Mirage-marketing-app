import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { previewAtivo } from "@/lib/preview";
import { opcoesCookie } from "@/lib/supabase/opcoes";
import { normalizarStatus, type StatusPerfil } from "@/lib/tipos";

function redirecionar(request: NextRequest, response: NextResponse, destino: string | URL) {
  const url = typeof destino === "string" ? new URL(destino, request.url) : destino;
  const resposta = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    resposta.cookies.set(cookie);
  });
  const cache = response.headers.get("cache-control");
  if (cache) resposta.headers.set("cache-control", cache);
  return resposta;
}

export async function proxy(request: NextRequest) {
  const caminho = request.nextUrl.pathname;

  if (
    caminho.startsWith("/_next") ||
    caminho.startsWith("/api/bots") ||
    request.headers.get("upgrade") === "websocket"
  ) {
    return NextResponse.next();
  }

  if (previewAtivo()) {
    if (caminho === "/login" && !request.nextUrl.searchParams.has("ver")) {
      return NextResponse.redirect(new URL("/hoje", request.url));
    }
    const resposta = NextResponse.next({ request });
    resposta.headers.set("x-mirage-preview", "1");
    return resposta;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });

  if (!url || !chave) {
    if (caminho !== "/login" && caminho !== "/offline") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, chave, {
    cookieOptions: opcoesCookie(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([nome, valor]) => response.headers.set(nome, valor));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  const publico = caminho === "/login" || caminho === "/offline";

  if (!usuario && !publico) {
    const destino = new URL("/login", request.url);
    destino.searchParams.set("next", `${caminho}${request.nextUrl.search}`);
    return redirecionar(request, response, destino);
  }

  if (!usuario || caminho === "/offline") return response;

  let status: StatusPerfil = "pendente";
  try {
    const { data: perfil, error } = await supabase.from("perfis").select("status").eq("id", usuario.id).maybeSingle();
    if (!error && perfil) status = normalizarStatus(perfil.status);
  } catch {
    status = "pendente";
  }

  if (status === "aprovado") {
    if (caminho === "/login" || caminho === "/aguardando" || caminho === "/recusado") {
      return redirecionar(request, response, "/hoje");
    }
    return response;
  }

  if (status === "recusado") {
    if (caminho !== "/recusado") return redirecionar(request, response, "/recusado");
    return response;
  }

  if (caminho !== "/aguardando") return redirecionar(request, response, "/aguardando");
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icons/|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:png|svg|ico|webp)$).*)"],
};
