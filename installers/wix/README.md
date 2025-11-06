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
   - O instalador copiará `dist/index.html` para `Program Files\\F-Flow Suite\\erp\\dist\\index.html`.

2. Build do Client-Local (API):
   - Em `client-local`: `npm run build` → gera `client-local/dist/main.js`
   - O instalador copiará `client-local/dist/main.js` para `Program Files\\F-Flow Suite\\client-local\\main.js`.

3. Scripts de serviço e launcher:
   - `installers/windows/service-install.ps1`
   - `installers/windows/service-uninstall.ps1`
   - `installers/windows/launcher.ps1`

4. Pré-requisito Node.js:
   - Faça download do MSI do Node.js (ex.: `node-v18.19.1-x64.msi`) e coloque ao lado de `Bundle.wxs`.

## Compilar

Execute o script de build:

```powershell
cd installers/wix
./build.ps1
```

Este script irá:
- Compilar o `Product.wxs` em `FFlowSuite.msi`
- Compilar o `Bundle.wxs` em um `FFlowSuiteBootstrapper.exe` que instala o Node e depois o MSI

## Instalar

- Via bootstrapper: execute `FFlowSuiteBootstrapper.exe`
- Ou diretamente: `msiexec /i FFlowSuite.msi`

Após a instalação, rode o script de serviço para registrar os serviços:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Program Files\F-Flow Suite\installers\windows\service-install.ps1"
```

## Desinstalar

Desinstalação limpa:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Program Files\F-Flow Suite\installers\windows\service-uninstall.ps1"
msiexec /x FFlowSuite.msi
```

## Observações

- O launcher cria atalhos para abrir o ERP em `http://localhost:8080/erp/login`.
- Os serviços são instalados via `nssm` (você pode trocar para `node-windows` se preferir).
- Se preferir instalar o Node como pré‑requisito silencioso por outra ferramenta, o `Bundle.wxs` pode ser omitido, usando apenas `Product.wxs`.