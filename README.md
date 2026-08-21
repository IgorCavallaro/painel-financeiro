# Painel Financeiro 50/30/20

Sistema de controle financeiro pessoal/familiar baseado na regra 50/30/20
(Necessário / Desejado / Investimento), com login por e-mail/senha real
separando os dados de cada pessoa. Construído em HTML/CSS/JS puro, sem
framework e sem build step. Backend em Supabase (Postgres + Auth).

## Estado atual

Em produção, com dados reais. Autenticação via Supabase Auth (e-mail/senha),
isolamento de dados por Row Level Security (RLS) — cada pessoa só acessa
os próprios lançamentos; categorias são compartilhadas entre todos.

Além do painel completo (`index.html`), existe um app de lançamento
rápido instalável (`lancar.html`, PWA), e uma conexão opcional com o
Claude via MCP do Supabase para análise conversacional dos dados (ver
seção “Agente conectado” mais abaixo).

## Funcionalidades

**Dashboard:** mês de referência, renda do mês, total gasto, saldo
restante. Três baldes do 50/30/20 (Necessário/Desejado/Investimento)
mostrando o **comprometido** (já pago + despesas fixas pendentes desse
grupo no mês) vs o orçamento, com badge “No alvo”/“Atenção”/“Estourou”.
Card de “Previsão de gastos do mês” (despesas fixas + limites de
subcategoria somados — a projeção máxima, diferente do “comprometido”).
Card de “Limites de subcategoria” com alerta em 80% e ao estourar.
“Últimos lançamentos” com filtro por dia e categoria. Sugestões
automáticas baseadas em regras simples.

**Despesas Fixas:** cadastro de referência (nome, categoria/subcategoria,
valor esperado, vigência, dia de vencimento opcional) — **não conta
sozinho em nada**. O que entra no painel é a **baixa**, dada mês a mês
numa lista única, filtrada por mês de referência (com filtros de busca,
categoria, status de pagamento, tipo e encerramento, agrupados por
Necessário/Desejado/Investimento → subcategoria). Editar e excluir
disponíveis em cada item.

**Reservas:** fundo de emergência (meta sugerida automaticamente: 6x a
média de gastos do grupo Necessário) e metas de poupança livres (sinking
funds) para gastos futuros previsíveis — viagem, IPVA, presente de fim de
ano. Progresso calculado pela soma dos aportes registrados, sem afetar o
fluxo de caixa mensal do Dashboard.

**Patrimônio:** cadastro de ativos e dívidas, patrimônio líquido
calculado automaticamente. Snapshots manuais constroem uma linha do
tempo de evolução, independente do fluxo de caixa mensal.

**Análise de Custos:** fixo x variável (baseado em baixas dadas), ranking
de categorias, comparativo com o mês anterior (por subcategoria, com
variação percentual), evolução mensal (6 meses, receita x despesa).

**Configuração:** renda fixa mensal **com vigência** (início/fim — um
aumento salarial em agosto não é aplicado retroativamente aos meses
anteriores; editável). Categorias agrupadas por Necessário/Desejado/
Investimento, com limite mensal opcional por subcategoria (independente
de despesa fixa — ver “Modelo conceitual” abaixo).

**Histórico:** lançamentos variáveis (receitas, despesas pontuais, e
baixas de despesas fixas) com filtros, edição, exportação CSV, e
paginação (30 por vez, “carregar mais”).

**Lançamento rápido (`lancar.html`):** formulário mobile-first,
instalável como PWA (ícone próprio, tela cheia, sem precisar de loja de
apps). Nome da despesa obrigatório, categoria/subcategoria desacopladas
(escolher uma não filtra a outra), valor com máscara de R$ ao digitar.
Compartilha login e dados com o painel principal — precisa estar hospedado
na mesma pasta/domínio.

## Modelo conceitual: despesa fixa x limite x comprometido x previsão

Esses quatro conceitos são frequentemente confundidos — resumo direto:

| Conceito | O que é | Onde conta |
| --- | --- | --- |
| **Despesa fixa** | Obrigação recorrente cadastrada como referência | Só conta quando recebe **baixa** |
| **Baixa** | Confirmação de pagamento de uma despesa fixa num mês | Vira uma transação real (`despesa_fixa_id` preenchido) |
| **Limite mensal** | Teto autoimposto numa subcategoria — não é obrigação | Alerta em 80%/100%, mas não é “dívida certa” |
| **Comprometido** (baldes do Dashboard) | Pago + despesas fixas pendentes do mês | **Não inclui limites** |
| **Previsão de gastos do mês** | Despesas fixas (pagas ou não) + limites | **Inclui os dois** |

## Arquivos deste pacote

```
index.html                     → o painel completo
lancar.html                    → app de lançamento rápido (instalável)
manifest.json                  → configuração de PWA (compartilhado pelos dois)
service-worker.js              → exigido para o app ficar instalável
icon-192.png, icon-512.png     → ícone do app instalado
config.example.js              → template de configuração (credenciais do Supabase)
config.js                      → configuração real (não versionar com credenciais reais em repo público sem entender o risco — ver "Segurança")
supabase-schema.sql            → schema completo e idempotente (tabelas + RLS) — fonte da verdade do banco
migrar-vigencia-renda-fixa.sql → migração pontual (vigência em renda fixa) — já incorporada no schema completo
instrucoes-projeto-financeiro.md → instruções para o Projeto do Claude usado como agente (ver abaixo)
```

> Scripts de carga/migração pontuais usados durante a construção
(`carga-despesas-fixas.sql`, `backfill-baixas.sql`,
`migrar-projecoes-para-limite.sql`, `limpar-lancamentos-fantasma.sql`)
não precisam ser rodados de novo — ficam aqui só como histórico de como
os dados atuais chegaram ao estado em que estão. Não são idempotentes
da mesma forma que o `supabase-schema.sql`; rodar de novo pode duplicar
dados.
> 

## Como colocar em produção (do zero)

1. Crie um projeto no supabase.com (grátis).
2. **SQL Editor → New query**, cole o conteúdo de `supabase-schema.sql`
e rode. Cria as tabelas, RLS e categorias padrão.
3. **Project Settings → API**, copie **Project URL** e **anon public key**.
4. Copie `config.example.js` para `config.js` e preencha os dois valores.
5. Hospede `index.html`, `lancar.html`, `config.js`, `manifest.json`,
`service-worker.js` e os ícones juntos, na mesma pasta (ex: GitHub
Pages).
6. Abra o app, crie sua conta. Se “Confirm email” estiver ativo em
**Authentication → Sign In / Providers** no Supabase, você vai
precisar confirmar por e-mail antes do primeiro login — recomendamos
desativar essa opção para uso familiar (evita depender do limite de
envio de e-mail do plano grátis do Supabase, que é bem apertado).

## Modelo de dados (Supabase / Postgres)

```
profiles          → id (= auth.users.id), nome
categorias        → compartilhada (id, nome, grupo, ativo, limite_mensal)
rendas_fixas      → por usuário (id, user_id, nome, valor, ativo, data_inicio, data_fim)
despesas_fixas    → por usuário (id, user_id, nome, categoria, valor,
                     data_inicio, data_fim, dia_vencimento, ativo)
transacoes        → por usuário (id, user_id, data, tipo, categoria, valor,
                     obs, despesa_fixa_id) — despesa_fixa_id preenchido = é
                     uma baixa
reservas          → por usuário (id, user_id, nome, tipo['meta'|'emergencia'],
                     valor_meta, data_alvo, ativo)
aportes_reserva   → por usuário (id, reserva_id, user_id, valor, data, obs)
patrimonio_itens      → por usuário (id, user_id, nome, tipo['Ativo'|'Dívida'], valor)
patrimonio_snapshots  → por usuário (id, user_id, data, total_ativos, total_dividas)
```

Isolamento por `user_id` + política de RLS em cada tabela — escala para
qualquer número de usuários sem precisar criar nada novo manualmente.

## Segurança

- **Autenticação real:** Supabase Auth cuida de hashing de senha e
tokens de sessão — mesmos padrões de qualquer produto sério.
- **Isolamento por Row Level Security:** aplicado dentro do banco, não
confiando no código do frontend.
- **Chave pública (`anon key`) no `config.js`:** seguro estar exposta —
só permite o que as políticas de RLS autorizam. A `service_role key`
é diferente, nunca deve ir para o frontend, e não é usada neste app.
- **Cuidado com dados fantasmas após excluir/recriar despesas fixas:**
como `transacoes.despesa_fixa_id` usa `ON DELETE SET NULL`, excluir uma
despesa fixa que já tem baixas dadas **não apaga as transações** — elas
ficam “órfãs” (contando como gasto variável, mesmo sendo resquício de
uma despesa fixa antiga). Já aconteceu uma vez neste projeto (~R$16 mil
em lançamentos fantasmas, limpos via `limpar-lancamentos-fantasma.sql`).
Ao excluir uma despesa fixa com histórico, considerar revisar
`transacoes` com `despesa_fixa_id is null and obs like 'Baixa:%'`.

## Agente conectado (Claude + Supabase MCP)

O Supabase é conector oficial do Claude — dá para conversar com os dados
reais do painel diretamente no Claude.ai, sem precisar de código extra.

**Como está configurado hoje:**
- Conector do Supabase habilitado no Claude, em **modo somente leitura**.
- Um **Projeto do Claude** dedicado, com instruções fixas coladas em
`instrucoes-projeto-financeiro.md` — schema das tabelas, vocabulário do
app (despesa fixa x limite x comprometido x previsão), e a regra de
sempre filtrar por `user_id`.

**Limitação importante:** a conexão MCP normalmente **não respeita RLS**
— ela enxerga o projeto Supabase inteiro (dados de todos os usuários),
diferente do app, que isola por pessoa. Por isso as instruções do Projeto
fixam o `user_id` de referência e proíbem expor dados de outra pessoa.
Ações de escrita (`INSERT`/`UPDATE`/`DELETE`) não são feitas diretamente
pelo agente — ele gera um script `.sql` para revisão manual antes de
rodar, seguindo o mesmo padrão usado nas migrações deste projeto.

**Para usar:** abra o Projeto do Claude configurado com essas instruções
e pergunte livremente (ex: “quanto já foi baixado esse mês”, “quais
assinaturas eu tenho”, “ritmo de aporte necessário pra bater a meta da
reserva X”). Sempre que o schema mudar (nova tabela, novo campo, nova
regra de negócio), atualizar `instrucoes-projeto-financeiro.md` também —
não se atualiza sozinho junto com o código.

## Melhorias discutidas, ainda pendentes

- [ ]  Confirmação antes de excluir (evitar exclusão acidental)
- [ ]  Proteção ao excluir uma categoria/despesa fixa já usada em
lançamentos antigos (hoje isso pode “orfanizar” transações — ver
nota de segurança acima)
- [ ]  Backup/exportação completa dos dados (hoje o CSV só cobre o
histórico filtrado)
- [ ]  Notificações fora do app (e-mail/WhatsApp) — discutido, adiado
- [ ]  Indicador de ritmo de aporte nas Reservas (“precisa de R$X/mês pra
bater a meta”) — hoje calculável só perguntando ao agente, ainda
não é um card fixo

## Decisões técnicas

- **Sem framework, sem build step:** qualquer pessoa consegue abrir e
entender o código, hospedável em qualquer lugar.
- **Gráficos em SVG/CSS puro:** sem dependência de bibliotecas externas.
- **Supabase (Postgres + Auth) como backend:** gratuito na escala de uso
familiar, autenticação e banco reais desde o início, caminho pronto
para o agente via MCP oficial.
- **PWA em vez de app nativo:** `lancar.html` como ponto de entrada
instalado (ação mais frequente), `index.html` acessível de dentro dele
sem sair da experiência de app.
