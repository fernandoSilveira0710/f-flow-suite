; Inno Setup Script for F-Flow Client Local (Windows) - Optimized Version
; Creates installer that installs service, writes .env, and adds desktop shortcut
; OPTIMIZED: Only includes essential executables and assets (~50MB vs 3GB)

#define AppName "2F System"
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef ClientBinary
  #define ClientBinary "..\\..\\build\\f-flow-client.exe"
#endif
#ifndef ERPUrl
  #define ERPUrl "http://127.0.0.1:8080/"
#endif
#ifndef HubUrl
  #define HubUrl "https://hub.f-flow.com"
#endif

[Setup]
AppName={#AppName}
AppVersion={#AppVersion}
DefaultDirName={pf}\\F-Flow\\ClientLocal
DefaultGroupName=2F System
OutputDir=.\\build\\installer
OutputBaseFilename=2f-system-installer
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
Compression=lzma2/fast
SolidCompression=no
WizardStyle=modern
DisableDirPage=no
ShowLanguageDialog=no
InfoBeforeFile=.\\INFO_BEFORE_PTBR.txt
InfoAfterFile=.\\INFO_AFTER_PTBR.txt
AppPublisher=2F
AppVerName=2F System - Sistema de gerenciamento comercial empresa 2F
VersionInfoCompany=2F
VersionInfoDescription=Sistema de gerenciamento comercial empresa 2F
VersionInfoProductName=2F System

[Languages]
Name: "ptbr"; MessagesFile: "compiler:Languages\\BrazilianPortuguese.isl"

[Files]
; === CORE EXECUTABLES ONLY ===
; Client executable (self-contained, no Node.js needed)
Source: "{#ClientBinary}"; DestDir: "{app}"; DestName: "f-flow-client.exe"; Flags: ignoreversion
; WinSW service wrapper
Source: ".\winsw\WinSW-x64.exe"; DestDir: "{app}\installers\windows\winsw"; Flags: ignoreversion
; Pre-install service wrappers by final names to avoid runtime copy locks
Source: ".\winsw\WinSW-x64.exe"; DestDir: "{app}\installers\windows\winsw"; DestName: "F-Flow-Client-Local.exe"; Flags: ignoreversion
Source: ".\winsw\WinSW-x64.exe"; DestDir: "{app}\installers\windows\winsw"; DestName: "F-Flow-ERP-Local.exe"; Flags: ignoreversion
; Environment template
Source: "..\..\.env.example"; DestDir: "{app}"; Flags: ignoreversion

; === ESSENTIAL PRISMA FILES (compile-time optional) ===
#ifexist "..\\..\\build\\query_engine-windows.dll.node"
Source: "..\..\build\query_engine-windows.dll.node"; DestDir: "{app}"; Flags: ignoreversion
#endif

; === RUNTIME PRISMA CLIENT (ensures Prisma works from installed filesystem) ===
; Copy generated Prisma client and package to real filesystem paths
; This avoids pkg snapshot resolution issues for '@prisma/client' and '.prisma/client'
; Explicitly include Prisma generated entry points to avoid missing files in hidden folder
Source: "..\\..\\node_modules\\.prisma\\client\\default.js"; DestDir: "{app}\\node_modules\\.prisma\\client"; Flags: ignoreversion
Source: "..\\..\\node_modules\\.prisma\\client\\default.d.ts"; DestDir: "{app}\\node_modules\\.prisma\\client"; Flags: ignoreversion
Source: "..\\..\\node_modules\\.prisma\\client\\index.js"; DestDir: "{app}\\node_modules\\.prisma\\client"; Flags: ignoreversion

; Include the @prisma/client package to allow requiring from filesystem
; This helps when running as a packaged binary where snapshot resolution fails
Source: "..\\..\\node_modules\\@prisma\\client\\*"; DestDir: "{app}\\node_modules\\@prisma\\client"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\\..\\node_modules\\.prisma\\client\\query_engine-windows.dll.node"; DestDir: "{app}\\node_modules\\.prisma\\client"; Flags: ignoreversion
Source: "..\\..\\node_modules\\.prisma\\client\\index.js"; DestDir: "{app}\\node_modules\\.prisma\\client"; Flags: ignoreversion
Source: "..\\..\\node_modules\\.prisma\\client\\package.json"; DestDir: "{app}\\node_modules\\.prisma\\client"; Flags: ignoreversion
; Explicitly include @prisma/client entry points to guarantee wrapper is present
Source: "..\\..\\node_modules\\@prisma\\client\\index.js"; DestDir: "{app}\\node_modules\\@prisma\\client"; Flags: ignoreversion
Source: "..\\..\\node_modules\\@prisma\\client\\package.json"; DestDir: "{app}\\node_modules\\@prisma\\client"; Flags: ignoreversion
; Include entire runtime folder required by default.js/library.js
Source: "..\\..\\node_modules\\@prisma\\client\\runtime\\*"; DestDir: "{app}\\node_modules\\@prisma\\client\\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
; Fallback copy outside node_modules to avoid pkg snapshot redirection
Source: "..\\..\\node_modules\\.prisma\\client\\*"; DestDir: "{app}\\prisma-client"; Flags: ignoreversion recursesubdirs createallsubdirs
#ifexist "..\\..\\build\\query_engine-windows.dll.node"
; Place engine library also under the expected .prisma/client folder
Source: "..\..\build\query_engine-windows.dll.node"; DestDir: "{app}\node_modules\.prisma\client"; Flags: ignoreversion
Source: "..\..\build\query_engine-windows.dll.node"; DestDir: "{app}\prisma-client"; Flags: ignoreversion
#endif
#ifexist "..\\..\\build\\seed.db"
Source: "..\..\build\seed.db"; DestDir: "{app}"; Flags: ignoreversion
#endif
; === PRISMA MIGRATIONS (for packaged binary migration runner) ===
Source: "..\\..\\prisma\\migrations\\*"; DestDir: "{app}\\prisma\\migrations"; Flags: ignoreversion recursesubdirs createallsubdirs

; === NESTJS AND CORE RUNTIME MODULES (to satisfy pkg FS resolution) ===
; Include essential NestJS modules to avoid MODULE_NOT_FOUND at runtime
Source: "..\\..\\node_modules\\@nestjs\\common\\*"; DestDir: "{app}\\node_modules\\@nestjs\\common"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\\..\\node_modules\\@nestjs\\core\\*"; DestDir: "{app}\\node_modules\\@nestjs\\core"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\\..\\node_modules\\@nestjs\\platform-express\\*"; DestDir: "{app}\\node_modules\\@nestjs\\platform-express"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\\..\\node_modules\\reflect-metadata\\*"; DestDir: "{app}\\node_modules\\reflect-metadata"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\\..\\node_modules\\rxjs\\*"; DestDir: "{app}\\node_modules\\rxjs"; Flags: ignoreversion recursesubdirs createallsubdirs

; === ERP SERVER AND MINIMAL ASSETS ===
; ERP server executable (self-contained)
Source: ".\build\erp-server.exe"; DestDir: "{app}\installers\windows"; Flags: ignoreversion
; Only essential ERP frontend files
#ifexist "..\\..\\..\\dist\\index.html"
Source: "..\..\..\dist\index.html"; DestDir: "{app}\erp\dist"; Flags: ignoreversion
Source: "..\..\..\dist\assets\*"; DestDir: "{app}\erp\dist\assets"; Flags: recursesubdirs createallsubdirs ignoreversion
; Static assets (icons, images, etc.)
Source: "..\..\..\dist\favicon.ico"; DestDir: "{app}\erp\dist"; Flags: ignoreversion
#ifexist "..\\..\\..\\dist\\robots.txt"
Source: "..\..\..\dist\robots.txt"; DestDir: "{app}\erp\dist"; Flags: ignoreversion
#endif
#endif

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na área de trabalho"; Flags: checkedonce

[Icons]
Name: "{group}\\Abrir ERP (2F System)"; Filename: "{sys}\\WindowsPowerShell\\v1.0\\powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\\open-erp.ps1"""; WorkingDir: "{app}"; Comment: "Abrir ERP"
Name: "{userdesktop}\\2F System ERP"; Filename: "{sys}\\WindowsPowerShell\\v1.0\\powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\\open-erp.ps1"""; Tasks: desktopicon; WorkingDir: "{app}"
Name: "{group}\\Desinstalar Client Local (2F System)"; Filename: "{app}\\installers\\windows\\winsw\\F-Flow-Client-Local.exe"; Parameters: "uninstall"; Comment: "Desinstalar serviço"
Name: "{group}\\Desinstalar 2F System"; Filename: "{uninstallexe}"; WorkingDir: "{app}"; Comment: "Desinstalar aplicação"

[Run]
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-Client-Local.exe"; Parameters: "install"; Flags: runhidden; StatusMsg: "Instalando serviço Client Local..."; Description: "Instalar serviço do Client Local"
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-Client-Local.exe"; Parameters: "start"; Flags: runhidden; StatusMsg: "Iniciando serviço Client Local..."; Description: "Iniciar serviço do Client Local"
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-ERP-Local.exe"; Parameters: "install"; Flags: runhidden; StatusMsg: "Instalando serviço ERP..."; Description: "Instalar serviço do ERP"
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-ERP-Local.exe"; Parameters: "start"; Flags: runhidden; StatusMsg: "Iniciando serviço ERP..."; Description: "Iniciar serviço do ERP"

[UninstallRun]
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-ERP-Local.exe"; Parameters: "stop"; Flags: runhidden; RunOnceId: "StopERP"
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-ERP-Local.exe"; Parameters: "uninstall"; Flags: runhidden; RunOnceId: "UninstallERP"
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-Client-Local.exe"; Parameters: "stop"; Flags: runhidden; RunOnceId: "StopClient"
Filename: "{app}\\installers\\windows\\winsw\\F-Flow-Client-Local.exe"; Parameters: "uninstall"; Flags: runhidden; RunOnceId: "UninstallClient"

[Code]
function CopyFile(const Source, Dest: string): Boolean;
begin
  try
    if FileExists(Dest) then DeleteFile(Dest);
    Result := FileCopy(Source, Dest, False);
  except
    Result := False;
  end;
end;

procedure WriteTextFile(const Path, Content: string);
var
  S: string;
begin
  S := Content;
  SaveStringToFile(Path, S, False);
end;

procedure WriteOpenErpLauncher();
var
  ScriptPath: string;
  Content: string;
begin
  ScriptPath := ExpandConstant('{app}\\open-erp.ps1');
  Content :=
    '$ports = @(8080,8088,8090,8082)'#13#10 +
    'foreach ($p in $ports) {'#13#10 +
    '  try {'#13#10 +
    '    $r = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$p/" -TimeoutSec 2'#13#10 +
    '    Start-Process "http://127.0.0.1:$p/erp/login"'#13#10 +
    '    break'#13#10 +
    '  } catch { }'#13#10 +
    '}'#13#10;
  SaveStringToFile(ScriptPath, Content, False);
end;

function ProgramDataRoot(): string;
begin
  Result := ExpandConstant('{commonappdata}') + '\\FFlow';
end;

function LogsRoot(): string;
begin
  Result := ProgramDataRoot() + '\\logs';
end;

procedure SetupWinSWServices();
var
  WinSwSource: string;
  ClientExe, ClientXml, ClientLogs: string;
  ErpExe, ErpXml, ErpLogs, ErpArgs: string;
begin
  // Ensure directories
  CreateDir(ExpandConstant('{app}\\installers\\windows\\winsw'));
  CreateDir(LogsRoot());
  CreateDir(LogsRoot() + '\\client-local');
  CreateDir(LogsRoot() + '\\erp');

  // Path to bundled WinSW
  WinSwSource := ExpandConstant('{app}\\installers\\windows\\winsw\\WinSW-x64.exe');

  // Client-Local service
  ClientExe := ExpandConstant('{app}\\installers\\windows\\winsw\\F-Flow-Client-Local.exe');
  // Wrapper já deve existir via [Files]; só copia se faltar
  if not FileExists(ClientExe) then begin
    if not CopyFile(WinSwSource, ClientExe) then begin
      MsgBox('Falha ao preparar WinSW para Client-Local.', mbError, MB_OK);
    end;
  end;
  ClientXml := ExpandConstant('{app}\\installers\\windows\\winsw\\F-Flow-Client-Local.xml');
  ClientLogs := LogsRoot() + '\\client-local';
  WriteTextFile(ClientXml,
    '<service>'#13#10 +
    '  <id>F-Flow-Client-Local</id>'#13#10 +
    '  <name>2F System Client Local Service</name>'#13#10 +
    '  <description>2F System - Client Local Server</description>'#13#10 +
    '  <executable>' + ExpandConstant('{app}\\f-flow-client.exe') + '</executable>'#13#10 +
    '  <arguments>--service</arguments>'#13#10 +
    '  <workingdirectory>' + ExpandConstant('{app}') + '</workingdirectory>'#13#10 +
    '  <logpath>' + ClientLogs + '</logpath>'#13#10 +
    '  <env name="PRISMA_CLIENT_ENGINE_TYPE" value="library"/>'#13#10 +
    '  <env name="PRISMA_QUERY_ENGINE_LIBRARY" value="' + ExpandConstant('{app}\\prisma-client\\query_engine-windows.dll.node') + '"/>'#13#10 +
    '  <env name="LOCAL_DATA_DIR" value="' + ExpandConstant('{app}') + '"/>'#13#10 +
    '  <env name="LOCAL_LOG_DIR" value="' + ClientLogs + '"/>'#13#10 +
    '  <env name="CLIENT_HTTP_PORT" value="8081"/>'#13#10 +
    '  <env name="NODE_ENV" value="production"/>'#13#10 +
    '  <env name="SKIP_MIGRATIONS" value="false"/>'#13#10 +
    '  <env name="LICENSING_ENFORCED" value="false"/>'#13#10 +
    '  <startmode>Automatic</startmode>'#13#10 +
    '  <stoptimeout>15000</stoptimeout>'#13#10 +
    '  <resetfailure>86400</resetfailure>'#13#10 +
    '  <onfailure>restart</onfailure>'#13#10 +
    '</service>'#13#10);

  // ERP service
  ErpExe := ExpandConstant('{app}\\installers\\windows\\winsw\\F-Flow-ERP-Local.exe');
  // Wrapper já deve existir via [Files]; só copia se faltar
  if not FileExists(ErpExe) then begin
    if not CopyFile(WinSwSource, ErpExe) then begin
      MsgBox('Falha ao preparar WinSW para ERP.', mbError, MB_OK);
    end;
  end;
  ErpXml := ExpandConstant('{app}\\installers\\windows\\winsw\\F-Flow-ERP-Local.xml');
  ErpLogs := LogsRoot() + '\\erp';
  // Use o executável principal em modo --erp-service para maior compatibilidade
  ErpArgs := '--erp-service --root "' + ExpandConstant('{app}\\erp\\dist') + '" --port 8080';
  WriteTextFile(ErpXml,
    '<service>'#13#10 +
    '  <id>F-Flow-ERP-Local</id>'#13#10 +
    '  <name>2F System ERP Local Service</name>'#13#10 +
    '  <description>2F System - ERP local (servidor estático)</description>'#13#10 +
    '  <executable>' + ExpandConstant('{app}\\f-flow-client.exe') + '</executable>'#13#10 +
    '  <arguments>' + ErpArgs + '</arguments>'#13#10 +
    '  <logpath>' + ErpLogs + '</logpath>'#13#10 +
    '  <onfailure action="restart" delay="5 sec"/>'#13#10 +
    '  <resetfailure>1 hour</resetfailure>'#13#10 +
    '</service>'#13#10);
end;

procedure WriteEnvFile();
var
  EnvPath: string;
  Content: string;
begin
  EnvPath := ExpandConstant('{app}\.env');
  Content := 'LOCAL_SERVER_ENABLED=true'#13#10 +
             'CLIENT_HTTP_PORT=8081'#13#10 +
             'HUB_BASE_URL={#HubUrl}'#13#10 +
             'DATABASE_URL="file:./local.db"'#13#10 +
             'LOCAL_DATA_DIR=' + ExpandConstant('{app}') + #13#10 +
             'LOCAL_LOG_DIR=' + ExpandConstant('{commonappdata}') + '\FFlow\logs\client-local'#13#10 +
             'PRISMA_CLIENT_ENGINE_TYPE=library'#13#10 +
             'PRISMA_QUERY_ENGINE_LIBRARY=' + ExpandConstant('{app}') + '\prisma-client\query_engine-windows.dll.node'#13#10 +
             'SKIP_MIGRATIONS=false'#13#10 +
             'NODE_ENV=production'#13#10;
  SaveStringToFile(EnvPath, Content, False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  // Run after files are installed to ensure WinSW and ERP server exist on disk
  if CurStep = ssPostInstall then begin
    WriteEnvFile();
    SetupWinSWServices();
    WriteOpenErpLauncher();
  end;
end;

// Stop existing WinSW services before files are installed to avoid access denied
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  // Stop previously installed services by name (does not depend on {app})
  // Ignore failures if services do not exist
  Exec(ExpandConstant('{sys}\sc.exe'), 'stop F-Flow-Client-Local', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\sc.exe'), 'stop F-Flow-ERP-Local', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM f-flow-client.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM erp-server.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

// Stop services automatically before uninstall to release files
function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  Exec(ExpandConstant('{sys}\\sc.exe'), 'stop F-Flow-Client-Local', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\\sc.exe'), 'stop F-Flow-ERP-Local', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\\taskkill.exe'), '/F /IM f-flow-client.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\\taskkill.exe'), '/F /IM erp-server.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;