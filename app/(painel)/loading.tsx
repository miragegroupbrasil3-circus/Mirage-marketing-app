export default function Carregando() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <p className="sr-only">Carregando</p>
      <div className="esqueleto h-14 w-56" />
      <div className="esqueleto h-4 w-40" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }, (_, indice) => (
          <div key={indice} className="esqueleto h-16" />
        ))}
      </div>
    </div>
  );
}
