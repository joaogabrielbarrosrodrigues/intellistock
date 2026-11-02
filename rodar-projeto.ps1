$ErrorActionPreference = "Stop"

$configuracao = Join-Path $PSScriptRoot ".env.local.ps1"
if (-not (Test-Path -LiteralPath $configuracao)) {
    throw "Crie .env.local.ps1 a partir de .env.example.ps1 e preencha os valores."
}
. $configuracao

foreach ($nome in "DB_USERNAME", "DB_PASSWORD", "JWT_SECRET") {
    if (-not (Get-Item "Env:$nome" -ErrorAction SilentlyContinue).Value) {
        throw "Preencha $nome em .env.local.ps1."
    }
}

$mobile = Join-Path $PSScriptRoot "mobile"
if (-not (Test-Path (Join-Path $mobile "node_modules"))) {
    Push-Location $mobile
    try { npm install; if ($LASTEXITCODE -ne 0) { throw "npm install falhou." } }
    finally { Pop-Location }
}

if (-not $env:EXPO_PUBLIC_API_URL) {
    $ip = Get-NetIPConfiguration |
        Where-Object { $_.NetAdapter.Status -eq "Up" -and $_.IPv4DefaultGateway } |
        ForEach-Object { $_.IPv4Address.IPAddress } |
        Where-Object { $_ -and $_ -notmatch "^169\.254\." } |
        Select-Object -First 1
    if (-not $ip) { throw "Defina EXPO_PUBLIC_API_URL com o IP do computador para acessar pelo celular." }
    $env:EXPO_PUBLIC_API_URL = "http://${ip}:8080"
}

$backend = Join-Path $PSScriptRoot "intellistock-backend"
Write-Host "Iniciando backend em outra janela e Expo nesta janela."
Write-Host "API para o celular: $env:EXPO_PUBLIC_API_URL"
Start-Process powershell.exe -WorkingDirectory $backend -ArgumentList @(
    "-NoExit", "-Command", "& '.\mvnw.cmd' spring-boot:run '-Dspring-boot.run.profiles=dev'"
)

Set-Location $mobile
npm start -- --lan --clear
