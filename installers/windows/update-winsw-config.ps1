Param(
  [string]$RepoRoot = 'C:\Users\Fernando\Documents\2F SOLUTIONS\f-flow-suite'
)

$ErrorActionPreference = 'Stop'

function Update-ServiceXml {
  Param(
    [string]$XmlPath,
    [string]$DistMainPath,
    [string]$WorkingDir,
    [bool]$UpdateArgs = $true,
    [bool]$UpdateWorkingDir = $true
  )

  if (-not (Test-Path $XmlPath)) {
    throw "XML não encontrado: $XmlPath"
  }

  Write-Host "Atualizando XML: $XmlPath"
  $xml = Get-Content -Path $XmlPath -Raw

  if ($UpdateArgs) {
    $xml = [regex]::Replace($xml, '<arguments>.*?</arguments>', '<arguments>"' + $DistMainPath + '" --service</arguments>')
  }
  if ($UpdateWorkingDir) {
    $xml = [regex]::Replace($xml, '<workingdirectory>.*?</workingdirectory>', '<workingdirectory>' + $WorkingDir + '</workingdirectory>')
  }
  # Converter <onfailure>restart</onfailure> para formato com atributos
  $xml = [regex]::Replace($xml, '<onfailure>.*?</onfailure>', '<onfailure action="restart" delay="10 sec" />')

  # Remover atributo de somente leitura se existir
  try { attrib -R $XmlPath | Out-Null } catch {}
  Set-Content -Path $XmlPath -Value $xml -Encoding UTF8
}

function Restart-LocalService {
  Param(
    [string]$ServiceExe
  )
  Write-Host "Parando serviço via WinSW..."
  & $ServiceExe stop | Out-Host
  Start-Sleep -Seconds 2
  Write-Host "Iniciando serviço via WinSW..."
  & $ServiceExe start | Out-Host
}

# Paths
$apiXml = 'C:\ProgramData\FFlow\service\F-Flow-Client-Local.xml'
$erpXml = 'C:\ProgramData\FFlow\service\F-Flow-ERP-Static.xml'
$apiExe = 'C:\ProgramData\FFlow\service\F-Flow-Client-Local.exe'

$repoClientLocal = Join-Path $RepoRoot 'client-local'
$repoDistMain = Join-Path $repoClientLocal 'dist\main.js'

Write-Host "Repo client-local: $repoClientLocal"
Write-Host "Dist main.js: $repoDistMain"

if (-not (Test-Path $repoDistMain)) {
  throw "Arquivo dist/main.js não encontrado em: $repoDistMain. Execute o build (npm run build) no client-local."
}

# Atualizar XML da API
Update-ServiceXml -XmlPath $apiXml -DistMainPath $repoDistMain -WorkingDir $repoClientLocal

# Atualizar XML do ERP (apenas onfailure)
Write-Host "Atualizando XML do ERP..."
if (Test-Path $erpXml) {
  $erpContent = Get-Content -Path $erpXml -Raw
  $erpContent = [regex]::Replace($erpContent, '<onfailure>.*?</onfailure>', '<onfailure action="restart" delay="10 sec" />')
  try { attrib -R $erpXml | Out-Null } catch {}
  Set-Content -Path $erpXml -Value $erpContent -Encoding UTF8
}

# Reiniciar serviço
Restart-LocalService -ServiceExe $apiExe

Write-Host "Status dos serviços:"
Get-Service -Name 'F-Flow-Client-Local','F-Flow-ERP-Static' | Select-Object Name, Status | Format-Table -AutoSize

Write-Host "Testando endpoint de licença (8081)..."
try {
  $resp = Invoke-WebRequest -Uri 'http://localhost:8081/licensing/status' -UseBasicParsing -TimeoutSec 5
  Write-Host "Status:" $resp.StatusCode
  Write-Host $resp.Content
} catch {
  Write-Warning $_.Exception.Message
}