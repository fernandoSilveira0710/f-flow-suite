$ErrorActionPreference = 'SilentlyContinue'

try {
  Start-Process "http://localhost:8080/erp/login"
} catch {
  # Fallback: usar cmd start
  Start-Process cmd.exe -ArgumentList "/c start http://localhost:8080/erp/login" -WindowStyle Hidden
}