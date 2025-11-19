# F-Flow Desktop (Electron)

- Unifica a inicialização do **Client-Local** e do **ERP** em uma janela.
- Remove dependência de Serviços do Windows e ações elevadas.
- Instalação e desinstalação simples via **NSIS one-click**.

## Pré-requisitos
- Gerar builds locais:
  - `client-local`: `npm run build` → `client-local/dist/main.js`
  - `ERP (raiz do projeto)`: `npm run build` → `dist/index.html`

## Desenvolvimento
```
cd desktop
npm i
npm run dev
```

## Build do instalador
```
cd desktop
npm i
npm run dist
```

O instalador inclui `dist/` (ERP) e `client-local/dist` automaticamente.