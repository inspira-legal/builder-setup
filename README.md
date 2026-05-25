# builder-setup

> Seu primeiro passo na Inspira. Preparamos seu computador para você usar nossas ferramentas de IA, criar fluxos no LexFlow e colaborar com o time.

## ⚡ Início rápido

### Linux / macOS / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
```

> **O que esse comando faz?** Ele baixa um programa chamado `builder-setup`, que vai guiar você passo a passo. Não se preocupe — vou explicar cada parte antes de fazer qualquer coisa.

---

## 📋 O que você precisa antes de começar

Para trabalhar na Inspira, seu computador precisa de duas coisas:

1. **Uma conta no GitHub** (onde ficam os códigos e ferramentas internas)
2. **Essa conta dentro da organização Inspira** (um grupo fechado no GitHub)

> **Importante:** ter uma conta no GitHub **não é o suficiente**. Se você ainda não foi incluído(a) no grupo da Inspira, não vai conseguir acessar tudo — mesmo com tudo instalado.

**Se você ainda não tem tudo pronto:**
- Sem conta no GitHub? [Crie aqui](https://github.com/signup) (é de graça)
- Tem conta mas não está na Inspira? Fale com **HOLANDA** no Slack — ele inclui você na organização

**Se quiser começar mesmo assim:** você pode instalar as ferramentas agora e pedir acesso depois. O setup vai te lembrar no final.

---

## 🗺️ O que vai acontecer no seu computador

Quando você rodar o comando acima, vou guiar você por **3 momentos**:

### Momento 1 — Boas-vindas
Vou mostrar uma tela de boas-vindas e explicar que este é o **Passo 1** da sua Jornada Builder na Inspira.

### Momento 2 — Identidade (Passo 1.1)
Vou perguntar seu nome de usuário no GitHub (aquele com `@`, tipo `@maria-silva`).

- ✅ Se sua conta existe → seguimos
- ⏳ Se você ainda não está na org Inspira → vou avisar agora, não no final
- ❌ Se você não tem conta → você pode sair ou instalar as ferramentas primeiro

### Momento 3 — Ferramentas (Passo 1.2)
Vou verificar o que já está no seu computador e instalar só o que falta.

> **Nota:** Antigravity ainda requer instalação manual no macOS e Windows (o setup abre o navegador para você). No Linux, é instalado automaticamente via APT.

### O que instalamos para você (essencial)

| Ferramenta | Para que serve |
|-------------|----------------|
| Git | Baixa e envia os códigos dos projetos |
| GitHub CLI | Fala com o GitHub pelo terminal |
| fnm + Node.js | Roda ferramentas web internas |
| pnpm | Instala bibliotecas de código |
| uv + Python | Roda a LexFlow CLI e outras ferramentas internas |
| Claude Code | Assistente de código que conversa com você no terminal |
| Antigravity | Editor AI-first — porta de entrada pra trabalhar com agentes |

### LexFlow e Antigravity

**LexFlow** é a ferramenta interna da Inspira para criar fluxos de trabalho com IA (estilo n8n). Para usá-la, depois do setup rode:

```bash
uv tool install lexflow-cli
```

**Antigravity** é o editor recomendado pela Inspira para trabalhar com agentes de IA. Ele é o nosso padrão de entrada para quem está começando na Jornada Builder.

### Para o time de Plataforma (opcional)

Se você faz parte do time de **infraestrutura / DevOps / backend** e precisa de Docker + Google Cloud SDK, rode com a variável de ambiente:

**Linux / macOS / WSL:**
```bash
BUILDER_PROFILE=platform curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
$env:BUILDER_PROFILE='platform'; irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
```

Isso adiciona Docker e Google Cloud SDK ao final do setup. Sem essa variável, são pulados.

> **Você pode rodar o builder-setup quantas vezes quiser.** Se algo já está instalado, eu pulo automaticamente.

---

## 📊 Tabela de suporte por sistema

### Ferramentas essenciais (todo mundo)

| | Windows | macOS | Linux | WSL |
|--|---------|-------|-------|-----|
| Verificação de conta GitHub | ✅ | ✅ | ✅ | ✅ |
| Verificação de acesso à Inspira | ⏳/✅ | ⏳/✅ | ⏳/✅ | ⏳/✅ |
| System packages | ⬚ | ✅ | ✅ | ✅ |
| Linux dependencies | ⬚ | ⬚ | ✅ | ✅ |
| Git | ✅ | ✅ | ✅ | ✅ |
| GitHub CLI | ✅ | ✅ | ✅ | ✅ |
| fnm + Node.js | ✅ | ✅ | ✅ | ✅ |
| pnpm | ✅ | ✅ | ✅ | ✅ |
| uv + Python | ✅ | ✅ | ✅ | ✅ |
| Claude Code | ✅ | ✅ | ✅ | ✅ |
| Antigravity | 🌐 | 🌐 | ✅ | ✅ |
| Git config | ✅ | ✅ | ✅ | ✅ |
| fnm profile | ✅ | ✅ | ✅ | ✅ |
| fnm PowerShell | ✅ | ⬚ | ⬚ | ⬚ |
| fnm Git Bash | ✅ | ⬚ | ⬚ | ⬚ |
| fnm CMD | ✅ | ⬚ | ⬚ | ⬚ |
| WSL config | ⬚ | ⬚ | ⬚ | ✅ |

### Ferramentas de Plataforma (opt-in via `BUILDER_PROFILE=platform`)

| | Windows | macOS | Linux | WSL |
|--|---------|-------|-------|-----|
| Docker | ✅ | ✅ | ✅ | ✅ |
| Google Cloud SDK | ✅ | ✅ | ✅ | ✅ |

**Legenda:**
- ✅ = eu instalo/configuro para você
- 🌐 = abro o navegador para você baixar manualmente (instalação automatizada ainda não disponível)
- ⬚ = não se aplica neste sistema
- ⏳/✅ = depende se você já foi incluído(a) na organização Inspira

---

## 📖 Glossário

**GitHub**
> Site onde ficam todos os códigos dos projetos. É tipo um Google Drive, mas para programação. Cada projeto tem um endereço lá, como `github.com/inspira-legal/plataforma`.

**Organização (no GitHub)**
> Um grupo fechado no GitHub. A Inspira tem uma organização chamada `inspira-legal`. Só quem está dentro consegue ver os projetos privados. Ser membro não acontece automaticamente — fale com **HOLANDA** no Slack para ser incluído(a).

**Username / @ do GitHub**
> Seu nome de usuário no GitHub. Não é seu email. É o que aparece no link do seu perfil: se o link é `github.com/maria-silva`, seu username é `maria-silva`.

**Terminal**
> A tela preta onde você digita comandos. No Mac, abre o app "Terminal". No Windows, abre "PowerShell" ou "Git Bash". No Linux, geralmente `Ctrl+Alt+T`.

**Git**
> Programa que controla as versões do código. Com ele você pode baixar (`git clone`), enviar (`git push`) e voltar no tempo se algo der errado.

**LexFlow**
> Ferramenta interna da Inspira para criar fluxos de trabalho automatizados com IA. Você desenha fluxos em blocos (estilo n8n) e a IA executa as tarefas.

**Claude Code**
> Assistente de código que conversa com você no terminal. Pode escrever código, responder perguntas e ajudar em tarefas do dia a dia.

**Profile / .bashrc / .zshrc**
> Arquivos secretos do terminal que guardam configurações. O builder-setup os edita para que os programas instalados fiquem disponíveis quando você abre um terminal novo.

**WSL**
> Windows Subsystem for Linux. Um jeito de ter um Linux dentro do Windows. Se você usa WSL, o builder-setup configura tudo no Linux e aproveita programas do Windows.

**Time de Plataforma**
> Na Inspira, chamamos de "Plataforma" o time que cuida de infraestrutura, DevOps e backend. Se você faz parte desse time, o setup instala ferramentas extras como Docker e Google Cloud SDK.

---

## ❓ Perguntas que todo mundo faz

**"Vai apagar alguma coisa do meu computador?"**
Não. Eu só instalo programas novos. Nada é apagado.

**"Posso rodar de novo se der errado?"**
Pode, e quantas vezes quiser. Se algo já está instalado, eu pulo automaticamente.

**"E se eu não entender alguma pergunta?"**
Todas as perguntas têm explicação do que está acontecendo. Se ainda tiver dúvida, entre no canal **#support-help-aifirst** no Slack.

**"Terminei o setup, mas não consigo clonar o projeto. E agora?"**
Provavelmente você ainda não está na organização Inspira no GitHub. Fale com **HOLANDA** no Slack para ser incluído(a). Depois que ele confirmar, rode o builder-setup de novo — ele vai verificar automaticamente.

**"Como faço para começar do zero?"**
Apague a pasta de configuração:
```bash
rm -rf ~/.builder-setup
```
Da próxima vez que rodar, vou perguntar tudo de novo.

---

## 🚀 Em breve

- `gh auth login` — autenticação automática no GitHub
- `gcloud auth login` — autenticação automática na Google
- Setup de chave SSH do Git (para não precisar de senha ao baixar código)
- Setup interativo guiado por Claude (como ter um colega ao lado)
- Instalação automática do Antigravity (assim que disponível publicamente)

---

*Dúvidas? Entre no canal **#support-help-aifirst** no Slack da Inspira. Lá o time de suporte te ajuda com tudo que envolve ambiente de desenvolvimento.*
