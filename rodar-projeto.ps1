$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
$configuracao = Join-Path $raiz '.env.local.ps1'
$backend = Join-Path $raiz 'intellistock-backend'
$mobile = Join-Path $raiz 'mobile'
$logs = Join-Path $raiz '.logs'

if (-not (Test-Path -LiteralPath $configuracao)) {
    throw 'Crie .env.local.ps1 a partir de .env.example.ps1 e preencha as configuracoes.'
}
. $configuracao
if ([string]::IsNullOrWhiteSpace($env:CODIGO_CADASTRO)) {
    throw 'Defina CODIGO_CADASTRO em .env.local.ps1 antes de iniciar o projeto.'
}
if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
    throw 'A porta 8080 ja esta em uso. Encerre a API anterior antes de iniciar.'
}

New-Item -ItemType Directory -Force -Path $logs | Out-Null
$processoApi = $null
try {
    if (-not (Test-Path -LiteralPath (Join-Path $mobile 'node_modules'))) {
        Push-Location $mobile
        try {
            & npm.cmd ci
            if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel instalar as dependencias do aplicativo.' }
        } finally { Pop-Location }
    }

    $processoApi = Start-Process -FilePath (Join-Path $backend 'mvnw.cmd') `
        -ArgumentList 'spring-boot:run', '-Dspring-boot.run.profiles=dev' `
        -WorkingDirectory $backend -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $logs 'backend.log') `
        -RedirectStandardError (Join-Path $logs 'backend-error.log')

    Write-Host 'Iniciando a API. Consulte .logs/backend.log se houver alguma falha.'
    $pronta = $false
    for ($tentativa = 0; $tentativa -lt 120; $tentativa++) {
        $processoApi.Refresh()
        if ($processoApi.HasExited) { break }
        try {
            $resposta = Invoke-WebRequest -Uri 'http://localhost:8080/api/auth/login' -Method Get -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            $pronta = $true
        } catch {
            if ($_.Exception.Response) { $pronta = $true }
        }
        if ($pronta) { break }
        Start-Sleep -Seconds 1
    }
    if (-not $pronta) { throw 'A API nao iniciou. Consulte .logs/backend.log e .logs/backend-error.log.' }

    Write-Host 'API iniciada. Abrindo o Expo; pressione Ctrl+C para encerrar.'
    Push-Location $mobile
    try { & npx.cmd expo start } finally { Pop-Location }
} finally {
    if ($processoApi) {
        $processoApi.Refresh()
        if (-not $processoApi.HasExited) {
            & taskkill.exe /PID $processoApi.Id /T /F 2>$null | Out-Null
        }
    }
}
