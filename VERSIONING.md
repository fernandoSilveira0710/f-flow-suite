# Queima de Versão (Client-Local e ERP)

Este documento define como versionar ("queimar a versão") a cada nova compilação do executável do Client-Local e do instalador, e como exibir essa versão no ERP (frontend).

## Visão Geral

- A versão do instalador é definida no script do Inno Setup e deve ser atualizada a cada build.
- O ERP exibe a versão usando a variável de ambiente `VITE_APP_VERSION` (injetada no build do frontend).
- Opcionalmente, a versão no `client-local/package.json` pode ser atualizada para rastreamento interno.

## Onde configurar a versão

- Instalador (Windows): `client-local/installers/windows/f-flow-client-installer.iss`
  - Ajuste a linha:
    - `#define AppVersion "1.0.0"`
  - Essa versão será usada em `AppVersion={#AppVersion}` no bloco `[Setup]` e aparecerá nas propriedades do instalador.

- ERP (Frontend): arquivo `.env` (ou `.env.local`) na pasta `site/`
  - Defina/incremente:
    - `VITE_APP_VERSION=1.0.0`
  - O ERP lê essa variável e renderiza a versão no card “Plano Atual”.

- Client-Local (opcional): `client-local/package.json`
  - Campo `"version"`: útil para tracking interno, logs ou endpoints futuros.

## Passo a passo (Build com queima de versão)

1) Atualizar versão do instalador
- Editar `client-local/installers/windows/f-flow-client-installer.iss` e ajustar `#define AppVersion`.

2) Atualizar versão exibida no ERP
- Editar `site/.env` (ou `site/.env.local`) e definir `VITE_APP_VERSION` com o mesmo valor.

3) Rebuild do ERP (assets)
- Comandos:
  - `cd site`
  - `npm run build`
- O instalador já copia `dist/index.html` e `dist/assets/*` quando presentes.

4) Rebuild do executável do Client-Local
- Comandos:
  - `cd client-local`
  - `npm run build:pkg`

5) Gerar instalador Windows
- Comandos (se o script estiver funcionando):
  - `npm run installer:fast`
- Se o script falhar por causa do caminho do ISCC, use o caminho completo do Inno Setup:
  - `"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installers/windows/f-flow-client-installer.iss`

6) Instalar e validar
- Instale o novo `.exe` do instalador em Windows.
- Verifique no ERP: Sidebar → “Plano Atual” deve mostrar “Versão: X.Y.Z”.

## Observações importantes

- Fonte única de verdade: recomenda-se usar o valor de `AppVersion` como referência e replicá-lo em `VITE_APP_VERSION` para evitar divergência visual.
- Automação (opcional): podemos adicionar um script de sincronização que lê `AppVersion` do `.iss` e atualiza `site/.env` e `client-local/package.json`. Se desejar, peça para eu incluir esse script.
- `pkg` não embute metadados de versão do executável nativamente; por isso, usamos o `AppVersion` do instalador e a variável `VITE_APP_VERSION` no ERP como indicação visível de versão.

## Onde aparece no ERP

- O ERP renderiza a versão no card de “Plano Atual” (arquivo `src/layouts/erp-layout.tsx`), usando `import.meta.env.VITE_APP_VERSION`. Se a variável não estiver definida, aparece `dev`.

## Checklist de release

- [ ] Atualizar `#define AppVersion` no `.iss`
- [ ] Atualizar `VITE_APP_VERSION` em `site/.env`
- [ ] Rodar build do `site` (Vite)
- [ ] Rodar `npm run build:pkg` em `client-local`
- [ ] Gerar instalador (ISCC)
- [ ] Instalar e validar versão exibida no ERP