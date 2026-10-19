param(
    [string]$ApiUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$ApiUrl = $ApiUrl.TrimEnd('/')

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $params = @{
        Method = $Method
        Uri = "$ApiUrl$Path"
        Headers = $Headers
        ContentType = "application/json"
    }
    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 8)
    }
    try {
        Invoke-RestMethod @params
    } catch {
        $responseBody = $null
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Dispose()
        }
        $bodyText = if ($null -eq $params.Body) { "<sem corpo>" } else { $params.Body }
        throw "Falha HTTP $Method $Path ($($_.Exception.Response.StatusCode)): $responseBody`nCorpo enviado: $bodyText"
    }
}

Write-Host "Verificando o backend em $ApiUrl..." -ForegroundColor Cyan

$email = "teste@intellistock.local"
$senha = "Teste123!"
$login = $null
try {
    $login = Invoke-Api -Method Post -Path "/api/auth/login" -Body @{ email = $email; senha = $senha }
} catch {
    Write-Host "Usuário de teste não encontrado; criando..." -ForegroundColor Yellow
    $null = Invoke-Api -Method Post -Path "/api/auth/register" -Body @{ nome = "Usuário de Teste"; email = $email; senha = $senha }
    $login = Invoke-Api -Method Post -Path "/api/auth/login" -Body @{ email = $email; senha = $senha }
}

$headers = @{ Authorization = "Bearer $($login.token)" }
Write-Host "Autenticado como $email" -ForegroundColor Green

$fornecedores = @(Invoke-Api -Method Get -Path "/api/fornecedores" -Headers $headers)
$supplierData = @(
    @{ nome = "Distribuidora Central"; cnpj = $null; telefone = "11999990001"; email = "central@teste.local" },
    @{ nome = "Fornecedor Naturalis"; cnpj = $null; telefone = "11999990002"; email = "naturalis@teste.local" },
    @{ nome = "Embalagens Brasil"; cnpj = $null; telefone = "11999990003"; email = "embalagens@teste.local" }
)

foreach ($data in $supplierData) {
    $fornecedor = $fornecedores | Where-Object { $_.nome -eq $data.nome } | Select-Object -First 1
    if ($null -eq $fornecedor) {
        $fornecedor = Invoke-Api -Method Post -Path "/api/fornecedores" -Body $data -Headers $headers
        $fornecedores += $fornecedor
        Write-Host "Fornecedor criado: $($data.nome)" -ForegroundColor Green
    }
}

$central = ($fornecedores | Where-Object nome -eq "Distribuidora Central" | Select-Object -First 1).id
$naturalis = ($fornecedores | Where-Object nome -eq "Fornecedor Naturalis" | Select-Object -First 1).id
$embalagens = ($fornecedores | Where-Object nome -eq "Embalagens Brasil" | Select-Object -First 1).id

$produtos = @(Invoke-Api -Method Get -Path "/api/produtos?incluirInativos=true" -Headers $headers)
$productData = @(
    @{ nome = "Arroz tipo 1 - Dados Teste"; descricao = "Produto para testar estoque e consumo"; quantidadeInicial = 120; estoqueMinimo = 40; unidadeMedida = "KG"; preco = 6.50; fornecedorId = $central },
    @{ nome = "Caixa de leite - Dados Teste"; descricao = "Produto vendido por unidade"; quantidadeInicial = 80; estoqueMinimo = 20; unidadeMedida = "UN"; preco = 5.90; fornecedorId = $central },
    @{ nome = "Detergente neutro - Dados Teste"; descricao = "Produto liquido para testar litros"; quantidadeInicial = 60; estoqueMinimo = 15; unidadeMedida = "L"; preco = 8.75; fornecedorId = $naturalis },
    @{ nome = "Caixa de copos - Dados Teste"; descricao = "Produto vendido em caixas"; quantidadeInicial = 35; estoqueMinimo = 10; unidadeMedida = "CX"; preco = 42.00; fornecedorId = $embalagens },
    @{ nome = "Agua mineral - Dados Teste"; descricao = "Produto com unidade em mililitros"; quantidadeInicial = 1500; estoqueMinimo = 500; unidadeMedida = "ML"; preco = 0.01; fornecedorId = $naturalis }
)

$createdProducts = @{}
foreach ($data in $productData) {
    $produto = $produtos | Where-Object { $_.nome -eq $data.nome } | Select-Object -First 1
    if ($null -eq $produto) {
        $produto = Invoke-Api -Method Post -Path "/api/produtos" -Body $data -Headers $headers
        $produtos += $produto
        Write-Host "Produto criado: $($data.nome)" -ForegroundColor Green
    }
    $createdProducts[$data.nome] = $produto
}

$today = [DateTimeOffset]::Now
foreach ($data in $productData) {
    $produto = $createdProducts[$data.nome]
    $movimentacoes = @(Invoke-Api -Method Get -Path "/api/movimentacoes?produtoId=$($produto.id)&limite=1000" -Headers $headers)
    if ($movimentacoes | Where-Object { $_.observacao -like "Dados de teste*" }) {
        continue
    }

    $quantidadeSaida = switch ($data.unidadeMedida) {
        "KG" { 12 }
        "UN" { 9 }
        "L"  { 7 }
        "CX" { 4 }
        "ML" { 150 }
    }

    foreach ($monthsAgo in 3, 2, 1) {
        $date = $today.AddMonths(-$monthsAgo).Date.AddHours(10)
        $body = @{
            produtoId = $produto.id
            tipo = "SAIDA"
            quantidade = $quantidadeSaida
            data = $date.ToString("yyyy-MM-ddTHH:mm:sszzz")
            observacao = "Dados de teste - consumo mensal"
        }
        $null = Invoke-Api -Method Post -Path "/api/movimentacoes" -Body $body -Headers $headers
    }
    Write-Host "Movimentações criadas: $($data.nome)" -ForegroundColor Green
}

$contas = @(Invoke-Api -Method Get -Path "/api/contas" -Headers $headers)
$contaData = @(
    @{ fornecedorId = $central; descricao = "Boleto de arroz - Dados Teste"; valor = 780.00; dataVencimento = $today.AddDays(7).ToString("yyyy-MM-dd"); observacao = "Conta em aberto para teste" },
    @{ fornecedorId = $naturalis; descricao = "Produtos de limpeza - Dados Teste"; valor = 420.50; dataVencimento = $today.AddDays(-5).ToString("yyyy-MM-dd"); observacao = "Conta vencida para teste" },
    @{ fornecedorId = $embalagens; descricao = "Embalagens pagas - Dados Teste"; valor = 315.00; dataVencimento = $today.AddDays(-12).ToString("yyyy-MM-dd"); observacao = "Conta paga para teste" }
)

foreach ($data in $contaData) {
    $conta = $contas | Where-Object { $_.descricao -eq $data.descricao } | Select-Object -First 1
    if ($null -eq $conta) {
        $conta = Invoke-Api -Method Post -Path "/api/contas" -Body $data -Headers $headers
        $contas += $conta
        Write-Host "Conta criada: $($data.descricao)" -ForegroundColor Green
    }
    if ($data.descricao -eq "Embalagens pagas - Dados Teste" -and $conta.status -eq "ABERTA") {
        $null = Invoke-Api -Method Patch -Path "/api/contas/$($conta.id)/pagar" -Body @{ dataPagamento = $today.ToString("yyyy-MM-dd") } -Headers $headers
    }
}

Write-Host "`nDados de teste carregados com sucesso." -ForegroundColor Green
Write-Host "Usuário: $email" -ForegroundColor Cyan
Write-Host "Senha: $senha" -ForegroundColor Cyan
Write-Host "Agora abra o Dashboard, Estoque, Análises e Contas a pagar." -ForegroundColor Cyan
