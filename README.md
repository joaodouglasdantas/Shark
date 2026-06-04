<p align="center">
  <img src="images/logo.png" alt="Shark" height="90">
</p>

<h1 align="center">Shark</h1>

<p align="center">
  Dashboard financeiro pessoal — versão web estática do <strong>Lavix</strong>, adaptada para mobile e hospedável no GitHub Pages.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat&logo=tailwindcss&logoColor=white">
</p>

---

## Sobre o projeto

**Shark** é uma releitura do [Lavix](https://github.com/joaodouglasdantas/Shark) — dashboard financeiro originalmente construído em **Ruby on Rails** com tema de fogo e lava — reconstruído do zero em **HTML + CSS + JavaScript puro**, com tema de água e oceano profundo.

A motivação da mudança foi simples: eliminar a dependência de servidor e tornar o sistema acessível de qualquer dispositivo, inclusive celular, sem precisar rodar nada localmente. Todos os dados ficam salvos no `localStorage` do próprio navegador.

---

## Diferenças em relação ao Lavix original

| | Lavix (original) | Shark (este projeto) |
|---|---|---|
| **Tecnologia** | Ruby on Rails | HTML + CSS + JS puro |
| **Banco de dados** | PostgreSQL | localStorage (navegador) |
| **Deploy** | Heroku / servidor Ruby | GitHub Pages (estático) |
| **Tema** | Fogo e lava — laranja neon | Água e oceano — azul |
| **Mobile** | Parcialmente responsivo | 100% responsivo |
| **Instalação** | Ruby, Bundler, Postgres | Nenhuma — abre no browser |

---

## Funcionalidades

- **Dashboard** — KPIs do mês (receitas, despesas, saldo), gráficos de pizza/linha, tabela comparativa de 6 meses e lançamentos recentes
- **Lançamentos** — CRUD completo com filtro por tipo e categoria, paginação
- **Categorias** — CRUD com color picker personalizado
- **Empréstimos** — controle de empréstimos tomados e concedidos, barra de progresso, histórico de pagamentos
- **Plano Financeiro** — score de saúde financeira (0–100), insights automáticos, gráficos de evolução e tendências, previsão para o próximo mês

---

## Como usar

Acesse diretamente pelo GitHub Pages ou clone e abra o `index.html` no navegador — sem instalação, sem servidor.

```bash
git clone https://github.com/joaodouglasdantas/Shark.git
cd Shark
# Abra index.html no navegador
```

Ao criar uma conta, dados de exemplo são carregados automaticamente para o dashboard não ficar vazio.

---

## Estrutura

```
Shark/
├── index.html        ← entrada da aplicação (SPA)
├── app.css           ← estilos e componentes visuais
├── app.js            ← toda a lógica da aplicação (~1600 linhas)
└── images/
    └── logo.png
```

---

## Tecnologias

- **[Tailwind CSS](https://tailwindcss.com/)** via CDN — classes utilitárias com paleta personalizada
- **[Chart.js](https://www.chartjs.org/)** — gráficos de pizza, barra e linha
- **LocalStorage** — persistência de dados no próprio navegador
- **Hash routing** — navegação SPA sem servidor (`#dashboard`, `#transactions`, etc.)

---

<p align="center">
  Feito com base no <strong>Lavix</strong> · Tema água · Deploy via GitHub Pages
</p>
