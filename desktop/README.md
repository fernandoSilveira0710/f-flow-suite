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

## Portas e inicialização dinâmica
- O desktop detecta um par de portas livres para a API e ERP.
- Preferências: `18081` para API e `18080` para ERP; tenta alternativas e faz até 3 tentativas.
- Se não houver `node.exe` instalado, o launcher usa o próprio executável do Electron com `ELECTRON_RUN_AS_NODE=1` para executar o `client-local/dist/main.js`.
- Logs de inicialização ficam em `startup.log` no diretório `userData` do Electron.
