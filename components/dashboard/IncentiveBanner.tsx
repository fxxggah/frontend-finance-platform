import Link from 'next/link';

export function IncentiveBanner() {
  return (
    <section className="relative mt-9 overflow-hidden rounded-3xl bg-gradient-hero p-6 text-white sm:p-8">
      <div className="relative z-10 max-w-md">
        <p className="text-2xl font-bold">Pequenos passos, grandes resultados</p>
        <p className="mt-2 text-sm text-white/75">
          Transforme seus planos em conquistas acompanhando cada avanço.
        </p>
        <Link
          href="/goals"
          className="mt-5 inline-block rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#3B1FA8] transition hover:bg-white/90"
        >
          Criar meta
        </Link>
      </div>
      {/* Elementos decorativos */}
      <div className="absolute -right-4 -top-10 size-40 rounded-full border-[22px] border-white/10" />
      <div className="absolute bottom-[-36px] right-20 size-28 rotate-12 rounded-3xl border-8 border-[#8D7BFF]/40" />
      <div className="absolute right-12 top-8 size-5 rounded-full bg-[#FFB84D]" />
    </section>
  );
}
