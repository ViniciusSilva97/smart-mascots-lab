# Contexto operacional para IA — Smart Mascots Lab

> Este arquivo é a referência de continuidade para agentes de IA e
> desenvolvedores. Leia-o antes de propor ou implementar mudanças.

## 1. Identidade do projeto

- **Repositório:** `ViniciusSilva97/smart-mascots-lab`
- **Marca:** Smart Eletro Vini
- **Finalidade:** laboratório separado para experimentar movimentos de
  mascotes antes da integração com o tema Tray.
- **Personagem atual:** Byte, personagem principal e especialista em
  computadores.
- **Estética:** retro-tech, pixel art, preto, amarelo e verde.
- **Prioridade atual:** qualidade do movimento; não aperfeiçoar a aparência.
- **Idioma de interface e documentação:** português do Brasil.

## 2. Mascotes já definidos no ecossistema

| Mascote | Papel |
|---|---|
| Byte | Personagem principal e especialista em computadores |
| Chip | Kits de upgrade |
| Pixel | Guia do curso gratuito |
| Tool | Plataforma de aluguel |
| Link | Ofertas e Mercado Livre; personagem original da loja |

O laboratório atual implementa somente o Byte. Não introduzir os demais até
o motor principal estar validado.

## 3. Estado canônico

### 3.1 Protótipo atual

**Protótipo 10 — Ponte de renderização 2D/3D — etapa 2**

Branch canônica:

```text
feature/byte-3d
```

Commit de implementação:

```text
70a6b56cd3179dbc26e8fcf8792c696c2d54591b
feat: mount mascot lab through lifecycle entry
```

### 3.2 Histórico

| Marco | Branch | Commit principal |
|---|---|---|
| Vite inicial | `main` | `0ad3049` |
| Protótipo 01 | `feature/lab-foundation` | `ffdc418` |
| Protótipo 02 | `feature/gsap-motion-engine` | `5b411d2` |
| Correção GSAP | `feature/gsap-motion-engine` | `b72d251` |
| Protótipo 03 | `feature/locomotion-engine` | `3cb0875` |
| Documentação | `docs/project-documentation` | `9af8344` |
| Protótipo 04 | `feature/jump-engine` | `e13a7d1` |
| Protótipo 05 | `feature/attention-engine` | `efa16b2` |
| Protótipo 06 | `feature/object-interaction-engine` | `6fb2e8f` |
| Protótipo 07 | `feature/state-orchestrator` | `4bfd05f` |
| Protótipo 08 | `feature/performance-accessibility` | `f4d387b` |
| Protótipo 09 — etapa 1 | `feature/robustness-integration-tests` | `1f817b2` |
| Protótipo 09 — etapa 2 | `feature/robustness-integration-tests` | `70a6b56` |

Cada branch deriva da anterior. Não orientar o usuário a mesclar Protótipo 01
antes de testar o 02 ou 03.

## 4. Stack

- Vite 8;
- TypeScript 6;
- GSAP 3;
- Vitest 4;
- Playwright 1.62;
- GitHub Actions;
- HTML/CSS sem framework de interface;
- npm e `package-lock.json`.

Não adicionar React, Vue, Phaser, PixiJS ou Rive sem uma decisão explícita.

## 5. Arquivos relevantes

| Arquivo | Responsabilidade |
|---|---|
| `src/main.ts` | entrada, montagem única e integração com HMR |
| `src/lab-app.ts` | interface, eventos, controles, palco e ciclo de vida |
| `src/motion-engine.ts` | timelines, estado e posição do Byte |
| `src/performance-monitor.ts` | métricas de frame e classificação |
| `src/performance-monitor.test.ts` | testes de 60/120 Hz e quedas |
| `src/state-orchestrator.ts` | prioridade, fila e política de interrupção |
| `src/state-orchestrator.test.ts` | testes unitários da orquestração |
| `tests/browser/lab.spec.ts` | integração real desktop e mobile |
| `playwright.config.ts` | projetos Chromium e servidor Vite de teste |
| `.github/workflows/browser-tests.yml` | automação unitária e de navegador |
| `src/style.css` | identidade, layout, Byte provisório e responsividade |
| `src/byte-3d-view.ts` | Three.js, carregamento GLB, renderização e descarte do Byte 3D |
| `public/models/byte-proxy.glb` | modelo modular de validação; ainda não é a arte definitiva |
| `scripts/generate-byte-proxy.mjs` | geração reproduzível do GLB de validação |
| `index.html` | shell de entrada |
| `docs/TECHNICAL_GUIDE.md` | explicação humana completa |
| `AI_CONTEXT.md` | continuidade para IA |

## 6. Contratos arquiteturais

### 6.1 Motor separado da interface

`ByteMotionEngine` não deve conhecer textos, painéis ou estrutura completa da
página. Ele comunica mudanças por callbacks.

### 6.2 Posição persistente

`positionX` dentro do motor é a fonte de verdade. Gestos executados depois de
uma caminhada devem preservar o destino.

### 6.3 Uma timeline ativa

Ao iniciar uma ação:

1. matar a timeline anterior;
2. limpar tweens e pose;
3. criar a nova timeline;
4. configurar;
5. reproduzir.

Não inverter os passos 2 e 3.

### 6.4 Limites responsivos

`lab-app.ts` mede o palco e chama `setBounds`. O motor limita destinos. Preserve
essa dupla proteção ao alterar o layout.

### 6.5 Aparência provisória

O Byte atual é CSS pixel art. Não investir em refinamento visual neste ciclo.
O objetivo é descobrir movimentos e estados que serão reaproveitados na arte
definitiva.

### 6.6 Objetos sempre recuperáveis

`activeObject` guarda somente o produto que está sendo manipulado. Antes de
qualquer troca de timeline, `resetActiveObject` cancela seus tweens, remove a
transformação e limpa `data-held`.

Não remova essa restauração. Ela garante que salto, caminhada, expressão ou
uma segunda interação possam interromper o transporte sem deixar o produto
flutuando ou preso ao Byte.

### 6.7 Orquestrador puro

`CommandOrchestrator` não deve importar GSAP nem acessar o DOM. Ele decide
quando executar callbacks recebidos em `MascotCommand`.

Política canônica:

- reset (`100`) sempre interrompe e limpa;
- interação e demo (`40`) são atômicas;
- salto (`30`) interrompe locomoção;
- locomoção (`20`) interrompe gesto ou expressão;
- gesto e expressão (`10`) aguardam ações mais importantes;
- fila máxima de quatro itens;
- comandos pendentes da mesma categoria são substituídos pelo mais recente;
- prioridade maior sai primeiro; empates preservam a ordem de chegada.

Não voltar a chamar métodos de movimento diretamente nos eventos de
`lab-app.ts`. Novas ações corporais devem passar pelo orquestrador.

### 6.8 Pausas por motivo

O motor usa `pauseReasons` em vez de um único booleano. Os motivos atuais são
`user` e `visibility`. Uma timeline só retoma quando o conjunto fica vazio.

Essa regra impede que uma animação pausada manualmente volte a rodar apenas
porque o usuário retornou à aba.

### 6.9 Telemetria local

`FramePerformanceMonitor` não deve depender do motor nem enviar dados. Ele
mede `requestAnimationFrame`, ignora intervalos acima de 250 ms, conserva até
120 amostras e emite a cada 500 ms.

A meta é 120 FPS quando a mediana indica pelo menos 90 Hz; nos demais casos,
60 FPS. Quedas são intervalos acima de 1,5 vez o orçamento do frame.

### 6.10 Ciclo de vida explícito

`createMascotLab(app)` cria uma instância isolada e retorna `destroy()`.
`main.ts` mantém no máximo uma instância ativa por meio de `mountLab()` e
`destroyLab()`.

Toda desmontagem deve:

1. abortar o `AbortController` compartilhado pelos listeners;
2. cancelar frames pendentes da interface;
3. chamar `destroy()` no monitor, orquestrador e motor;
4. matar timelines e tweens, restaurando o produto ativo;
5. limpar estilos locais e o contêiner.

Todas as operações `destroy()` são idempotentes. Depois da destruição, uma
tentativa de iniciar novo trabalho lança erro explícito. Isso é intencional:
o Playwright deve detectar imediatamente qualquer listener ou callback
residual.

### 6.11 Ponte de renderização 2D/3D

O modo 2D continua sendo o padrão e o fallback seguro. `Byte3DView` é uma
camada visual: recebe movimento e expressão pelos mesmos callbacks do motor,
carrega `/models/byte-proxy.glb` e renderiza apenas quando o modo 3D está ativo.

O `byte-wrap` permanece como âncora de posição, escala e locomoção. Assim, o
Three.js não duplica as regras de limites do palco. Ao desmontar o laboratório,
o renderer, geometrias, materiais e frame de animação precisam ser liberados.

O proxy 3D valida carregamento, desempenho e integração. Ele não substitui o
modelo definitivo aprovado no conceito visual.

Na etapa 2, `ByteMotionEngine` também publica olhar, direção e velocidade.
`Byte3DView` recebe locomoção, salto e interação para animar os pivôs nomeados
do GLB. Os olhos usam `ByteEyeLeft` e `ByteEyeRight`; membros usam os grupos
`ByteArmLeft`, `ByteArmRight`, `ByteLegLeft` e `ByteLegRight`. Preserve esses
nomes no modelo definitivo ou forneça um adaptador explícito.

A orientação 3D segue a ação: durante preparação, caminhada, frenagem,
aproximação, alcance e transporte, o modelo gira aproximadamente 90 graus na
direção do percurso. Em `presenting` e no repouso, retorna suavemente para a
câmera. Distâncias longas até produtos usam corrida; o transporte de volta
permanece controlado.

## 7. Erro histórico que não pode voltar

No primeiro envio do Protótipo 02, `replaceTimeline` recebia uma timeline já
criada e depois chamava `resetPose`.

`resetPose` executava `gsap.killTweensOf`, eliminando também os tweens novos.
O build passava, a página carregava, mas o Byte não se movia.

Correção aplicada no commit:

```text
b72d251 fix: preserve newly created GSAP timelines
```

Solução atual:

```typescript
replaceTimeline(() => this.createMotion(motion))
```

A função fábrica só cria a nova timeline depois da limpeza.

### 7.1 Métodos nativos devem preservar o contexto

No Protótipo 08, o monitor armazenava `requestAnimationFrame` diretamente e
o chamava como propriedade de outra instância. O Chrome exige `window` como
receptor e lançou:

```text
TypeError: Illegal invocation
```

Como a falha acontecia antes do registro dos listeners, nenhum comando da
interface respondia. A correção usa wrappers que chamam
`window.requestAnimationFrame` e `window.cancelAnimationFrame`.

O teste unitário simula um método que rejeita o receptor incorreto. O
Playwright registra `pageerror` antes da navegação para proteger a
inicialização completa contra novas exceções desse tipo.

## 8. Estados atuais

### Movimento de alto nível

```typescript
type Motion = 'idle' | 'walk' | 'jump' | 'point' | 'think' | 'celebrate'
```

### Locomoção

```typescript
type LocomotionState =
  | 'idle'
  | 'preparing'
  | 'walking'
  | 'braking'
```

Fluxo:

```text
idle → preparing → walking → braking → idle
```

### Salto

```typescript
type JumpState =
  | 'grounded'
  | 'anticipating'
  | 'ascending'
  | 'apex'
  | 'falling'
  | 'landing'
  | 'recovering'
```

### Expressões e atenção

```typescript
type Expression =
  | 'friendly'
  | 'curious'
  | 'surprised'
  | 'confirming'
  | 'focused'

type AttentionState = 'relaxed' | 'tracking' | Expression
```

### Interação

```typescript
type InteractionState =
  | 'idle'
  | 'approaching'
  | 'aligning'
  | 'reaching'
  | 'grabbing'
  | 'carrying'
  | 'presenting'
  | 'releasing'
  | 'out-of-reach'
```

Fluxo principal:

```text
approaching → aligning → reaching → grabbing → carrying
→ presenting → releasing → idle
```

### Orquestração

```typescript
type CommandKind =
  | 'reset'
  | 'gesture'
  | 'expression'
  | 'locomotion'
  | 'jump'
  | 'interaction'
  | 'demo'
```

Decisões observáveis:

```text
started | interrupted | queued | replaced-in-queue
| queue-full | reset | completed
```

## 9. API pública atual do motor

| Método | Uso |
|---|---|
| `play(motion)` | Executa um gesto ou redireciona `walk` |
| `walk(direction, running)` | Caminha uma distância padrão |
| `walkTo(targetX, running)` | Caminha até um destino |
| `jump(longJump)` | Executa salto parado ou salto longo |
| `lookAt(x, y)` | Orienta olhos, cabeça e antena |
| `releaseAttention()` | Retorna a atenção ao centro |
| `setTracking(enabled)` | Ativa ou desativa rastreamento |
| `express(expression, direction)` | Executa reação emocional |
| `interact(element, targetX)` | Busca, pega, apresenta e devolve um objeto |
| `inspectOutOfReach(direction)` | Executa tentativa simpática sem captura |
| `playDemo()` | Executa sequência demonstrativa |
| `togglePause()` | Pausa ou continua |
| `restart()` | Reinicia a timeline |
| `setProgress(progress)` | Posiciona a timeline |
| `setSpeed(speed)` | Ajusta `timeScale` |
| `setBounds(maxPosition)` | Define limites do palco |
| `setPageVisible(visible)` | Adiciona ou remove pausa por visibilidade |
| `setReducedMotion(enabled)` | Troca timeline completa por feedback reduzido |
| `destroy()` | Mata timelines/tweens e libera recursos do motor |

### 9.1 API do orquestrador

| Método | Uso |
|---|---|
| `dispatch(command)` | Decide e inicia, interrompe ou enfileira |
| `completeActive()` | Finaliza a ação atual e drena a fila |
| `clearQueue()` | Remove itens pendentes |
| `getSnapshot()` | Expõe ação ativa, fila e última decisão |
| `destroy()` | Descarta ação, fila e observador; aceita repetição |

O motor chama `onActionComplete` ao terminar caminhada, salto, expressão,
interação ou demo. `lab-app.ts` encaminha o sinal para `completeActive`.

### 9.2 API do monitor

| Recurso | Uso |
|---|---|
| `start()` | Inicia amostragem com `requestAnimationFrame` |
| `stop()` | Cancela amostragem |
| `reset()` | Descarta janela e timestamp anteriores |
| `detectTargetFps()` | Classifica meta em 60 ou 120 Hz |
| `calculateFrameMetrics()` | Calcula FPS, média, P95, quedas e qualidade |
| `destroy()` | Cancela o frame futuro e descarta as amostras |

## 10. Entradas implementadas

- botões de movimentos;
- botões de caminhada;
- clique e `Shift + clique`;
- setas e `Shift + setas`;
- seta para cima e `Shift + seta para cima`;
- cursor para rastreamento de atenção;
- botões de personalidade;
- objetos CPU, SSD e GPU;
- servidor alto fora de alcance;
- espaço para pausa;
- controle de progresso;
- velocidade e escala;
- painel de ação ativa, decisão e fila;
- botões `Limpar fila` e `Parar tudo`;
- seletor automático, completo e reduzido;
- telemetria de FPS, meta, frame médio, P95 e quedas;
- indicador de aba ativa ou pausada;
- redimensionamento da janela.

## 11. Validação obrigatória

Antes de publicar:

```powershell
npm install
npm run build
npm test
npx playwright install chromium
npm run test:browser
git diff --check
```

Teste manual:

1. idle visível;
2. caminhada bilateral;
3. corrida;
4. destino por clique;
5. pausa durante deslocamento;
6. interrupção por novo comando;
7. gesto depois da caminhada;
8. redimensionamento;
9. mobile;
10. retorno ao estado `idle`.
11. salto parado;
12. salto longo;
13. interrupção da caminhada por salto sem retorno de posição.
14. rastreamento suave do cursor;
15. cinco expressões;
16. bloqueio do rastreamento durante ações;
17. foco nos três alvos de detalhe.
18. sequência completa nos objetos CPU, SSD e GPU;
19. sincronização entre objeto e Byte durante transporte;
20. devolução do produto após conclusão;
21. devolução do produto ao interromper com outro comando;
22. reação ao servidor fora de alcance.
23. salto interrompe caminhada;
24. expressão aguarda caminhada;
25. interação protege a sequência e enfileira novos comandos;
26. maior prioridade sai primeiro;
27. comando repetido pendente é substituído;
28. limpar fila preserva ação ativa;
29. parar tudo limpa ação e fila.
30. meta de 60/120 Hz detectada;
31. métricas atualizam a cada 500 ms;
32. aba oculta pausa motor e monitor;
33. pausa manual sobrevive à troca de aba;
34. modo automático segue `prefers-reduced-motion`;
35. modo reduzido elimina grandes trajetórias.

## 12. Problemas e limitações conhecidas

- `/favicon.ico` pode retornar 404; é inofensivo.
- Playwright cobre inicialização, comandos e remontagem, mas ainda não sessões
  longas, múltiplas instâncias simultâneas nem consumo de memória;
- monitor identifica 60/120 Hz, não todas as frequências possíveis;
- quedas exibidas pertencem à janela móvel, não ao total da sessão;
- o Byte definitivo e spritesheets ainda não existem neste projeto;
- o giro por `scaleX` também espelha detalhes internos do protótipo;
- corrida possui botão direto prioritariamente para a direita; teclado e
  clique permitem ambos os lados;
- demo é atômica e compartilha a fila geral de comandos;
- salto e caminhada ainda não possuem física; são timelines determinísticas;
- CPU, SSD, GPU e servidor são objetos CSS provisórios, não produtos reais;
- expressões ainda usam a face CSS simplificada;
- a mão não possui sistema de encaixe ou cinemática inversa; o alinhamento é
  calibrado para o Byte provisório;
- os objetos não possuem física nem colisão; seguem timelines determinísticas;
- assets remanescentes do template Vite ainda podem ser limpos;
- a integração Tray não foi iniciada.

## 13. Decisões de produto

- preservar branches anteriores;
- não fazer merge na `main` até aprovação do laboratório;
- evitar dependências desnecessárias;
- manter a experiência leve para futura integração;
- respeitar `prefers-reduced-motion`;
- personagens e assets devem ser originais e sem licença duvidosa;
- não depender de mascotes oficiais de marketplaces.

## 14. Próximo passo recomendado

**Protótipo 09 — Robustez, etapa 3**

Escopo recomendado:

- montar mais de uma instância do Byte ao mesmo tempo;
- medir custo incremental por instância;
- investigar vazamento de tweens, listeners e memória;
- preparar relatório comparativo desktop e mobile.

Não iniciar a arte definitiva antes de validar esse ciclo.

## 15. Roadmap posterior

1. Protótipo 09, etapa 3: múltiplas instâncias, sessões longas e memória.
2. Spritesheet oficial.
3. Avaliar PixiJS.
4. Integração experimental com cópia do tema Tray.

## 16. Regras para futuras IAs

1. Ler `README.md`, este arquivo e `docs/TECHNICAL_GUIDE.md`.
2. Inspecionar a branch e o código real; não confiar apenas no histórico.
3. Diagnosticar antes de alterar.
4. Preservar decisões e mudanças não relacionadas do usuário.
5. Trabalhar em branch derivada do protótipo mais recente.
6. Não atualizar a `main` sem autorização explícita.
7. Implementar um objetivo de movimento por protótipo.
8. Executar build antes do envio.
9. Atualizar documentação quando arquitetura, estado ou roadmap mudarem.
10. Registrar erros importantes e suas causas.
11. Não afirmar que a animação funciona apenas porque o build passou.
12. Solicitar teste visual do usuário em Windows e mobile.

## 17. Template de atualização deste arquivo

Quando um protótipo for concluído, atualizar:

- protótipo e branch canônicos;
- commit principal;
- novos tipos e estados;
- API pública;
- controles;
- invariantes;
- limitações;
- testes realizados;
- próximo passo.

Adicionar uma entrada:

```text
Data:
Protótipo:
Branch:
Commit:
Objetivo:
Mudanças:
Validação:
Limitações:
Próximo passo:
```

## 18. Registro de continuidade

### 2026-07-28 — Protótipo 03

- **Branch:** `feature/locomotion-engine`
- **Commit:** `3cb087525f466a8ed103e5019bed925954c3da66`
- **Objetivo:** criar locomoção natural baseada em destino.
- **Mudanças:** direção, corrida, clique, aceleração, frenagem, persistência e
  limites responsivos.
- **Validação:** TypeScript e build Vite aprovados; usuário aprovou
  visualmente o resultado.
- **Limitação:** movimento ainda usa personagem CSS provisório.
- **Próximo passo:** documentar o projeto e depois evoluir para salto.

### 2026-07-29 — Protótipo 04

- **Branch:** `feature/jump-engine`
- **Commit:** `e13a7d1296ac1ed4904e397aebb1517185743775`.
- **Objetivo:** criar salto parado, salto longo e aterrissagem convincente.
- **Mudanças:** sete estados verticais, arco horizontal, controles de teclado
  e sincronização da posição renderizada antes de interrupções.
- **Validação:** TypeScript e build Vite aprovados.
- **Limitação:** movimento determinístico, sem física real.
- **Próximo passo:** expressões, olhar, cabeça e antena.

### 2026-07-29 — Protótipo 05

- **Branch:** `feature/attention-engine`
- **Commit:** `efa16b244701e3ac228b4ae1daa0e899fb97a4c3`.
- **Objetivo:** tornar o Byte simpático, atento e responsivo aos detalhes.
- **Mudanças:** rastreamento do cursor, piscadas variáveis, cinco expressões,
  bloqueio durante ações e alvos contextuais CPU, SSD e GPU.
- **Validação:** TypeScript e build Vite aprovados.
- **Limitação:** rosto e alvos ainda são provisórios.
- **Próximo passo:** interação física simulada com objetos.

### 2026-07-29 — Protótipo 06

- **Branch:** `feature/object-interaction-engine`
- **Commit:** `6fb2e8fea9dd1662cd68d42872d84a099fb214ce`.
- **Objetivo:** permitir que o Byte interaja fisicamente com itens do palco.
- **Mudanças:** aproximação, alinhamento, alcance, captura, transporte,
  apresentação, devolução, restauração após interrupção e reação ao servidor
  fora de alcance.
- **Validação:** TypeScript, build Vite e `git diff --check` aprovados.
- **Limitação:** braço e objeto usam alinhamento determinístico calibrado para
  o protótipo CSS; ainda não existe cinemática inversa nem física.
- **Próximo passo:** definir prioridade, fila e regras formais de interrupção.

### 2026-07-29 — Protótipo 07

- **Branch:** `feature/state-orchestrator`
- **Commit:** `4bfd05f9552a9196ecbb49f14ed8e61123e35090`.
- **Objetivo:** centralizar prioridade, fila e política de interrupção.
- **Mudanças:** orquestrador puro, sete categorias de comando, ações atômicas,
  fila limitada e ordenada, substituição de pendências repetidas, painel de
  diagnóstico, limpeza, parada total e testes Vitest.
- **Validação:** TypeScript, build Vite, `git diff --check` e sete testes
  automatizados aprovados.
- **Limitação:** testes ainda não renderizam DOM nem executam timelines GSAP
  em navegador real.
- **Próximo passo:** medir desempenho e integrar movimento reduzido ao motor.

### 2026-07-30 — Protótipo 08

- **Branch:** `feature/performance-accessibility`
- **Commit:** `f4d387bf53602310d09e9eec5997d541f4d019ed`.
- **Objetivo:** medir fluidez real e respeitar preferências de movimento.
- **Mudanças:** monitor `requestAnimationFrame`, FPS, frame médio, P95,
  quedas, meta de 60/120 Hz, qualidade, pausa por visibilidade, conjunto de
  motivos de pausa e modos automático, completo e reduzido.
- **Validação:** TypeScript, build Vite, `git diff --check` e 12 testes
  automatizados aprovados.
- **Limitação:** falta validação visual em navegador real, aparelhos móveis e
  múltiplas instâncias.
- **Próximo passo:** testes DOM/GSAP, ciclo de destruição e sessões longas.

### 2026-07-30 — Protótipo 09, etapa 1

- **Branch:** `feature/robustness-integration-tests`
- **Commit remoto da etapa:** `1f817b27bbe902004dd795fd8efd2cd3fddcb187`.
- **Objetivo:** detectar em navegador real falhas de inicialização e de
  integração que TypeScript e testes unitários não observam.
- **Mudanças:** Playwright, projetos desktop e mobile, seis casos de
  navegador, captura de `pageerror`, scripts npm e workflow GitHub Actions.
- **Validação:** 13 testes unitários, build Vite, descoberta dos seis casos
  Playwright e execução no Chromium pelo GitHub Actions.
- **Limitação:** ainda não cobre criação e destruição do motor, múltiplas
  instâncias, sessões longas nem medição de memória.
- **Próximo passo:** introduzir ciclo de vida explícito e provar que listeners,
  timelines e monitores são liberados.

### 2026-07-30 — Protótipo 09, etapa 2

- **Branch:** `feature/robustness-integration-tests`.
- **Commit remoto de implementação:** `70a6b56cd3179dbc26e8fcf8792c696c2d54591b`.
- **Objetivo:** permitir desmontar e remontar o laboratório sem trabalho
  residual.
- **Mudanças:** fábrica `createMascotLab`, entrada com montagem única,
  desmontagem idempotente, listeners agrupados por `AbortController`,
  cancelamento de frames, timelines e tweens, destruição do monitor e do
  orquestrador e novo cenário Playwright de remontagem.
- **Validação:** 15 testes unitários, TypeScript, build Vite e
  `git diff --check` aprovados localmente. O GitHub Actions aprovou os oito
  casos Playwright no Chromium, em desktop e mobile, incluindo desmontagem e
  remontagem sem erros residuais.
- **Limitação:** ainda não há múltiplas instâncias simultâneas, sessão longa
  nem aferição de memória.
- **Próximo passo:** criar um cenário multi-Byte e medir custo e estabilidade
  em sessões prolongadas.
