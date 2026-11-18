import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { previewAtivo } from "@/lib/preview";
import { opcoesCookie } from "@/lib/supabase/opcoes";

export async function proxy(request: NextRequest) {
  const caminho = request.nextUrl.pathname;

  if (caminho.startsWith("/api/bots")) {
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
    return NextResponse.redirect(destino);
  }

  if (usuario && caminho === "/login") {
    return NextResponse.redirect(new URL("/hoje", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|robots.txt|.*\\.(?:png|svg|ico|webp)$).*)"],
};
