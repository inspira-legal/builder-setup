# builder-setup

> Seu primeiro passo na Inspira. Vou preparar seu computador para você começar a trabalhar.

## ⚡ Início rápido

### Linux / macOS / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/inspira-legal/builder-setup/main/install.ps1 | iex
```

> **O que faz esse comando?** Ele baixa um programa chamado `builder-setup`, que vai guiar você passo a passo. Não se preocupe — vou explicar cada parte antes de fazer qualquer coisa.

---

## 📋 O que você precisa antes de começar

Para trabalhar nos projetos da Inspira, seu computador precisa de duas coisas:

1. **Uma conta no GitHub** (o site onde ficam os códigos)
2. **Essa conta dentro da organização Inspira** (tipo um grupo fechado no GitHub)

> **Importante:** ter uma conta no GitHub **não é o suficiente**. Se você ainda não foi incluído(a) no grupo da Inspira, não vai conseguir ver os projetos — mesmo com tudo instalado.

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

| Ferramenta | Para que serve |
|-------------|----------------|
| Git | Baixa e envia os códigos dos projetos |
| Docker | Roda programas em caixinhas isoladas |
| GitHub CLI | Fala com o GitHub pelo terminal |
| Node.js | Roda a parte dos sites (frontend) |
| Bun | Rápido, para instalar bibliotecas de código |
| pnpm | Outro jeito de instalar bibliotecas |
| uv | Para projetos de Python |
| Python | Roda a parte inteligente dos sistemas (backend) |
| Google Cloud SDK | Conecta aos serviços da Google que usamos |
| VS Code | Onde você vai escrever código |
| Claude Code | Assistente de código (como eu!) |

> **Você pode rodar o builder-setup quantas vezes quiser.** Se algo já está instalado, eu pulo automaticamente.

---

## 📊 Tabela de suporte por sistema

| | Windows | macOS | Linux | WSL |
|--|---------|-------|-------|-----|
| Verificação de conta GitHub | ✅ | ✅ | ✅ | ✅ |
| Verificação de acesso à Inspira | ⏳/✅ | ⏳/✅ | ⏳/✅ | ⏳/✅ |
| System packages | ⬚ | ✅ | ✅ | ✅ |
| Linux dependencies | ⬚ | ⬚ | ✅ | ✅ |
| Git | ✅ | ✅ | ✅ | ✅ |
| Docker | ✅ | ✅ | ✅ | ✅ |
| GitHub CLI | ✅ | ✅ | ✅ | ✅ |
| fnm | ✅ | ✅ | ✅ | ✅ |
| Node.js | ✅ | ✅ | ✅ | ✅ |
| Bun | ✅ | ✅ | ✅ | ✅ |
| pnpm | ✅ | ✅ | ✅ | ✅ |
| uv | ✅ | ✅ | ✅ | ✅ |
| pyenv | ⬚ | ✅ | ✅ | ✅ |
| Python | ✅ | ✅ | ✅ | ✅ |
| Google Cloud SDK | ✅ | ✅ | ✅ | ✅ |
| VS Code | ✅ | ✅ | ✅ | ⬚ |
| Claude Code | ✅ | ✅ | ✅ | ✅ |
| Git config | ✅ | ✅ | ✅ | ✅ |
| fnm profile | ✅ | ✅ | ✅ | ✅ |
| pyenv profile | ⬚ | ✅ | ✅ | ✅ |
| WSL config (editor, browser) | ⬚ | ⬚ | ⬚ | ✅ |

**Legenda:**
- ✅ = eu instalo/configuro para você
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

**Docker**
> Programa que roda outros programas em "caixinhas" isoladas. Ajuda a todo mundo ter o mesmo ambiente, evitando "no meu computador funciona".

**VS Code**
> O programa onde você vai escrever e ler código. É tipo um Word, mas feito para programação — com cores, autocompletar e muitas ferramentas úteis.

**Profile / .bashrc / .zshrc**
> Arquivos secretos do terminal que guardam configurações. O builder-setup os edita para que os programas instalados fiquem disponíveis quando você abre um terminal novo.

**WSL**
> Windows Subsystem for Linux. Um jeito de ter um Linux dentro do Windows. Se você usa WSL, o builder-setup configura tudo no Linux e aproveita programas do Windows (como o VS Code).

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

---

*Dúvidas? Entre no canal **#support-help-aifirst** no Slack da Inspira. Lá o time de suporte te ajuda com tudo que envolve ambiente de desenvolvimento.*

