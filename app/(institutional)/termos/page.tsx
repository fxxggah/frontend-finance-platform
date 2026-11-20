import Link from "next/link";

export const metadata = { title: "Termos de uso — FIN" };

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Termos de uso</h1>
      <p>O FIN é uma ferramenta de organização financeira pessoal. As informações exibidas dependem dos dados que você cadastra e atualiza.</p>
      <h2 className="text-lg font-semibold">Sua conta</h2>
      <p>Use uma conta Google à qual você tem acesso. Registre apenas informações que você pode usar e mantenha o acesso à sua conta protegido.</p>
      <h2 className="text-lg font-semibold">Uso das informações</h2>
      <p>Relatórios e simulações servem para acompanhar suas finanças. Confira os valores e as condições reais antes de tomar decisões financeiras.</p>
      <h2 className="text-lg font-semibold">Encerramento</h2>
      <p>Para encerrar sua conta, abra Configurações e selecione Excluir minha conta. Saiba como os dados são utilizados na <Link className="underline" href="/privacidade">política de privacidade</Link>.</p>
    </>
  );
}
