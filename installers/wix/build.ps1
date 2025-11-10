param(
  [string]$Version = "1.0.0.0",
  [string]$ProductName = "F-Flow Suite",
  [string]$Manufacturer = "2F Solutions"
)

$ErrorActionPreference = 'Stop'

# Diretório de saída consolidada
$OutDir = Join-Path (Get-Location) 'out-wpf'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

# Garantir que todos os comandos candle/light/heat rodem a partir da pasta do script
Push-Location $PSScriptRoot

# Se a versão não foi informada (default 1.0.0.0), gera uma versão dinâmica
if ($Version -eq '1.0.0.0') {
  $verA = [int](Get-Date).DayOfYear   # 1..366
  $verB = ([int](Get-Date).Hour * 100 + [int](Get-Date).Minute) # 0..2359
  $Version = "1.0.$verA.$verB"
}

function Ensure-Tool($tool) {
  $exists = Get-Command $tool -ErrorAction SilentlyContinue
  if (-not $exists) {
    Write-Error "Ferramenta não encontrada: $tool. Instale o WiX Toolset e garanta que 'wix' (CLI) ou 'candle'/'light' estejam no PATH."
  }
}

# Tentar detectar o WiX v3 e adicionar ao PATH desta sessão
function Add-WixV3ToPath() {
  $pf86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
  $pf64 = [Environment]::GetEnvironmentVariable('ProgramFiles')
  $candidates = @(
    (Join-Path $pf86 'WiX Toolset v3.14\\bin'),
    (Join-Path $pf64 'WiX Toolset v3.14\\bin'),
    (Join-Path $pf86 'WiX Toolset v3.11\\bin'),
    (Join-Path $pf64 'WiX Toolset v3.11\\bin')
  )
  foreach ($dir in $candidates) {
    if (Test-Path $dir) {
      if (-not ($env:Path -like "*${dir}*")) {
        $env:Path = "$dir;" + $env:Path
        Write-Host "Adicionado ao PATH: $dir" -ForegroundColor Yellow
      }
      # Exportar WixToolsetDir (raiz) para facilitar referência a BootstrapperCore.dll
      $env:WixToolsetDir = Split-Path $dir -Parent
      return $true
    }
  }
  return $false
}

# Garantir que ferramentas do WiX v3 estejam acessíveis
Add-WixV3ToPath | Out-Null

# Gerar fragmento para incluir todo o conteúdo de 'dist' (ERP) via heat
function Generate-ErpDistFragment() {
  Ensure-Tool 'heat'
  Write-Host "Gerando fragmento ErpDist.wxs com heat (conteúdo de dist/)" -ForegroundColor Cyan
  $distPath = "..\\..\\dist"
  if (Test-Path $distPath) {
    $absDist = (Resolve-Path $distPath).Path
    & heat dir $absDist -gg -sfrag -sreg -dr ErpDistDir -cg ErpDistComponents -var var.ErpDistSource -out ErpDist.wxs
    return $true
  } else {
    Write-Warning "Pasta 'dist' não encontrada; pulando geração de ErpDist.wxs e build do MSI. Usarei MSI já gerado se existir."
    return $false
  }
}

# Preferir WiX v4 (wix CLI), mas dar fallback para candle/light (v3)
# Forçar fallback para WiX v3 enquanto os .wxs usam o esquema v3 (2006)
$hasWixCli = $false
if ($hasWixCli) {
  Generate-ErpDistFragment
  Write-Host "Compilando com WiX CLI (v4)" -ForegroundColor Cyan
  wix build ./Product.wxs ./ErpDist.wxs -o ./FFlowSuite.msi -arch x64 --define Version=$Version --define ProductName="$ProductName" ...
  wix build ./Bundle.wxs -o ./FFlowSuiteBootstrapper.exe -arch x64
} else {
  Write-Host "Compilando com candle/light (WiX v3)" -ForegroundColor Cyan
  Ensure-Tool 'candle'
  Ensure-Tool 'light'
  $erpReady = Generate-ErpDistFragment
  $msiPath = Join-Path $OutDir 'FFlowSuite.msi'
  if ($erpReady) {
    # Compilar app de bandeja (monitor de serviços) antes do MSI para garantir que o arquivo exista
    $trayProj = '..\tray-monitor\ServiceTrayMonitor.csproj'
    if (Test-Path $trayProj) {
      $dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
      if ($dotnet) {
        Write-Host "Compilando app de bandeja (monitor de serviços)" -ForegroundColor Cyan
        & $dotnet.Path build $trayProj -c Release
      } else {
        $msbuild = Get-Command msbuild -ErrorAction SilentlyContinue
        if ($msbuild) {
          Write-Host "Compilando app de bandeja via MSBuild" -ForegroundColor Cyan
          & $msbuild.Path $trayProj /p:Configuration=Release /v:m
        } else {
          Write-Warning "MSBuild/dotnet não encontrados; app de bandeja não será compilado."
        }
      }
    }

    $absDist = (Resolve-Path "..\\..\\dist").Path
  candle -ext WixUtilExtension -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -dErpDistSource="$absDist" -arch x64 Product.wxs ErpDist.wxs
  light -ext WixUtilExtension Product.wixobj ErpDist.wixobj -o $msiPath
  } else {
    if (-not (Test-Path $msiPath)) {
      if (Test-Path 'FFlowSuite.msi') { Copy-Item 'FFlowSuite.msi' $msiPath -Force }
    }
    if (-not (Test-Path $msiPath)) {
      Write-Warning "FFlowSuite.msi não encontrado em '$msiPath' e 'installers/wix'. O build do bundle pode falhar."
    }
  }

  $nodeMsi = Join-Path (Get-Location) 'node-v18.19.1-x64.msi'
  if (Test-Path $nodeMsi) {
    # Tentar compilar o MBA WPF se msbuild/dotnet estiverem disponíveis
    $mbaProj = '..\bootstrapper-app\FflowBootstrapperApp.csproj'
    if (Test-Path $mbaProj) {
      $msbuild = Get-Command msbuild -ErrorAction SilentlyContinue
      if ($msbuild) {
        Write-Host "Compilando projeto MBA via MSBuild" -ForegroundColor Cyan
        & $msbuild.Path $mbaProj /p:Configuration=Release /v:m
      } else {
        $dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
        if ($dotnet) {
          Write-Host "Compilando projeto MBA via dotnet build" -ForegroundColor Cyan
          & $dotnet.Path build $mbaProj -c Release
        } else {
          Write-Warning "MSBuild/dotnet não encontrados; mantendo fallback para UI padrão."
        }
      }
    }

    # MSI agora é referenciado diretamente a partir de out-wpf nos .wxs; não é necessário copiar

    # Compilar app de bandeja (monitor de serviços)
    $trayProj = '..\tray-monitor\ServiceTrayMonitor.csproj'
    if (Test-Path $trayProj) {
      $dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
      if ($dotnet) {
        Write-Host "Compilando app de bandeja (monitor de serviços)" -ForegroundColor Cyan
        & $dotnet.Path build $trayProj -c Release
      } else {
        $msbuild = Get-Command msbuild -ErrorAction SilentlyContinue
        if ($msbuild) {
          Write-Host "Compilando app de bandeja via MSBuild" -ForegroundColor Cyan
          & $msbuild.Path $trayProj /p:Configuration=Release /v:m
        } else {
          Write-Warning "MSBuild/dotnet não encontrados; app de bandeja não será compilado."
        }
      }
    }

    # Sempre gerar StdBA (UI padrão, sem .NET)
    Write-Host "Compilando Bundle StdBA (sem .NET)" -ForegroundColor Cyan
    candle -ext WixUtilExtension -ext WixBalExtension -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -arch x64 Bundle.wxs
    light -ext WixUtilExtension -ext WixBalExtension Bundle.wixobj -o (Join-Path $OutDir '2F Solutions (StdBA).exe')

    # Gerar MBA (WPF, requer .NET 4.8) se a DLL existir
    $mbaDll = Resolve-Path '..\bootstrapper-app\bin\Release\net48\FflowBootstrapperApp.dll' -ErrorAction SilentlyContinue
    if ($mbaDll) {
      Write-Host "Compilando Bundle MBA (WPF, requer .NET 4.8)" -ForegroundColor Cyan
      candle -ext WixUtilExtension -ext WixBalExtension -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -arch x64 Bundle.MBA.wxs
      light -ext WixUtilExtension -ext WixBalExtension Bundle.MBA.wixobj -dWixMbaPrereqPackageId=NetFx48 -dWixMbaPrereqLicenseUrl=https://go.microsoft.com/fwlink/?LinkId=2085155 -o (Join-Path $OutDir '2F Solutions.exe')
    } else {
      Write-Warning "DLL do MBA não encontrada; gerado apenas StdBA."
    }
  } else {
    Write-Warning "Bundle não compilado: 'node-v18.19.1-x64.msi' não encontrado ao lado de Bundle.wxs. Pulei o bootstrapper."
  }
}

Write-Host "Build concluído: MSI + StdBA + MBA (quando disponível) em out-wpf" -ForegroundColor Green

# Retornar ao diretório original
Pop-Location