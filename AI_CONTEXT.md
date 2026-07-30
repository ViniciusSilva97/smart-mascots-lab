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

**Protótipo 06 — Interação com objetos**

Branch canônica:

```text
feature/object-interaction-engine
```

Commit de implementação:

```text
6fb2e8fea9dd1662cd68d42872d84a099fb214ce
feat: add object interaction engine
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

Cada branch deriva da anterior. Não orientar o usuário a mesclar Protótipo 01
antes de testar o 02 ou 03.

## 4. Stack

- Vite 8;
- TypeScript 6;
- GSAP 3;
- HTML/CSS sem framework de interface;
- npm e `package-lock.json`.

Não adicionar React, Vue, Phaser, PixiJS ou Rive sem uma decisão explícita.

## 5. Arquivos relevantes

| Arquivo | Responsabilidade |
|---|---|
| `src/main.ts` | interface, eventos, controles e adaptação do palco |
| `src/motion-engine.ts` | timelines, estado e posição do Byte |
| `src/style.css` | identidade, layout, Byte provisório e responsividade |
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

`main.ts` mede o palco e chama `setBounds`. O motor limita destinos. Preserve
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
- redimensionamento da janela.

## 11. Validação obrigatória

Antes de publicar:

```powershell
npm install
npm run build
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

## 12. Problemas e limitações conhecidas

- `/favicon.ico` pode retornar 404; é inofensivo.
- `prefers-reduced-motion` ainda não controla integralmente timelines GSAP.
- não existem testes automatizados;
- FPS exibido é estático, não medido;
- o Byte definitivo e spritesheets ainda não existem neste projeto;
- o giro por `scaleX` também espelha detalhes internos do protótipo;
- corrida possui botão direto prioritariamente para a direita; teclado e
  clique permitem ambos os lados;
- a demo não possui uma fila de estados generalizada;
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

**Protótipo 07 — Máquina de estados, prioridade e fila**

Escopo recomendado:

- definir prioridade entre atenção, locomoção, salto, expressão e interação;
- criar fila opcional para comandos compatíveis;
- definir quais ações interrompem, aguardam ou são ignoradas;
- expor um estado de alto nível único para a interface;
- adicionar testes automatizados para transições e limpeza;
- iniciar medição real de FPS e tempo de frame.

Não iniciar a arte definitiva antes de validar esse ciclo.

## 15. Roadmap posterior

1. Protótipo 07: máquina de estados, prioridade e fila.
2. Testes automatizados e métricas reais.
3. Spritesheet oficial.
4. Avaliar PixiJS.
5. Integração experimental com cópia do tema Tray.

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
