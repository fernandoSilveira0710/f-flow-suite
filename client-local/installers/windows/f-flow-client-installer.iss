; Inno Setup Script for F-Flow Client Local (Windows)
; Creates installer that installs service, writes .env, and adds desktop shortcut

#define AppName "F-Flow Client Local"
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef ClientBinary
  #define ClientBinary "client-local\\build\\f-flow-client-win32-x64.exe"
#endif
#ifndef ERPUrl
  #define ERPUrl "https://erp.f-flow.com"
#endif
#ifndef HubUrl
  #define HubUrl "https://hub.f-flow.com"
#endif

[Setup]
AppName={#AppName}
AppVersion={#AppVersion}
DefaultDirName={pf}\\F-Flow\\ClientLocal
DefaultGroupName=F-Flow Suite
OutputDir=.\\build\\installer
OutputBaseFilename=f-flow-client-win-installer
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64
Compression=lzma
SolidCompression=yes
WizardStyle=modern
DisableDirPage=no

[Files]
Source: "{#ClientBinary}"; DestDir: "{app}"; DestName: "f-flow-client.exe"; Flags: ignoreversion
Source: "..\\install-windows.ps1"; DestDir: "{app}\\installers"; Flags: ignoreversion
Source: "..\\uninstall-windows.ps1"; DestDir: "{app}\\installers"; Flags: ignoreversion
Source: "..\\..\\.env.example"; DestDir: "{app}"; Flags: ignoreversion

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na área de trabalho"; Flags: checkedonce

[Icons]
Name: "{group}\\Abrir ERP"; Filename: "{cmd}"; Parameters: "/c start {#ERPUrl}"; WorkingDir: "{app}"; Comment: "Abrir ERP"
Name: "{userdesktop}\\F-Flow ERP"; Filename: "{cmd}"; Parameters: "/c start {#ERPUrl}"; Tasks: desktopicon; WorkingDir: "{app}"
Name: "{group}\\Desinstalar Client Local"; Filename: "{sys}\\WindowsPowerShell\\v1.0\\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\\installers\\uninstall-windows.ps1"""; Comment: "Desinstalar serviço"

[Run]
Filename: "{sys}\\WindowsPowerShell\\v1.0\\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\\installers\\install-windows.ps1"" -BinaryPath ""{app}\\f-flow-client.exe"""; Flags: runhidden; StatusMsg: "Instalando serviço..."; Description: "Instalar serviço do Client Local"

[Code]
procedure WriteEnvFile();
var
  EnvPath: string;
  Content: string;
begin
  EnvPath := ExpandConstant('{app}\\.env');
  Content := 'LOCAL_SERVER_ENABLED=true'#13#10 +
             'CLIENT_HTTP_PORT=8081'#13#10 +
             'HUB_BASE_URL={#HubUrl}'#13#10 +
             'DATABASE_URL="file:./local.db"'#13#10 +
             'LOCAL_DATA_DIR={app}'#13#10 +
             'LOCAL_LOG_DIR={app}\\logs'#13#10;
  SaveStringToFile(EnvPath, Content, False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then begin
    WriteEnvFile();
  end;
end;