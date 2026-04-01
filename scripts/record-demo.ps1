# Demonstracao completa em WebM: todas as telas, scroll suave, hover/focus/highlight, viewport HiDPI.
# Requer: npm i -g agent-browser, ffmpeg no PATH, app em http://localhost:5173 (e API via proxy).
$ErrorActionPreference = "Continue"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Timeouts maiores (gravacao longa; headed desligado — evita DOM atrasado no admin)
$env:AGENT_BROWSER_DEFAULT_TIMEOUT = "120000"

$base = "http://localhost:5173"
$video = Join-Path $PSScriptRoot "..\recordings\demo-mercagro.webm"
$dir = Split-Path $video
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function Show { param([int]$ms) agent-browser wait $ms }

function Invoke-DemoEvalFile([string]$name) {
  $path = Join-Path $PSScriptRoot $name
  $code = (Get-Content $path -Raw -Encoding UTF8) -replace "`r`n", " " -replace "`n", " "
  return (& agent-browser eval $code 2>&1 | Out-String).Trim()
}

function Invoke-SlowScroll {
  param([int]$Steps = 6, [int]$Pixels = 360, [int]$PauseMs = 950)
  for ($s = 0; $s -lt $Steps; $s++) {
    agent-browser scroll down $Pixels
    Show $PauseMs
  }
}

function Visit-Open {
  param([string]$Url, [int]$AfterMs = 3200)
  agent-browser open $Url
  # networkidle em SPA + Supabase costuma nunca completar — trava a gravacao na tela de login
  agent-browser wait 2200
  Show $AfterMs
}

function Invoke-LogoutMenu {
  agent-browser eval "(()=>{const b=[...document.querySelectorAll('header nav button')].find(x=>{const t=(x.innerText||'').trim();return t.length>=1&&t.length<=3});if(b)b.click()})()"
  Show 800
  agent-browser eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Sair');if(b)b.click()})()"
  agent-browser wait 3500
}

function Escape-JsSingle([string]$s) {
  if ($null -eq $s) { return '' }
  return $s.Replace('\', '\\').Replace("'", "\'")
}

function Invoke-LoginPolished {
  param([string]$Email, [string]$Password)
  Show 2800
  $tpl = Get-Content (Join-Path $PSScriptRoot "demo-login-react.js") -Raw -Encoding UTF8
  $code = $tpl.Replace('USER_EMAIL', (Escape-JsSingle $Email)).Replace('USER_PASSWORD', (Escape-JsSingle $Password))
  $code = $code -replace "`r`n", " " -replace "`n", " "
  $r = (& agent-browser eval $code 2>&1 | Out-String).Trim()
  if ($r -notmatch 'ok') {
    Write-Warning "Login eval: $r — tentando fallback por refs"
    agent-browser snapshot -i
    agent-browser fill '@e10' $Email
    Show 400
    agent-browser fill '@e11' $Password
    Show 400
    agent-browser click '@e12'
  }
  # Auth + redirect (evitar wait --url que pode dar timeout CDP 10060 com Supabase)
  agent-browser wait 7000
  $u = ((agent-browser get url) | Out-String).Trim()
  if ($u -match '/login') {
    agent-browser wait 12000
  }
  Show 3200
}

function Invoke-AdminTabByIndex([int]$Index) {
  $tpl = Get-Content (Join-Path $PSScriptRoot "admin-click-tab.js") -Raw -Encoding UTF8
  $code = ($tpl -replace '__INDEX__', $Index.ToString()) -replace "`r`n", " " -replace "`n", " "
  agent-browser eval $code
}

function Get-PageUrl {
  return ((agent-browser get url) | Out-String).Trim()
}

function Invoke-FindHover([string]$Text) {
  try { agent-browser find text "$Text" hover } catch { }
  Show 1000
}

function Invoke-FindClick([string]$Text) {
  try { agent-browser find text "$Text" click } catch { }
  Show 600
}


agent-browser close 2>$null

agent-browser record start $video
# 1920x1080 @2x = mais pixels no video (melhor nitidez)
agent-browser set viewport 1920 1080 2

# ----- 1. Home: scroll completo + hover nos CTAs + ir a Equipamentos pelo botao -----
Visit-Open "$base/" 4000
Invoke-SlowScroll -Steps 8 -Pixels 400 -PauseMs 1000
Show 2200
Invoke-FindHover "Buscar Equipamentos"
Invoke-FindClick "Buscar Equipamentos"
agent-browser wait 2500
Show 2000
$uEq = Get-PageUrl
if ($uEq -notmatch '/equipment') {
  Visit-Open "$base/equipment" 4500
} else {
  Show 3500
}
Invoke-SlowScroll -Steps 5
Show 2000

# ----- 2. Detalhe do primeiro equipamento (so volta se abriu detalhe) -----
Show 2000
Show 5000
$eqClick = Invoke-DemoEvalFile "demo-click-first-card.js"
Show 2200
if ($eqClick -match 'ok') {
  agent-browser wait 3500
  Show 5500
  Invoke-SlowScroll -Steps 7 -Pixels 380 -PauseMs 1100
  Show 2800
  agent-browser back
  agent-browser wait 3000
  Show 3500
} else {
  Show 3500
}

# ----- 3. Lista de leiloes + detalhe -----
Visit-Open "$base/auctions" 4000
Invoke-SlowScroll -Steps 5
Show 2000
Show 4000
$aucClick = Invoke-DemoEvalFile "demo-click-first-card.js"
Show 2200
if ($aucClick -match 'ok') {
  agent-browser wait 3500
  Show 5500
  Invoke-SlowScroll -Steps 7
  Show 2800
  agent-browser back
  agent-browser wait 3000
  Show 3500
} else {
  Show 3500
}

# ----- 4. Cadastro (scroll formulario) -----
Visit-Open "$base/register" 4000
Invoke-SlowScroll -Steps 9 -Pixels 350 -PauseMs 1000
Show 3000

# ----- 5. Login usuario (React: demo-login-react.js + espera redirect) -----
Visit-Open "$base/login" 3500
Invoke-LoginPolished -Email "usuario@mercagro.com" -Password "User@123456"

# ----- 6. Painel (apos login o router vai ao dashboard) -----
Visit-Open "$base/dashboard" 4500
Invoke-SlowScroll -Steps 4
Show 2500
Show 1500
Invoke-DemoEvalFile "demo-focus-dashboard-card.js" | Out-Null
Show 2500

# ----- 7. Onboarding -----
Visit-Open "$base/onboarding" 4500
Invoke-SlowScroll -Steps 8
Show 3000

# ----- 8. Perfil -----
Visit-Open "$base/profile" 4500
Invoke-SlowScroll -Steps 6
Show 3000

# ----- 9. Minhas locacoes -----
Visit-Open "$base/my-rentals" 4500
Invoke-SlowScroll -Steps 7
Show 3000

# ----- 10. Meus equipamentos + Editar (se existir) -----
Visit-Open "$base/my-equipment" 4500
Invoke-SlowScroll -Steps 5
Show 2000
Invoke-DemoEvalFile "demo-click-editar.js" | Out-Null
Show 2500
agent-browser wait 4000
Show 5000
$uEdit = Get-PageUrl
if ($uEdit -match '/equipment/[^/]+/edit') {
  Invoke-SlowScroll -Steps 6
  Show 3500
  agent-browser back
  agent-browser wait 3000
  Show 3500
}

# ----- 11. Novo equipamento -----
Visit-Open "$base/equipment/new" 4500
Invoke-SlowScroll -Steps 9
Show 3500

# ----- 12. Catalogo logado + detalhe -----
Visit-Open "$base/equipment" 4000
Invoke-SlowScroll -Steps 4
Show 2000
Show 5000
$eq2 = Invoke-DemoEvalFile "demo-click-first-card.js"
Show 2200
if ($eq2 -match 'ok') {
  agent-browser wait 3500
  Show 5500
  Invoke-SlowScroll -Steps 6
  Show 2800
  agent-browser back
  agent-browser wait 3000
  Show 3500
} else {
  Show 3500
}

# ----- 13. Leiloes de novo (reforco) -----
Visit-Open "$base/auctions" 3500
Invoke-SlowScroll -Steps 3
Show 2000

# ----- 14. Logout usuario -----
Visit-Open "$base/dashboard" 4000
Invoke-SlowScroll -Steps 3
Show 2500
Invoke-LogoutMenu
Show 3500

# ----- 15. Login admin -----
Visit-Open "$base/login" 3500
Invoke-LoginPolished -Email "admin@mercagro.com" -Password "Admin@123456"

# ----- 16. Painel admin (aguarda perfil — sem abas enquanto "Carregando...") -----
Visit-Open "$base/admin" 5000
agent-browser wait 3000
Show 15000
Invoke-SlowScroll -Steps 3
Show 4000

for ($ti = 0; $ti -le 5; $ti++) {
  Invoke-AdminTabByIndex -Index $ti
  agent-browser wait 3500
  Show 3500
  Invoke-SlowScroll -Steps 7 -Pixels 370 -PauseMs 1000
  Show 3000
}

Show 3500
Invoke-LogoutMenu
Show 4000

agent-browser record stop
agent-browser close

Write-Host "Gravacao concluida: $video"
