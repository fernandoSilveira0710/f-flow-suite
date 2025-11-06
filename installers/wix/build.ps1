param(
  [string]$Version = "1.0.0.0",
  [string]$ProductName = "F-Flow Suite",
  [string]$Manufacturer = "2F Solutions"
)

$ErrorActionPreference = 'Stop'

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
  $absDist = (Resolve-Path $distPath).Path
  & heat dir $absDist -gg -sfrag -sreg -dr ErpDistDir -cg ErpDistComponents -var var.ErpDistSource -out ErpDist.wxs
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
  Generate-ErpDistFragment

  $absDist = (Resolve-Path "..\\..\\dist").Path
  candle -ext WixUtilExtension -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -dErpDistSource="$absDist" -arch x64 Product.wxs ErpDist.wxs
  light -ext WixUtilExtension Product.wixobj ErpDist.wixobj -o FFlowSuite.msi

  $nodeMsi = Join-Path (Get-Location) 'node-v18.19.1-x64.msi'
  if (Test-Path $nodeMsi) {
    $mbaDll = Resolve-Path '..\bootstrapper-app\bin\Release\FflowBootstrapperApp.dll' -ErrorAction SilentlyContinue
    if ($mbaDll) {
      Write-Host "Compilando Bundle com Managed Bootstrapper Application (MBA)" -ForegroundColor Cyan
      candle -ext WixBalExtension -arch x64 Bundle.MBA.wxs
      light -ext WixBalExtension Bundle.MBA.wixobj -o FFlowSuiteBootstrapper.exe
    } else {
      Write-Host "Compilando Bundle com UI padrão (sem MBA)" -ForegroundColor Cyan
      candle -ext WixBalExtension -arch x64 Bundle.wxs
      light -ext WixBalExtension Bundle.wixobj -o FFlowSuiteBootstrapper.exe
    }
  } else {
    Write-Warning "Bundle não compilado: 'node-v18.19.1-x64.msi' não encontrado ao lado de Bundle.wxs. Pulei o bootstrapper."
  }
}

Write-Host "Build concluído: FFlowSuite.msi e FFlowSuiteBootstrapper.exe" -ForegroundColor Green