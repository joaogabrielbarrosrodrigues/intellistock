# Copie este arquivo para .env.local.ps1 e preencha apenas no seu computador.
# O arquivo .env.local.ps1 e ignorado pelo Git.
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "troque-pela-senha-local"
$env:DB_URL = "jdbc:postgresql://localhost:5432/intellistock"
$env:JWT_SECRET = "troque-por-um-segredo-local-com-no-minimo-32-caracteres"
# Escolha um codigo privado e informe-o somente a quem pode criar conta.
$env:CODIGO_CADASTRO = "escolha-um-codigo-de-acesso"
