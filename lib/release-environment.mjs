const flags = [
  'NEXT_PUBLIC_USE_MOCK',
  'NEXT_PUBLIC_VOICE_PILOT_ENABLED',
  'NEXT_PUBLIC_BILLING_ENABLED',
];

export function validateReleaseEnvironment(env) {
  const release = env.FIN_RELEASE_BUILD === 'true' ||
    ['production', 'preview'].includes(env.VERCEL_ENV) ||
    (env.VERCEL === '1' && env.VERCEL_ENV !== 'development');
  if (!release) return;

  const errors = [];
  let url;
  try { url = new URL(env.NEXT_PUBLIC_API_URL); } catch { /* Reporta a configuração abaixo. */ }
  const nonPublicHost = (host) => !host.includes('.') || /(?:^|\.)(localhost|local|internal|test|invalid)\.?$/i.test(host) ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (!url || url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || nonPublicHost(url.hostname)) {
    errors.push('NEXT_PUBLIC_API_URL deve apontar para uma API HTTPS em um domínio público, sem credenciais.');
  }
  if (!/^[a-z0-9-]+\.apps\.googleusercontent\.com$/.test(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '')) {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID deve conter o Client ID web do Google.');
  }
  for (const flag of flags) {
    if (env[flag] !== 'false') errors.push(flag + ' deve ser false no lançamento da V1.');
  }
  if (env.VERCEL_ENV === 'production') {
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(env.FIN_PRIVACY_CONTACT_EMAIL ?? '')) {
      errors.push('FIN_PRIVACY_CONTACT_EMAIL deve conter o contato público aprovado.');
    }
    if (env.FIN_PUBLIC_COPY_APPROVED !== 'true') errors.push('FIN_PUBLIC_COPY_APPROVED deve ser true após aprovação dos textos.');
  }
  if (errors.length) throw new Error(['Configuração de lançamento do FIN inválida.', ...errors].join('\n'));
}
