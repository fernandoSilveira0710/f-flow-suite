# F-Flow Suite - Instalador MSI (WiX)

Este diretório contém a configuração do instalador **MSI** utilizando o **WiX Toolset**, com suporte a **pré‑requisito do Node.js** via **Burn**.

## Pré-requisitos

- Windows 10/11 x64
- [WiX Toolset 4.x](https://wixtoolset.org/)
- Node.js 18+ (instalado pelo Bundle ou previamente no sistema)

## Estrutura

- `Product.wxs` — Define o MSI principal do F-Flow Suite (instala arquivos em `Program Files\\F-Flow Suite` e cria atalhos).
- `Bundle.wxs` — Bootstrapper (Burn) que instala o Node.js e, em seguida, o MSI principal.
- `build.ps1` — Script para compilar o MSI e o Bundle.

## Artefatos esperados

Antes de compilar o MSI, gere os builds e coloque os arquivos nas localizações esperadas:

1. Build do ERP (web):
   - Na raiz: `npm run build` → gera `dist/`
   - O instalador copiará todo o conteúdo de `dist/` para `Program Files\\F-Flow Suite\\erp\\dist\\` (JS/CSS/assets). O script de build usa `heat` para colher automaticamente os arquivos.

2. Build do Client-Local (API):
   - Em `client-local`: `npm run build` → gera `client-local/dist/main.js`
   - O instalador copiará `client-local/dist/main.js` para `Program Files\\F-Flow Suite\\client-local\\main.js`.

3. Scripts de serviço e launcher:
   - Serviços: instalados em `Program Files\\F-Flow Suite\\installers\\windows\\` (`service-install.ps1`, `service-uninstall.ps1`)
   - Launcher: instalado em `Program Files\\F-Flow Suite\\launchers\\launcher.ps1`

4. Pré-requisito Node.js:
   - Faça download do MSI do Node.js (ex.: `node-v18.19.1-x64.msi`) e coloque ao lado de `Bundle.wxs`.
   - O `Bundle.wxs` está configurado com `Compressed="yes"` para embutir o Node MSI e o `FFlowSuite.msi` dentro do `FFlowSuiteBootstrapper.exe`.

## Compilar

Execute o script de build:

```powershell
cd installers/wix
./build.ps1
```

Este script irá:
- Compilar o `Product.wxs` em `FFlowSuite.msi`
- Compilar o `Bundle.wxs` em um `FFlowSuiteBootstrapper.exe` que instala o Node e depois o MSI, com ambos embutidos como payloads comprimidos
 - Colher (harvest) o conteúdo de `dist/` com `heat` para incluir todos os arquivos estáticos do ERP

## Instalar

- Via bootstrapper: execute `FFlowSuiteBootstrapper.exe`
- Ou diretamente: `msiexec /i FFlowSuite.msi`

 Durante a instalação:
- Os arquivos são copiados para `C:\Program Files\F-Flow Suite\...`
- Os serviços da API (8081) e ERP (8080) são registrados automaticamente via Custom Action silenciosa
- Atalhos são criados no Desktop e Menu Iniciar, apontando para o `launcher.ps1`
 - Ao final da instalação, o instalador abre automaticamente `http://localhost:8080/erp/login` no navegador

## Desinstalar

Desinstalação:
- Use `msiexec /x FFlowSuite.msi` ou o atalho de desinstalação no Menu Iniciar.
- Opcional: caso deseje parar/remover serviços manualmente, use `service-uninstall.ps1` em `installers\windows`.

## Observações

- O launcher cria atalhos para abrir o ERP em `http://localhost:8080/erp/login`.
- Os serviços são instalados via `nssm` (você pode trocar para `node-windows` se preferir).
- Se preferir instalar o Node como pré‑requisito silencioso por outra ferramenta, o `Bundle.wxs` pode ser omitido, usando apenas `Product.wxs`.