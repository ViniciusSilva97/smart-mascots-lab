# Smart Mascots Lab

Laboratório independente de movimentos dos mascotes da **Smart Eletro Vini**.

O projeto existe para experimentar, medir e aperfeiçoar movimentos antes de
integrá-los ao tema da loja Tray. A aparência atual do Byte é propositalmente
provisória: nesta fase, o foco é a qualidade da animação e da interação.

## Estado atual

**Protótipo 05 — Expressões e atenção**

- animações coordenadas com GSAP;
- estados de locomoção: `idle`, `preparing`, `walking` e `braking`;
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
git switch feature/attention-engine
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
| `npm run preview` | Visualiza localmente o build de produção |

## Controles do laboratório

| Entrada | Ação |
|---|---|
| Botões `1` a `5` | Escolhem um movimento |
| `←` e `→` | Caminham na direção escolhida |
| `Shift + ←` ou `Shift + →` | Correm |
| `↑` | Salta no lugar |
| `Shift + ↑` | Executa salto longo |
| Movimento do cursor | Direciona olhos, cabeça e antena |
| Botões de personalidade | Executam expressões |
| Clique em CPU, SSD ou GPU | Foca no detalhe escolhido |
| Clique no palco | Caminha até o destino |
| `Shift + clique` | Corre até o destino |
| `Espaço` | Pausa ou continua a timeline |

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

As branches anteriores são preservadas como marcos de comparação. Não faça
merge na `main` enquanto o laboratório ainda estiver em experimentação.

## Licença

Código publicado sob a [Licença MIT](LICENSE).
