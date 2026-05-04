# Maioli Design – Site Institucional

Este repositório contém o site institucional da **Maioli Design**, um estúdio premium de desenvolvimento web focado em performance, SEO e UI/UX. O projeto é totalmente estático – não há etapa de build, bundler ou dependências npm.

---

## Tecnologias Utilizadas

- **HTML5** – Estrutura semântica das duas páginas principais (`index.html` e `otimizacao.html`).
- **CSS3** – Estilos customizados com variáveis (`:root`) para a paleta verde da marca.
- **Bootstrap 5 (grid only)** – `bootstrap-grid.min.css` via CDN para layout responsivo.
- **JavaScript (ES6 modules)** – Interatividade pura no navegador.
- **Anime.js v3.2.2** – Animações de página (hero, scroll‑reveal, órbita, carrossel). Utiliza `prefers-reduced-motion` para acessibilidade.
- **Three.js v0.160.1** – Cena 3D do dashboard de otimização (`otimizacao.html`).
-   - **OrbitControls** – Navegação da câmera.
-   - **EffectComposer**, **RenderPass**, **UnrealBloomPass** – Pós‑processamento de efeitos.
- **Import Maps** – Importação de módulos Three.js via CDN sem bundler.
- **Google Analytics** – `G‑ZY1CGX4BBB`.
- **Google Tag Manager** – `GTM‑NGKP6CH`.

---

## Estrutura do Projeto

```
.
├─ index.html                # Página principal (landing page)
├─ otimizacao.html           # Dashboard 3D de otimização
├─ styles.css                # CSS da página principal
├─ script.js                 # Lógica e animações da página principal
├─ css/
│   └─ styles.css           # CSS do dashboard de otimização
├─ js/
│   └─ main.js              # Código Three.js (type="module")
├─ .gitignore                # Ignora assets de desenvolvimento
└─ README.md                 # Este documento
```

---

## Como Executar

1. Abra `index.html` ou `otimizacao.html` em um navegador moderno.
2. Não é necessário instalar dependências nem rodar nenhum build – todos os recursos são carregados via CDN.

---

## Deploy

O site é estático e pode ser hospedado diretamente em qualquer servidor HTTP ou serviço de hospedagem de arquivos (ex.: Netlify, Vercel, GitHub Pages). Basta copiar todos os arquivos para o diretório público.

---

**Contato**
- E‑mail: roberto@maiolidesign.com
- WhatsApp: +55 11 97834‑8787
