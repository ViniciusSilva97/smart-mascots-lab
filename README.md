# Smart Mascots Lab

Laboratório independente de movimentos dos mascotes da **Smart Eletro Vini**.

O projeto existe para experimentar, medir e aperfeiçoar movimentos antes de
integrá-los ao tema da loja Tray. A aparência atual do Byte é propositalmente
provisória: nesta fase, o foco é a qualidade da animação e da interação.

## Estado atual

**Protótipo 09 — Robustez e testes de integração — etapa 2**

- testes reais no Chromium com Playwright;
- oito casos executados em perfis desktop e mobile;
- detecção automática de exceções JavaScript durante a inicialização;
- validação de telemetria, prioridade, interrupção e movimento reduzido;
- montagem e desmontagem explícitas do laboratório;
- destruição idempotente do motor, orquestrador e monitor de desempenho;
- remoção agrupada de listeners com `AbortController`;
- cancelamento de timelines, tweens e frames pendentes;
- teste de desmontagem e remontagem para detectar callbacks residuais;
- workflow GitHub Actions para executar o navegador em ambiente reproduzível;
- animações coordenadas com GSAP;
- medição real de FPS pelo `requestAnimationFrame`;
- detecção automática de meta de 60 ou 120 Hz;
- tempo médio, percentil 95 e quedas de frame na janela atual;
- classificação de qualidade: excelente, estável, atenção ou crítico;
- pausa automática do GSAP e da telemetria quando a aba fica oculta;
- retomada sem contar a pausa como uma queda de desempenho;
- seletor de movimento automático, completo ou reduzido;
- modo automático respeita `prefers-reduced-motion`;
- modo reduzido remove saltos, transporte e deslocamentos animados extensos;
- telemetria inteiramente local, sem backend ou envio de dados;
- 15 testes unitários aprovados;
- orquestrador independente para prioridade, fila e interrupção;
- painel em tempo real com ação ativa, decisão e comandos aguardando;
- interações e demonstração protegidas como sequências atômicas;
- saltos interrompem caminhadas;
- expressões aguardam ações de maior prioridade;
- comandos repetidos ainda na fila são substituídos pelo mais recente;
- fila limitada a quatro comandos;
- `Parar tudo` interrompe qualquer ação e limpa a fila;
- testes automatizados das regras de orquestração com Vitest;
- estados de locomoção: `idle`, `preparing`, `walking` e `braking`;
- estados de interação: aproximação, alinhamento, alcance, captura,
  transporte, apresentação e devolução;
- Byte caminha até CPU, SSD ou GPU, pega o objeto, carrega, apresenta e
  devolve ao pedestal;
- reação simpática quando o servidor está fora de alcance;
- interrupção segura: `Parar tudo` devolve imediatamente o objeto à origem;
- caminhada para esquerda e direita;
- corrida;
- salto parado e salto longo;
- fases de subida, ápice, queda, contato e recuperação;
- salto seguro durante outro movimento;
- acompanhamento do cursor com olhos, cabeça e antena;
- expressões simpática, curiosa, surpresa, confirmadora e focada;
- alvos de detalhe para testar atenção contextual;
- piscadas com intervalo variável;
- destino escolhido por clique;
- limites responsivos do palco;
- movimentos complementares: apontar, pensar e comemorar;
- controles de velocidade, escala, pausa, reinício e progresso.

## Executar no Windows

Pré-requisitos:

- Git;
- Node.js LTS;
- npm.

```powershell
git clone https://github.com/ViniciusSilva97/smart-mascots-lab.git
cd smart-mascots-lab
git switch feature/robustness-integration-tests
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente
`http://localhost:5173/`.

## Comandos

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Valida o TypeScript e gera o build |
| `npm test` | Executa os 15 testes unitários com Vitest |
| `npx playwright install chromium` | Instala o navegador usado nos testes |
| `npm run test:browser` | Gera o build e executa oito casos no Chromium |
| `npm run test:browser:headed` | Executa os testes mostrando o navegador |
| `npm run test:all` | Executa testes unitários e de navegador |
| `npm run preview` | Visualiza localmente o build de produção |

## Controles do laboratório

| Entrada | Ação |
|---|---|
| Botões `1` a `6` | Escolhem um movimento |
| `←` e `→` | Caminham na direção escolhida |
| `Shift + ←` ou `Shift + →` | Correm |
| `↑` | Salta no lugar |
| `Shift + ↑` | Executa salto longo |
| Movimento do cursor | Direciona olhos, cabeça e antena |
| Botões de personalidade | Executam expressões |
| Clique em CPU, SSD ou GPU | Busca, carrega, apresenta e devolve o objeto |
| Clique no servidor alto | Tenta alcançar e reage de forma simpática |
| Clique no palco | Caminha até o destino |
| `Shift + clique` | Corre até o destino |
| `Espaço` | Pausa ou continua a timeline |
| `Limpar fila` | Remove comandos aguardando sem parar a ação atual |
| `Parar tudo` | Interrompe a ação atual, limpa a fila e volta ao `idle` |
| Movimento `Automático` | Segue a preferência de acessibilidade do sistema |
| Movimento `Completo` | Mantém todas as animações do laboratório |
| Movimento `Reduzido` | Usa feedbacks curtos e evita grandes trajetórias |

## Documentação

- [Guia técnico e didático](docs/TECHNICAL_GUIDE.md)
- [Contexto e handoff para IA](AI_CONTEXT.md)

## Branches de protótipos

| Branch | Conteúdo |
|---|---|
| `main` | Fundação inicial do Vite |
| `feature/lab-foundation` | Protótipo 01: laboratório visual |
| `feature/gsap-motion-engine` | Protótipo 02: motor GSAP |
| `feature/locomotion-engine` | Protótipo 03: locomoção por destino |
| `docs/project-documentation` | Guia técnico e contexto para IA |
| `feature/jump-engine` | Protótipo 04: salto e aterrissagem |
| `feature/attention-engine` | Protótipo 05: expressões e atenção |
| `feature/object-interaction-engine` | Protótipo 06: interação com objetos |
| `feature/state-orchestrator` | Protótipo 07: prioridade, fila e interrupção |
| `feature/performance-accessibility` | Protótipo 08: telemetria e movimento reduzido |
| `feature/robustness-integration-tests` | Protótipo 09: testes reais desktop e mobile |

As branches anteriores são preservadas como marcos de comparação. Não faça
merge na `main` enquanto o laboratório ainda estiver em experimentação.

## Licença

Código publicado sob a [Licença MIT](LICENSE).
