# Teste rapido: abre /login, submete credenciais de usuario, verifica URL no dashboard.
# Uso: .\validate-demo-login.ps1
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$base = "http://localhost:5173"
function Escape-JsSingle([string]$s) {
  if ($null -eq $s) { return '' }
  return $s.Replace('\', '\\').Replace("'", "\'")
}

function Invoke-LoginEval([string]$Email, [string]$Password) {
  $path = Join-Path $PSScriptRoot "demo-login-react.js"
  $raw = Get-Content $path -Raw -Encoding UTF8
  $code = $raw.Replace('USER_EMAIL', (Escape-JsSingle $Email)).Replace('USER_PASSWORD', (Escape-JsSingle $Password))
  $code = $code -replace "`r`n", " " -replace "`n", " "
  agent-browser eval $code
}

agent-browser close 2>$null
agent-browser open "$base/login"
agent-browser wait 2500
Write-Host "Antes do login:" (agent-browser get url)
$r = Invoke-LoginEval -Email "usuario@mercagro.com" -Password "User@123456"
Write-Host "Eval:" $r
agent-browser wait 8000
Write-Host "Depois:" (agent-browser get url)
agent-browser close
Write-Host "OK se URL contiver /dashboard"
