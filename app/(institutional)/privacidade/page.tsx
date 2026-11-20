export const metadata = { title: "Política de privacidade — FIN" };

export default function PrivacyPage() {
  const contact = process.env.FIN_PRIVACY_CONTACT_EMAIL;
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Política de privacidade</h1>
      <h2 className="text-lg font-semibold">Dados da conta e lançamentos</h2>
      <p>O login com Google fornece ao FIN o identificador da conta, o nome, o e-mail e, quando disponível, a foto do perfil. O FIN armazena os dados financeiros que você cadastra para mostrar seus lançamentos, saldos, relatórios e metas.</p>
      <h2 className="text-lg font-semibold">Sessão e preferências</h2>
      <p>O navegador usa um cookie de sessão para manter o acesso. A preferência de tema e um identificador técnico de sessão entre abas são armazenados no navegador.</p>
      <h2 className="text-lg font-semibold">Hospedagem e métricas</h2>
      <p>O frontend é hospedado na Vercel e a API no Railway. Quando habilitado, o Vercel Web Analytics mede visitas e páginas acessadas sem usar cookies de analytics.</p>
      <h2 className="text-lg font-semibold">Exclusão e solicitações</h2>
      <p>Você pode solicitar a exclusão da conta em Configurações. Use o contato de privacidade para esclarecer dúvidas ou solicitar acesso, correção ou outras informações sobre seus dados pessoais.</p>
      {contact && <p>Contato de privacidade: <a className="underline" href={"mailto:" + contact}>{contact}</a>.</p>}
    </>
  );
}
