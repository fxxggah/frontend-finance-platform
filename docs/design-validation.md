# Validação do design global

Implementação local da linguagem visual aprovada no Início, em 11/11/2026.

## Cobertura

- 15 rotas/variações autenticadas: Início, Contas, Transações, aba de Transferências, Transferências, Cartões, detalhe do cartão, fatura, Metas, detalhe da meta, Relatórios, Categorias, Configurações e os dois simuladores.
- 150 combinações de layout: 320, 390, 768, 1024 e 1440px nos temas claro e escuro, sem overflow horizontal na página nem erros no console.
- Estados `loading`, `empty` e `error` nas 14 rotas de dados sem variação de aba, incluindo suporte adicionado em Configurações, simuladores e detalhe da meta.
- Formulários de cartão, meta, categoria, pagamento, contribuição e transferência abertos em 320 e 1440px, sem overflow interno e sem blur no overlay. O formulário independente de transação também foi aberto nas duas larguras. Após migrar dialogs/sheets para portal, a rodada de formulários foi repetida e confirmou que o overlay cobre a navegação inferior.
- Foco inicial contido no modal, Tab/Shift+Tab e Escape com retorno ao acionador; erro 400 no campo de nome de conta via ProblemDetail de teste.
- Ocultação do saldo e persistência do tema após navegar/recarregar.
- Blur normal de 12px no desktop, desativado nos atalhos abaixo de 640px e mantido na BottomNav. Com transparência reduzida, ambos ficam sem blur; movimento reduzido também foi verificado. Abas de Categorias navegáveis por setas.
- Login nos temas claro e escuro e página 404 conferidos. O script de QA cobre o login nas cinco larguras na execução completa.

## Comandos

- `pnpm build`: compilação e TypeScript aprovados. Permanece o aviso preexistente de depreciação de `middleware` do Next.js.
- `pnpm test:api`: oito testes aprovados; nenhuma alteração em serviços, tipos gerados, contratos ou dependências.
- `node scripts/design-smoke.cjs`: roteiro de navegador sem bibliotecas adicionais. Requer app local e Chrome isolado com CDP na porta 9334; usa exclusivamente as fixtures existentes e intercepta chamadas de API.
- `QA_PREFERENCES_ONLY=true` permite repetir apenas as verificações de movimento/transparência reduzidos e abas por teclado.

Capturas de referência, capturas finais e relatórios JSON ficam em `%TEMP%/fin-design-review`, fora do repositório. Os testes não executam mutações no backend real. Pagamento, arquivamento e contribuições mantêm seus contratos e regras existentes; o QA visual verifica a abertura dos formulários, não a persistência de operações financeiras reais.

## Performance e limites da medição

Não foram adicionadas dependências, providers ou eventos de ponteiro para efeitos. Superfícies extensas são sólidas; reflexos são estáticos; overlays de tela inteira perderam o blur. A dashboard passou de 700 para 704 elementos no DOM na amostra com as mesmas fixtures.

As capturas foram feitas no navegador desktop headless com emulação de largura. A transferência observada de JavaScript no preview é afetada pelo cache e pelo modo de desenvolvimento, portanto não serve como comparação controlada de bundle ou LCP antes/depois. Não foi realizado benchmark de FPS em aparelho físico. O build de produção, a ausência de dependências novas e a limitação dos filtros são verificações estruturais, não uma garantia numérica de performance.
