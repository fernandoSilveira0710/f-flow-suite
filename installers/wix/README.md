# F-Flow Suite - Instalador MSI (WiX)

Este diretório contém a configuração do instalador **MSI** utilizando o **WiX Toolset**. O bundle suporta:
- Pré‑requisito do **Node.js** via Burn
- Instalação automática e offline do **.NET Framework 4.8** quando necessário (MBA)

## Pré-requisitos

- Windows 10/11 x64
- [WiX Toolset 4.x](https://wixtoolset.org/)
- Node.js 18+ (instalado pelo Bundle ou previamente no sistema)

Opcional (apenas para MBA/WPF):
- Redistribuível do **.NET Framework 4.8**: `ndp48-x86-x64-allos-enu.exe` (já incluído em `installers/wix/` e embutido no bundle)

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

4. Pré-requisito Node.js e .NET:
   - Coloque `node-v18.19.1-x64.msi` ao lado de `Bundle.wxs`.
   - O redistribuível do .NET 4.8 (`ndp48-x86-x64-allos-enu.exe`) já está presente em `installers/wix/` e será embutido no bundle MBA.
   - Tanto o MSI do Node quanto o MSI principal e o instalador do .NET são gerados/embutidos com `Compressed="yes"` para instalação offline.

## Compilar

Execute o script de build:

```powershell
cd installers/wix
./build.ps1
```

Este script irá:
- Compilar o `Product.wxs` em `FFlowSuite.msi`
- Compilar o bundle StdBA (UI padrão do Burn)
- Compilar o bundle MBA (UI WPF) com pré‑requisito do .NET 4.8 embutido
- Colher (harvest) o conteúdo de `dist/` com `heat` para incluir todos os arquivos estáticos do ERP

Saída consolidada:
- Os executáveis e MSI são gravados em `installers/wix/out-wpf/`

## Instalar

- Via MBA (UI WPF, instala .NET 4.8 offline se necessário): execute `2F Solutions.exe`
- Via StdBA (UI padrão do Burn, sem .NET): execute `2F Solutions (StdBA).exe`
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

## Executáveis gerados

- `2F Solutions.exe` (MBA, WPF):
  - Requer .NET Framework 4.8 para a UI WPF
  - Detecta o .NET 4.8 e, se ausente, instala automaticamente o `ndp48-x86-x64-allos-enu.exe` embutido, offline e silenciosamente (`/quiet /norestart`)
  - Após o pré‑requisito, segue para instalar o Node.js (se necessário) e o `FFlowSuite.msi`

- `2F Solutions (StdBA).exe` (StdBA):
  - UI padrão do Burn, não requer .NET
  - Útil como fallback caso o MBA falhe em ambientes sem .NET
  - Instala o Node.js (se necessário) e o `FFlowSuite.msi`

- `FFlowSuite.msi`:
  - Instalador MSI principal (pode ser executado diretamente via `msiexec`)

Local da saída: `installers/wix/out-wpf/`

## Observações

- O launcher cria atalhos para abrir o ERP em `http://localhost:8080/erp/login`.
- Os serviços são instalados via `nssm` (você pode trocar para `node-windows` se preferir).
- Se preferir instalar o Node como pré‑requisito silencioso por outra ferramenta, o `Bundle.wxs` pode ser omitido, usando apenas `Product.wxs`.
- O bundle MBA define `WixMbaPrereqPackageId=NetFx48` e `WixMbaPrereqLicenseUrl` (via script) para exibir a licença e garantir a execução do pré‑requisito antes da UI WPF.