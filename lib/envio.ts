import { criarClienteNavegador } from "@/lib/supabase/client";

export function enviarParaStorage(caminho: string, arquivo: File, token: string, aoProgredir: (porcentagem: number) => void) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const segmentos = caminho.split("/").map((parte) => encodeURIComponent(parte)).join("/");

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/midias/${segmentos}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", chave ?? "");
    xhr.setRequestHeader("Content-Type", arquivo.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        aoProgredir(Math.round((evento.loaded / evento.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        aoProgredir(100);
        resolve();
        return;
      }
      reject(new Error(xhr.status === 413 ? "grande" : "envio"));
    };
    xhr.onerror = () => reject(new Error("envio"));
    xhr.send(arquivo);
  });
}

export async function tokenDeEnvio() {
  const supabase = criarClienteNavegador();
  await supabase.auth.getUser();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function medidasDoArquivo(arquivo: File) {
  if (arquivo.type.startsWith("image/")) {
    const bitmap = await createImageBitmap(arquivo);
    const medidas = { largura: bitmap.width, altura: bitmap.height, duracao: null as number | null };
    bitmap.close();
    return medidas;
  }

  if (arquivo.type.startsWith("video/")) {
    return new Promise<{ largura: number | null; altura: number | null; duracao: number | null }>((resolve) => {
      const url = URL.createObjectURL(arquivo);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve({
          largura: video.videoWidth || null,
          altura: video.videoHeight || null,
          duracao: Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : null,
        });
        URL.revokeObjectURL(url);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ largura: null, altura: null, duracao: null });
      };
      video.src = url;
    });
  }

  return { largura: null, altura: null, duracao: null };
}
