$ErrorActionPreference = "Stop"
$raiz = $PSScriptRoot
$configuracaoLocal = Join-Path $raiz ".env.local.ps1"

if (-not (Test-Path -LiteralPath $configuracaoLocal)) {
    Write-Host "Configuracao local nao encontrada: .env.local.ps1" -ForegroundColor Red
    Write-Host "Copie .env.example.ps1 para .env.local.ps1 e preencha os valores." -ForegroundColor Yellow
    exit 1
}

. $configuracaoLocal

$variaveisObrigatorias = @("DB_USERNAME", "DB_PASSWORD", "JWT_SECRET")
foreach ($variavel in $variaveisObrigatorias) {
    if (-not (Test-Path "Env:$variavel")) {
        Write-Host "Variavel obrigatoria ausente: $variavel" -ForegroundColor Red
        exit 1
    }
}

Write-Host "=== INTELISTOCK ===" -ForegroundColor Green
Write-Host ""

# ================================================================
# BACK-END - Java / Spring Boot / PostgreSQL
# ================================================================
$backend = Join-Path $raiz "intellistock-backend"

$backendComando = @"
Set-Location '$backend'
Write-Host 'BACK-END: http://localhost:8080' -ForegroundColor Cyan
& '.\mvnw.cmd' spring-boot:run '-Dspring-boot.run.profiles=dev'
"@

Write-Host "Iniciando BACK-END em uma nova janela..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendComando

# ================================================================
# FRONT-END - React Native / Expo
# ================================================================
$frontend = Join-Path $raiz "mobile"
Set-Location $frontend

if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "FRONT-END: instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host "FRONT-END: iniciando Expo..." -ForegroundColor Magenta
npm start -- --clear
