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

# Gerar fragmento para incluir todo o conteúdo de 'dist' (ERP) via heat
function Generate-ErpDistFragment() {
  Ensure-Tool 'heat'
  Write-Host "Gerando fragmento ErpDist.wxs com heat (conteúdo de dist/)" -ForegroundColor Cyan
  $distPath = "..\\..\\dist"
  & heat dir $distPath -gg -sfrag -sreg -dr ErpDistDir -cg ErpDistComponents -var var.ErpDistSource -out ErpDist.wxs
}

# Preferir WiX v4 (wix CLI), mas dar fallback para candle/light (v3)
$hasWixCli = Get-Command wix -ErrorAction SilentlyContinue
if ($hasWixCli) {
  Generate-ErpDistFragment
  Write-Host "Compilando com WiX CLI (v4)" -ForegroundColor Cyan
  wix build ./Product.wxs ./ErpDist.wxs -o ./FFlowSuite.msi --arch x64 --define Version=$Version --define ProductName="$ProductName" --define Manufacturer="$Manufacturer" --define ErpDistSource=..\\..\\dist
  wix build ./Bundle.wxs -o ./FFlowSuiteBootstrapper.exe --arch x64
} else {
  Write-Host "Compilando com candle/light (WiX v3)" -ForegroundColor Cyan
  Ensure-Tool 'candle'
  Ensure-Tool 'light'
  Generate-ErpDistFragment

  candle -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -dErpDistSource=..\\..\\dist -arch x64 Product.wxs ErpDist.wxs -out Product.wixobj ErpDist.wixobj
  light -ext WixUtilExtension Product.wixobj ErpDist.wixobj -o FFlowSuite.msi

  candle -arch x64 Bundle.wxs -out Bundle.wixobj
  light Bundle.wixobj -o FFlowSuiteBootstrapper.exe
}

Write-Host "Build concluído: FFlowSuite.msi e FFlowSuiteBootstrapper.exe" -ForegroundColor Green