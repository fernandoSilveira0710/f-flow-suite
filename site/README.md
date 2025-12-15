# F-Flow Suite - Site Institucional (2F Solutions)

Site institucional do F-Flow Suite, desenvolvido por 2F Solutions com React, TypeScript, Vite e Tailwind CSS.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento para React
- **Lucide React** - Ícones SVG

## 📁 Estrutura do Projeto

```
site/
├── public/                 # Arquivos estáticos
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Header.tsx     # Cabeçalho/navegação
│   │   └── Footer.tsx     # Rodapé
│   ├── pages/            # Páginas da aplicação
│   │   ├── HomePage.tsx      # Página inicial
│   │   ├── FeaturesPage.tsx  # Funcionalidades
│   │   ├── PricingPage.tsx   # Preços
│   │   ├── DocsPage.tsx      # Documentação
│   │   ├── InstallationPage.tsx # Instalação
│   │   ├── ContactPage.tsx   # Contato
│   │   └── NotFoundPage.tsx  # 404
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Ponto de entrada
│   ├── index.css         # Estilos globais
│   └── vite-env.d.ts     # Tipos do Vite
├── index.html            # Template HTML
├── package.json          # Dependências e scripts
├── vite.config.ts        # Configuração do Vite
├── tailwind.config.js    # Configuração do Tailwind
├── postcss.config.js     # Configuração do PostCSS
├── tsconfig.json         # Configuração do TypeScript
└── tsconfig.node.json    # Configuração do TypeScript para Node
```

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o ESLint

## 🎨 Design System

### Cores Principais

- **Primary**: Azul (#3B82F6)
- **Secondary**: Cinza (#6B7280)
- **Success**: Verde (#10B981)
- **Warning**: Amarelo (#F59E0B)
- **Error**: Vermelho (#EF4444)

### Componentes de Botão

- `.btn-primary` - Botão principal
- `.btn-secondary` - Botão secundário  
- `.btn-outline` - Botão com borda

### Tipografia

- **Font Family**: Inter (Google Fonts)
- **Headings**: font-bold
- **Body**: font-normal

## 📱 Páginas

### Página Inicial (`/`)
- Hero section com CTA
- Seção de funcionalidades principais
- Seção de benefícios
- Call to action final

### Recursos (`/recursos`)
- Detalhamento das funcionalidades principais
- Funcionalidades adicionais
- Call to action

### Preços (`/precos`)
- Planos disponíveis (Básico, Profissional, Enterprise)
- Comparação de funcionalidades
- FAQ sobre preços
- Call to action

### Documentação (`/docs`)
- Links rápidos
- Seções de documentação
- Primeiros passos
- Suporte

### Instalação (`/docs/instalacao`)
- Requisitos do sistema
- Guia passo a passo
- Solução de problemas
- Suporte

### Contato (`/contato`)
- Informações de contato
- Formulário de contato
- Tipos de suporte
- Suporte de emergência

### 404 (`/*`)
- Página de erro personalizada
- Links para páginas populares
- Opções de navegação

## 🚀 Deploy

O site é uma aplicação estática que pode ser hospedada em qualquer provedor de hospedagem estática:

- **Vercel** (recomendado)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**

### Build de Produção

```bash
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`.

## 📝 Customização

### Cores do Tema

Edite o arquivo `tailwind.config.js` para personalizar as cores:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#eff6ff',
        // ... outras variações
        600: '#2563eb',
      }
    }
  }
}
```

### Conteúdo

- Textos e conteúdos estão diretamente nos componentes
- Imagens devem ser adicionadas na pasta `public/`
- Ícones utilizam a biblioteca Lucide React

## 📌 Escopo Atual do Produto

- PDV básico para operações do dia a dia
- Gestão de estoque com cadastro de produtos e categorias
- Clientes (cadastro básico)
- Instalação local e funcionamento offline após instalação
- Interface responsiva, atualizações e suporte

Em desenvolvimento (não disponível ainda):

- CRM avançado
- Agendamentos
- Relatórios avançados

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é parte do F-Flow Suite (2F Solutions) e está sob a mesma licença do projeto principal.