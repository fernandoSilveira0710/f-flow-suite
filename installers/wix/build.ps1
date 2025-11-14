param(
  [string]$Version = "1.0.0.0",
  [string]$ProductName = "F-Flow Suite",
  [string]$Manufacturer = "2F Solutions",
  [switch]$SkipMBA,
  [switch]$SkipStdBA
)

$ErrorActionPreference = 'Stop'

# Padrão do pipeline: gerar apenas StdBA (sem MBA/WPF)
if (-not $PSBoundParameters.ContainsKey('SkipMBA')) { $SkipMBA = $true }

# Diretório de saída consolidada
$OutDir = Join-Path $PSScriptRoot 'out-wpf'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

# Garantir que todos os comandos candle/light/heat rodem a partir da pasta do script
Push-Location $PSScriptRoot

# Se a versão não foi informada (default 1.0.0.0), gera uma versão dinâmica
if ($Version -eq '1.0.0.0') {
  $verA = [int](Get-Date).DayOfYear   # 1..366
  $verB = ([int](Get-Date).Hour * 100 + [int](Get-Date).Minute) # 0..2359
  $Version = "1.0.$verA.$verB"
}

# Descobrir versão da aplicação (3 partes) a partir do .env para sincronizar ERP e Bundle
$AppVersion = $null
$envCandidates = @('..\\..\\.env.development','..\\..\\site\\.env.development')
foreach ($envFile in $envCandidates) {
  if (Test-Path $envFile) {
    $content = Get-Content $envFile -ErrorAction SilentlyContinue
    $line = $content | Where-Object { $_ -match '^\s*VITE_APP_VERSION\s*=\s*' } | Select-Object -First 1
    if ($line) {
      $match = [regex]::Match($line, '^\s*VITE_APP_VERSION\s*=\s*(.*)\s*$')
      if ($match.Success) { $AppVersion = $match.Groups[1].Value.Trim() }
    }
    if ($AppVersion) { break }
  }
}

# Se foi passada a versão 4 partes via parâmetro, derive AppVersion; caso contrário derive Version da AppVersion
if ($PSBoundParameters.ContainsKey('Version')) {
  $parts = $Version -split '\.'
  if ($parts.Count -ge 3) { $AppVersion = ($parts[0..2] -join '.') }
} else {
  if (-not $AppVersion) { $AppVersion = 'dev' }
  if ($AppVersion -match '^\d+\.\d+\.\d+$') {
    $Version = "$AppVersion.0"
  }
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

# Gerar fragmento para incluir todo o conteúdo de 'client-local/dist' via heat
function Generate-ClientLocalDistFragment() {
  Ensure-Tool 'heat'
  Write-Host "Gerando fragmento ClientLocalDist.wxs com heat (conteúdo de client-local/dist/)" -ForegroundColor Cyan
  $distPath = "..\\..\\client-local\\dist"
  if (Test-Path $distPath) {
    $absDist = (Resolve-Path $distPath).Path
    & heat dir $absDist -gg -sfrag -sreg -dr ClientLocalDistDir -cg ClientLocalDistComponents -var var.ClientLocalDistSource -out ClientLocalDist.wxs
    return $true
  } else {
    Write-Warning "Pasta 'client-local\\dist' não encontrada; pulando geração de ClientLocalDist.wxs e cópia da API local no MSI."
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
  $clientReady = Generate-ClientLocalDistFragment
  $msiPath = Join-Path $OutDir 'FFlowSuite.msi'
  if ($erpReady -and $clientReady) {
    # Compilar app de bandeja (monitor de serviços) antes do MSI para garantir que o arquivo exista
    $trayProj = '..\tray-monitor\ServiceTrayMonitor.csproj'
    if (Test-Path $trayProj) {
      $dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
      if ($dotnet) {
        Write-Host "Publicando app de bandeja self-contained (monitor de serviços)" -ForegroundColor Cyan
        $publishDir = Resolve-Path '..\tray-monitor\publish' -ErrorAction SilentlyContinue
        if (-not $publishDir) { New-Item -ItemType Directory -Path '..\tray-monitor\publish' -Force | Out-Null; $publishDir = Resolve-Path '..\tray-monitor\publish' }
        & $dotnet.Path publish $trayProj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o $publishDir.Path
      } else {
        Write-Warning "dotnet não encontrado; app de bandeja não será publicado."
      }
    }

    $absDist = (Resolve-Path "..\\..\\dist").Path
  candle -ext WixUtilExtension -dProductVersion=$Version -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -dErpDistSource="$absDist" -dClientLocalDistSource="$((Resolve-Path "..\..\client-local\dist").Path)" -dAppVersion="$AppVersion" -arch x64 Product.wxs ErpDist.wxs ClientLocalDist.wxs
  light -ext WixUtilExtension Product.wixobj ErpDist.wixobj ClientLocalDist.wixobj -o $msiPath
  # Não sobrescrever o MSI gerado em out-wpf com um artefato antigo da pasta atual
  # Mantemos apenas o arquivo em $msiPath como fonte de verdade
  } else {
    if (-not (Test-Path $msiPath)) {
      if (Test-Path 'FFlowSuite.msi') { Copy-Item 'FFlowSuite.msi' $msiPath -Force }
    }
    if (-not (Test-Path $msiPath)) {
      Write-Warning "FFlowSuite.msi não encontrado em '$msiPath' e 'installers/wix'. O build do bundle pode falhar (erpReady=$erpReady, clientReady=$clientReady)."
    }
  }

$nodeMsi = Join-Path (Get-Location) 'node-v18.19.1-x64.msi'
if (Test-Path $nodeMsi) {
    # Compilar MBA apenas quando não estiver pulando MBA
    if (-not $SkipMBA) {
      # Verificar presença do redistribuível do .NET 4.8 (Git LFS)
      $netfxExe = Join-Path (Get-Location) 'ndp48-x86-x64-allos-enu.exe'
      if (-not (Test-Path $netfxExe)) {
        Write-Error "Pré‑requisito ausente: ndp48-x86-x64-allos-enu.exe não encontrado. Execute 'git lfs pull' na raiz do repositório para baixar o arquivo via LFS antes de compilar o MBA."
      }
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
    } else {
      Write-Host "MBA desativado (-SkipMBA). Pulando compilação da UI WPF." -ForegroundColor Yellow
    }

    # MSI agora é referenciado diretamente a partir de out-wpf nos .wxs; não é necessário copiar

    # Compilar app de bandeja (monitor de serviços)
      $trayProj = '..\tray-monitor\ServiceTrayMonitor.csproj'
      if (Test-Path $trayProj) {
        $dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
        if ($dotnet) {
          Write-Host "Publicando app de bandeja self-contained (monitor de serviços)" -ForegroundColor Cyan
          $publishDir = Resolve-Path '..\tray-monitor\publish' -ErrorAction SilentlyContinue
          if (-not $publishDir) { New-Item -ItemType Directory -Path '..\tray-monitor\publish' -Force | Out-Null; $publishDir = Resolve-Path '..\tray-monitor\publish' }
          & $dotnet.Path publish $trayProj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o $publishDir.Path
        } else {
          Write-Warning "dotnet não encontrado; app de bandeja não será publicado."
        }
      }

    if (-not $SkipStdBA) {
      # Sempre gerar StdBA (UI padrão, sem .NET)
      Write-Host "Compilando Bundle StdBA (sem .NET)" -ForegroundColor Cyan
      $stdbaOut = Join-Path $OutDir "2F Solutions V $AppVersion.exe"
      if (Test-Path $stdbaOut) { Try { Remove-Item $stdbaOut -Force } Catch { Write-Warning "Não foi possível remover '$stdbaOut' antes de recompilar: $($_.Exception.Message)" } }
      candle -ext WixUtilExtension -ext WixBalExtension -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -dAppVersion="$AppVersion" -arch x64 Bundle.wxs
      light -ext WixUtilExtension -ext WixBalExtension Bundle.wixobj -o $stdbaOut
    } else {
      Write-Host "StdBA desativado (-SkipStdBA). Pulando geração do executável do bundle." -ForegroundColor Yellow
    }

    # Gerar MBA (WPF, requer .NET 4.8) se não estiver pulando MBA e a DLL existir
    if (-not $SkipMBA) {
      $mbaDll = Resolve-Path '..\bootstrapper-app\bin\Release\net48\FflowBootstrapperApp.dll' -ErrorAction SilentlyContinue
      if ($mbaDll) {
        Write-Host "Compilando Bundle MBA (WPF, requer .NET 4.8)" -ForegroundColor Cyan
        candle -ext WixUtilExtension -ext WixBalExtension -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -arch x64 Bundle.MBA.wxs
        light -ext WixUtilExtension -ext WixBalExtension Bundle.MBA.wixobj -dWixMbaPrereqPackageId=NetFx48 -dWixMbaPrereqLicenseUrl=https://go.microsoft.com/fwlink/?LinkId=2085155 -o (Join-Path $OutDir "2F Solutions (MBA) V $AppVersion.exe")
      } else {
        Write-Warning "DLL do MBA não encontrada; gerado apenas StdBA."
      }
    } else {
      Write-Host "MBA desativado (-SkipMBA). Bundle MBA não será gerado." -ForegroundColor Yellow
    }
  } else {
    Write-Warning "Bundle não compilado: 'node-v18.19.1-x64.msi' não encontrado ao lado de Bundle.wxs. Pulei o bootstrapper."
  }
}

Write-Host "Build concluído: MSI + StdBA + MBA (quando disponível) em out-wpf" -ForegroundColor Green

# Retornar ao diretório original
Pop-Location