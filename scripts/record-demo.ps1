# Grava video de demonstracao (WebM). Requer: npm i -g agent-browser, ffmpeg no PATH, app em localhost:5173 + API.
$ErrorActionPreference = "Continue"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$base = "http://localhost:5173"
$video = Join-Path $PSScriptRoot "..\recordings\demo-mercagro.webm"
$dir = Split-Path $video
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function Show { param([int]$ms) agent-browser wait $ms }

function Invoke-LogoutEval {
  agent-browser eval "(()=>{const b=[...document.querySelectorAll('header nav button')].find(x=>{const t=(x.innerText||'').trim();return t.length>=1&&t.length<=3});if(b)b.click()})()"
  Show 600
  agent-browser eval "(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Sair');if(b)b.click()})()"
  agent-browser wait --load networkidle
}

function Invoke-AdminTabByIndex([int]$Index) {
  $tpl = Get-Content (Join-Path $PSScriptRoot "admin-click-tab.js") -Raw -Encoding UTF8
  $code = ($tpl -replace '__INDEX__', $Index.ToString()) -replace "`r`n", " " -replace "`n", " "
  agent-browser eval $code
}

agent-browser close 2>$null

agent-browser record start $video
agent-browser set viewport 1920 1080

# Home
agent-browser open "$base/"
agent-browser wait --load networkidle
Show 2800
agent-browser scroll down 550
Show 1800

agent-browser open "$base/equipment"
agent-browser wait --load networkidle
Show 2800

agent-browser open "$base/auctions"
agent-browser wait --load networkidle
Show 2800

agent-browser open "$base/register"
agent-browser wait --load networkidle
Show 2200

# Login usuario (snapshot obrigatorio para refs)
agent-browser open "$base/login"
agent-browser wait --load networkidle
Show 1500
agent-browser snapshot -i
agent-browser fill '@e10' "usuario@mercagro.com"
Show 400
agent-browser fill '@e11' "User@123456"
Show 400
agent-browser click '@e12'
agent-browser wait --load networkidle
Show 3500

foreach ($p in @('/profile','/my-rentals','/my-equipment','/dashboard')) {
  agent-browser open "$base$p"
  agent-browser wait --load networkidle
  Show 2400
}

agent-browser open "$base/equipment"
agent-browser wait --load networkidle
Show 2200

agent-browser open "$base/auctions"
agent-browser wait --load networkidle
Show 2200

agent-browser open "$base/dashboard"
agent-browser wait --load networkidle
Show 1500
Invoke-LogoutEval
Show 2000

# Login admin
agent-browser open "$base/login"
agent-browser wait --load networkidle
Show 1500
agent-browser snapshot -i
agent-browser fill '@e10' "admin@mercagro.com"
Show 400
agent-browser fill '@e11' "Admin@123456"
Show 400
agent-browser click '@e12'
agent-browser wait --load networkidle
Show 3000

agent-browser open "$base/admin"
agent-browser wait --load networkidle
Show 3500

for ($ti = 0; $ti -le 5; $ti++) {
  Invoke-AdminTabByIndex -Index $ti
  agent-browser wait --load networkidle
  Show 2600
}

Show 2000
Invoke-LogoutEval
Show 2500

agent-browser record stop
agent-browser close

Write-Host "Concluido: $video"
