$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot
npm run dev -- --hostname 127.0.0.1 --port 3000
