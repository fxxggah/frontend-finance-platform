# V2 / fase 4 — piloto de voz

Responsável: Gabriel. Integração autorizada no frontend e backend em 16/11/2026.
Este roteiro usa dados fictícios em desenvolvimento. Não publica produção nem altera faturamento.

## Preparar o ambiente

1. Use banco/catálogo de desenvolvimento com nomes fictícios. A IA recebe nomes de todas as categorias, contas e cartões ativos desse usuário; não use um catálogo com dados reais para este piloto.
2. No backend, mantenha perfil dev, FIN_AI_ENABLED=true, chave Gemini já configurada e FIN_FFPROBE_PATH absoluto. Iniciar o backend aplica migrations via Flyway. Conceda PRO de teste pelo SQL de ../fin-backend/docs/implementation-plan.md (fase 3). Não envie userId nem chave Google pelo navegador.
3. No frontend, em outro terminal PowerShell, sem editar arquivos de segredos:

~~~powershell
$env:NEXT_PUBLIC_VOICE_PILOT_ENABLED = 'true'
$env:NEXT_PUBLIC_USE_MOCK = 'false'
$env:NEXT_PUBLIC_API_URL = 'http://localhost:8080'
pnpm dev
~~~

Variáveis públicas exigem reiniciar/recompilar Next. A flag ausente/false esconde a entrada; USE_MOCK não aciona voz real. O backend permanece dev/opt-in e continua sendo a autorização efetiva, mesmo se o perfil do navegador estiver em cache.

## Testar o fluxo

1. Entre no Chrome do computador, abra /transactions/new e escolha Usar gravação.
2. Grave uma única transação fictícia, citando categoria/conta ou cartão que existam no catálogo de teste. Pare ou aguarde a parada automática em 29 s. Ouça a prévia: parar não envia o áudio.
3. Clique Preparar rascunho. Os bytes originais seguem com JWT do FIN e Idempotency-Key novo. Não há transcrição nem gravação automática da transação.
4. Confira valor total, data, tipo, categoria e origem. Confira também a descrição sugerida da fala. Sem data informada, backend usa hoje em São Paulo; sem indicação de parcelamento, usa 1, inclusive no cartão. Tipo/categoria são sugeridos pelo contexto. Campos explícitos válidos são preservados; valor ausente e origem ambígua continuam pendentes. Edite as sugestões se necessário.
5. Marque a revisão e confirme Registrar uma vez. Verifique a lista/fatura e o valor total da compra. Alterações posteriores nos campos desmarcam a revisão.
6. Repita com data ausente (hoje), cartão sem indicação de parcelas (1), data/parcelas explícitas (preservadas), valor ausente/origem ambígua (pendentes) e mais de uma transação (recusada). Exemplo fictício: fui na padaria e gastei 30 reais, paguei com o dinheiro da carteira → Despesa, 30,00, Compra na padaria, hoje, Alimentação e Carteira, se existirem no catálogo. Não exigir frase idêntica na descrição: o modelo pode usar resumo equivalente. Não assumir que uma taxa de acerto sintética garante precisão no piloto.
7. Verifique microfone negado, fechamento durante permissão/gravação/envio, PRO expirado, 409, 429 e indisponibilidade. O formulário manual permanece disponível e não há reenvio automático de IA. O único replay é a recuperação de sessão 401 já existente, com a mesma chave e Blob.
8. Em erro incerto da confirmação financeira, confira os lançamentos antes de confirmar novamente: o POST /transactions existente não tem replay/idempotência financeira. A proteção nova impede cliques concorrentes e criação automática, mas não promete deduplicar uma segunda confirmação intencional após resposta perdida.

Ao fechar, URLs temporárias, timers e microfone são liberados. Blob/rascunho não ficam em localStorage, URL ou Zustand; mutation de voz é resetada após consumo e tem gcTime=0. Cancelar no cliente não garante cancelar uma chamada já recebida pelo servidor; um sucesso finalizado antes da desconexão pode contar na cota pessoal.

## Safari no iPhone 13

Abra um ambiente de desenvolvimento HTTPS confiável e autorizado que alcance a API de desenvolvimento também via HTTPS. localhost do computador não é o localhost do iPhone; HTTP pelo IP não habilita microfone. URLs da API, origem CORS e login Google precisam corresponder a esse ambiente. Esta implementação não publicou túneis nem alterou configurações externas de OAuth.

Execute os mesmos passos no Safari, incluindo permissão do microfone, prévia, campos pendentes, revisão, confirmação e fechamento. Informe versão do iOS/Safari e resultado de cada etapa; não são obrigatórios relatórios JSON antigos. Não converter o áudio para esconder incompatibilidade. Se houver falha, registrar etapa e código ProblemDetail sem tokens/chaves/conteúdo financeiro real.

## QA automático e alcance

- pnpm test:api: inclui corpo binário/MIME/JWT/chave, replay 401 com mesma intenção, erros sem retry, Retry-After, validação do rascunho e flag desligada/mock.
- node --test scripts/money-input.test.cjs: regressão monetária.
- pnpm build: TypeScript e build de produção.
- Para QA com voz ligada, compile com NEXT_PUBLIC_VOICE_PILOT_ENABLED=true, NEXT_PUBLIC_USE_MOCK=false e NEXT_PUBLIC_API_URL=http://127.0.0.1:8099. Esse endereço de teste é interceptado, não deve ter backend real. Suba pnpm start --hostname 127.0.0.1 --port 3006.
- SMOKE_URL=http://127.0.0.1:3006 node scripts/voice-smoke.mjs: Chrome, microfone sintético e transporte controlado, 390/1440px; nenhuma chamada ao Google/backend real. Testa revisão, nulidade, clique duplo, PRO, erros, parada automática, liberação e cancelamento. Capturas vão ao diretório temporário informado ou VOICE_SCREENSHOT_DIR.
- SMOKE_URL=http://127.0.0.1:3006 SMOKE_API_URL=http://127.0.0.1:8099 node scripts/ui-smoke.mjs --transactions-only: regressão manual/parcelas e ?state=loading|empty|error. No Windows, definir essas variáveis com $env antes do comando.
- pnpm exec node scripts/generate-api-types.mjs --file ../fin-backend/build/phase4-openapi.json: geração offline do schema real exportado pelo teste do backend com -Dfin.exportOpenapi=true. Não fabrica contrato nem lê .env neste comando.

Chrome em viewport mobile é validação de responsividade, não prova de Safari ou de hardware iPhone. O transporte controlado não mede precisão/latência/cotas do Gemini real. A fase 4 só pode ser declarada completa quando os resultados do piloto real também estiverem registrados. Produção e dados reais não foram liberados por esta integração.

## Resultado automatizado — 16/11/2026

Build ligado para QA e build final desligado passaram. Serviços: 23 testes; moeda: 4. Chrome 390/1440 passou em captura/parada/prévia, envio explícito, PRO/BASIC, formato indisponível, erro de permissão, permissão tardia após fechar, parada automática, cancelamento, dados parciais/sem origem, revisão invalidada por edição, clique duplo, erros 403/409/422/429/503 e alternativa manual. A regressão manual passou em parcelas 1/2/3/24, entradas inválidas, erros 400/422/500/rede com foco e valores preservados, reenvio intencional e estados loading/empty/error. O modo --disabled-only do voice-smoke confirmou que a flag desligada esconde voz sem acessar o microfone nas duas larguras. Backend: 974 testes e compile aprovados.

As capturas revisadas no ambiente de trabalho mostram o formulário responsivo, valor em pt-BR, campos pendentes em branco e cartões do Design System. Não foram executadas extrações reais novas nem um piloto físico no Safari; a fase permanece em andamento para essa evidência manual.

## Ajuste de preenchimento — 16/11/2026

Contrato atualizado com description e defaults no backend, prompt voice-draft-v2. Atualizar/reiniciar backend e frontend antes de repetir o piloto. O resultado real do novo prompt ainda precisa ser conferido por Gabriel; testes controlados não comprovam sua precisão. Históricos anteriores de QA não medem esta alteração. A revisão obrigatória continua e cada edição desmarca a confirmação.

Verificação do ajuste: 23 testes de API e builds com piloto ligado para QA/desligado no build final aprovados. Chrome com transporte controlado passou em 390/1440 px: descrição/data aplicadas e confirmação do rascunho completo sem editar campos, revisão obrigatória, edição invalidando revisão, cartão com 1 parcela e manutenção de origem/tipo pendentes. Não houve chamada nova ao Google. Reiniciar os dois serviços e repetir a frase com o provedor real para validar a interpretação.

## Acesso temporário do Safari — proxy preparado em 16/11/2026

O helper scripts/safari-pilot-proxy.mjs é uma ferramenta local de desenvolvimento, não um endpoint ou serviço de produção. Escuta somente em 127.0.0.1:8766, com destino fixo ao frontend compilado em 127.0.0.1:3007 e backend em 127.0.0.1:8080. Um único HTTPS temporário pode atender navegador e API; o endereço precisa estar autorizado como origem JavaScript no cliente OAuth Google. Não criar outro client ID nem revelar segredos.

A abertura do túnel Cloudflare depende da autorização específica de Gabriel para encaminhar páginas, autenticação e áudio por esse terceiro. A preparação não iniciou um túnel. Após autorização: gerar a origem temporária; compilar com NEXT_PUBLIC_VOICE_PILOT_ENABLED=true, NEXT_PUBLIC_USE_MOCK=false e NEXT_PUBLIC_API_URL igual à origem HTTPS; iniciar pnpm start --hostname 127.0.0.1 --port 3007; definir FIN_SAFARI_ORIGIN com a mesma origem e executar node scripts/safari-pilot-proxy.mjs. O backend continua em dev com IA habilitada. Não editar .env nem trocar CORS globalmente. O endereço público é valor de configuração, não segredo. O cliente OAuth exige adição manual da origem no Google Cloud Console, preservando localhost.

O proxy aceita apenas páginas login/dashboard/transactions, assets compilados e rotas existentes necessárias. GET de perfil/catálogos/dashboard/metas/transações/faturas; POST somente auth, rascunho e confirmação da transação. Recusa criação de cadastros, atualização/exclusão de dados, Swagger, actuator, arquivos internos e source maps. Não dá acesso anônimo aos dados: JWT/PRO/cotas continuam no backend. Confirmação cria transação real no banco de desenvolvimento: manter conta e catálogo fictícios.

Host e Origin externos são comparados com a origem HTTPS exata antes de encaminhar; POST da sessão exige Origin. Headers forwarded externos são descartados, e a origem interna do Next é reconstruída de forma fixa. Isso preserva a verificação CSRF existente sem liberar origens arbitrárias. Cookies de sessão seguem apenas ao Next; Authorization/MIME/Idempotency-Key e bytes do áudio são preservados para a API. Nenhum corpo/token/cookie é logado. Corpo limitado a 2 MiB no áudio e 64 KiB nos demais; timeout de 65 s. Não transforma áudio.

Verificação: node --test scripts/safari-pilot-proxy.test.mjs, sete testes aprovados. Contra Next/API locais: login e assets 200; formulário privado sem sessão redireciona para login na origem pública configurada; sessão sem refresh token 400 (origem aceita); refresh sem cookie e perfil sem JWT 401; .env e Swagger 404. Nenhuma extração ou login real executado pelo agente. FIN_SAFARI_ORIGIN=https://fin-pilot.example.test foi somente um placeholder local para esses testes; não é endereço acessível pelo iPhone.

Encerrar o piloto: parar cloudflared, proxy e frontend auxiliar; remover a origem temporária das origens JavaScript do Google. Manter o frontend normal na porta 3000. Não parar processos do usuário. A URL temporária só será informada após criação e verificação HTTPS, e não deve ser tratada como autenticação. O acesso não constitui publicação de produção nem conclusão do teste no Safari.
### Acesso HTTPS autorizado e iniciado

Gabriel autorizou explicitamente o encaminhamento temporário pelo Cloudflare em 16/11/2026. O túnel foi iniciado somente após os testes do proxy. A origem atual fica em ../fin-backend/build/safari-pilot/origin.txt (arquivo operacional ignorado pelo Git); não usar o placeholder example.test. O frontend auxiliar foi compilado com voz ligada e API nessa origem, mantendo o frontend normal e os arquivos .env intactos.

Builds padrão/HTTPS e os sete testes do proxy passaram. Pelo HTTPS real: /login 200; 20 assets 200; /transactions/new sem sessão redireciona ao /login na mesma origem; /api/auth/session com corpo vazio 400; /api/auth/refresh sem cookie e /api/v1/users/me sem JWT 401; /.env e /v3/api-docs 404. Relatório sem credenciais em ../fin-backend/build/safari-pilot/https-check.json. Isso não testa OAuth autorizado nem microfone/Safari físicos.

Próxima ação manual: Google Cloud Console → Google Auth Platform → Clients (ou APIs e serviços → Credenciais) → cliente OAuth Web usado pelo FIN → Origens JavaScript autorizadas → adicionar a origem HTTPS temporária exata, sem /login ou barra final, preservando localhost. Não alterar chave do AI Studio, segredo do backend ou URIs de redirecionamento para este fluxo de callback JS. Documentação: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid . Depois abrir a origem no Safari, entrar com o usuário fictício PRO e repetir os testes do roteiro, incluindo prévia, revisão/edição, confirmação e cancelamento. Ao terminar, pedir encerramento dos três processos auxiliares e remover a origem temporária do OAuth.
## Encerramento — 16/11/2026

Gabriel confirmou que os testes no Safari passaram (“testei, tudo okay”), após confirmar o Chrome com o provedor real. Fase 4 encerrada com base no relato manual, sem inventar logs, versões de iOS, métricas ou uma execução automatizada no Safari. Na verificação final, as sessões de frontend auxiliar/proxy/túnel já estavam encerradas e não havia cloudflared/listeners 3007/8766; nenhum processo do usuário foi interrompido. A origem em origin.txt fica somente como histórico operacional e não deve ser reutilizada. Restaurar build para localhost:8080 e flag de voz false; .env fica preservado. Remover manualmente a origem temporária do cliente OAuth Google, mantendo localhost. Não houve publicação em produção nem início da fase de pagamentos.

Build de encerramento restaurado para API localhost:8080 e voz false, sem editar .env. A primeira execução exibiu SecurityFatalError do Next 16.4.3 após compilar; a repetição normal passou, sem desativar verificações ou trocar dependências. Registrar a atualização de segurança do Next como pendência separada antes de produção; os logs estão no backend em build/safari-pilot/build-after-pilot.log e build-after-pilot-retry.log. Isso não invalida o relato funcional do Safari nem representa correção da vulnerabilidade.