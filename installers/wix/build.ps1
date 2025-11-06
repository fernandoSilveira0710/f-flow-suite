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

# Preferir WiX v4 (wix CLI), mas dar fallback para candle/light (v3)
$hasWixCli = Get-Command wix -ErrorAction SilentlyContinue
if ($hasWixCli) {
  Write-Host "Compilando com WiX CLI (v4)" -ForegroundColor Cyan
  wix build ./Product.wxs -o ./FFlowSuite.msi --arch x64 --define Version=$Version --define ProductName="$ProductName" --define Manufacturer="$Manufacturer"
  wix build ./Bundle.wxs -o ./FFlowSuiteBootstrapper.exe --arch x64
} else {
  Write-Host "Compilando com candle/light (WiX v3)" -ForegroundColor Cyan
  Ensure-Tool 'candle'
  Ensure-Tool 'light'

  candle -dVersion=$Version -dProductName="$ProductName" -dManufacturer="$Manufacturer" -arch x64 Product.wxs -out Product.wixobj
  light -ext WixUtilExtension Product.wixobj -o FFlowSuite.msi

  candle -arch x64 Bundle.wxs -out Bundle.wixobj
  light Bundle.wixobj -o FFlowSuiteBootstrapper.exe
}

Write-Host "Build concluído: FFlowSuite.msi e FFlowSuiteBootstrapper.exe" -ForegroundColor Green