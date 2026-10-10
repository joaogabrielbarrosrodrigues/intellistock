from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "relatorio-backend-intellistock.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(2 * cm, 1.2 * cm, "InteliStock - Relatorio de desenvolvimento do backend")
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Pagina {doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="TitleCenter",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=28,
        textColor=colors.HexColor("#101828"),
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="SubtitleCenter",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=11,
        leading=16,
        textColor=colors.HexColor("#475467"),
        spaceAfter=22,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#175CD3"),
        spaceBefore=12,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="Body",
        parent=styles["BodyText"],
        fontSize=9.8,
        leading=14,
        textColor=colors.HexColor("#344054"),
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="ReportBullet",
        parent=styles["Body"],
        leftIndent=14,
        bulletIndent=4,
        spaceAfter=4,
    )
)
styles.add(
    ParagraphStyle(
        name="ReportCode",
        parent=styles["Body"],
        fontName="Courier",
        fontSize=8.5,
        leading=12,
        backColor=colors.HexColor("#F2F4F7"),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=8,
    )
)


def section(title):
    return Paragraph(title, styles["Section"])


def body(text):
    return Paragraph(text, styles["Body"])


def bullet(text):
    return Paragraph(text, styles["ReportBullet"], bulletText="-")


def code(text):
    return Paragraph(text.replace("\n", "<br/>"), styles["ReportCode"])


story = []
story.append(Paragraph("Relatorio do Backend InteliStock", styles["TitleCenter"]))
story.append(
    Paragraph(
        "Resumo do que foi implementado e das proximas etapas do projeto. Data: 10/10/2026.",
        styles["SubtitleCenter"],
    )
)

story.append(section("1. Visao geral"))
story.append(
    body(
        "Foi concluida a primeira entrega funcional do Modulo A, focada em usuarios e autenticacao. "
        "O backend estava em uma fase inicial, com entidade User, repository e service basico. "
        "A partir disso, foram adicionadas camadas de controller, DTO, security, config e exception, "
        "mantendo a estrutura do pacote raiz br.com.intellistock.intellistock_backend."
    )
)

summary_data = [
    ["Area", "Status", "Observacao"],
    ["Usuarios", "Parcialmente concluido", "Cadastro, login e consulta do usuario autenticado foram implementados."],
    ["Seguranca", "Parcialmente concluido", "BCrypt, JWT e protecao padrao dos endpoints foram adicionados."],
    ["Produtos", "Pendente", "CRUD de produtos ainda precisa ser implementado."],
    ["Estoque", "Pendente", "Entradas, saidas e historico ainda precisam ser implementados."],
    ["Fornecedores", "Pendente", "Modulo ainda nao iniciado."],
    ["Contas a pagar", "Pendente", "Modulo ainda nao iniciado."],
    ["Indicadores", "Pendente", "Calculos de consumo e reposicao ainda nao iniciados."],
]
table = Table(summary_data, colWidths=[4 * cm, 4 * cm, 8.2 * cm])
table.setStyle(
    TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#175CD3")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("LEADING", (0, 0), (-1, -1), 11),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D0D5DD")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]
    )
)
story.append(table)

story.append(section("2. O que foi implementado"))
for item in [
    "Cadastro de usuarios via POST /api/auth/register.",
    "Login via POST /api/auth/login retornando token JWT.",
    "Endpoint protegido GET /api/users/me para consultar o usuario autenticado.",
    "Hash de senha com BCrypt, evitando armazenamento em texto puro.",
    "DTOs de entrada e saida para evitar expor a entidade diretamente.",
    "Resposta de usuario sem senha e sem hash de senha.",
    "Validacoes com Bean Validation para nome, e-mail e senha.",
    "Tratamento centralizado de erros para validacao, conflito, nao encontrado e credenciais invalidas.",
    "Spring Security configurado em modo stateless.",
    "Filtro JWT para autenticar requisicoes com Authorization: Bearer.",
    "Configuracao de segredo e expiracao do JWT por variaveis de ambiente.",
    "Teste de contexto ajustado para usar H2 em memoria, sem depender do PostgreSQL local.",
]:
    story.append(bullet(item))

story.append(section("3. Arquivos criados ou alterados"))
for item in [
    "pom.xml - adicionadas dependencias de Spring Security e H2 em escopo de teste.",
    "application.properties - adicionadas configuracoes app.jwt.secret e app.jwt.expiration-minutes.",
    "entity/User.java - adicionadas constraints JPA, e-mail unico e campo createdAt.",
    "repository/UserRepository.java - adicionada busca por e-mail.",
    "service/UserService.java - cadastro com validacao de duplicidade e BCrypt.",
    "service/AuthService.java - login, autenticacao e geracao de token.",
    "controller/AuthController.java - endpoints de cadastro e login.",
    "controller/UserController.java - endpoint /api/users/me.",
    "dto/* - requests, responses e formato de erro.",
    "security/* - servico JWT e filtro de autenticacao.",
    "config/SecurityConfig.java - cadeia de seguranca e beans de autenticacao.",
    "exception/* - excecoes de negocio e handler global.",
    "IntellistockBackendApplicationTests.java - configurado para H2 em memoria.",
]:
    story.append(bullet(item))

story.append(section("4. Como testar agora"))
story.append(code("cd intellistock-backend\nmvn test"))
story.append(body("Resultado validado: BUILD SUCCESS, com 1 teste executado e 0 falhas."))
story.append(code("mvn spring-boot:run"))
story.append(
    body(
        "Para rodar conectado ao PostgreSQL local, configure DB_PASSWORD e, preferencialmente, JWT_SECRET. "
        "O banco esperado continua sendo intellistock."
    )
)

story.append(section("5. Endpoints disponiveis"))
story.append(code("POST /api/auth/register\nPOST /api/auth/login\nGET  /api/users/me"))
story.append(body("Exemplo de cadastro:"))
story.append(code('{\n  "nome": "Joao Gabriel",\n  "email": "joao@example.com",\n  "senha": "senha1234"\n}'))
story.append(body("Exemplo de login:"))
story.append(code('{\n  "email": "joao@example.com",\n  "senha": "senha1234"\n}'))
story.append(body("Para endpoints protegidos:"))
story.append(code("Authorization: Bearer seu_token_jwt"))

story.append(PageBreak())
story.append(section("6. O que ainda precisa ser feito"))
for item in [
    "Criar testes especificos para cadastro, login, e-mail duplicado, senha invalida e acesso protegido.",
    "Melhorar o retorno de requisicoes sem token ou com token invalido para JSON padronizado.",
    "Adicionar roles/perfis de usuario caso o projeto precise diferenciar administrador e usuario comum.",
    "Avaliar uma biblioteca JWT dedicada, caso a equipe queira recursos extras como claims mais ricas e rotacao de chave.",
    "Implementar Modulo B: entidade Produto, repository, service, DTOs, controller e validacoes.",
    "Implementar Modulo C: movimentacoes de estoque com entrada, saida, historico e transacoes.",
    "Implementar controle de concorrencia em estoque para evitar saidas inconsistentes.",
    "Implementar Modulo D: fornecedores.",
    "Implementar Modulo E: contas a pagar, status e filtros por vencimento, fornecedor e situacao.",
    "Implementar Modulo F: indicadores de consumo, estoque baixo, tendencias e sugestoes configuraveis.",
    "Atualizar README com documentacao dos endpoints assim que o encoding do arquivo for normalizado.",
    "Criar uma colecao Postman ou arquivo equivalente para facilitar testes manuais da API.",
]:
    story.append(bullet(item))

story.append(section("7. Pendencias e decisoes de negocio"))
for item in [
    "Definir se produto tera exclusao fisica ou logica.",
    "Definir unidades de medida aceitas ou se serao texto livre inicialmente.",
    "Definir se produtos podem ter fornecedor principal obrigatorio ou opcional.",
    "Definir parametros de reposicao: dias de cobertura, prazo de entrega e estoque de seguranca.",
    "Definir status permitidos para contas a pagar.",
    "Definir niveis de permissao entre usuarios comuns e administradores.",
]:
    story.append(bullet(item))

story.append(section("8. Proxima etapa recomendada"))
story.append(
    body(
        "A proxima etapa tecnica recomendada e implementar o Modulo B de produtos. "
        "Ele desbloqueia os modulos de movimentacao, estoque baixo, fornecedores e indicadores. "
        "A entrega deve incluir CRUD protegido, DTOs, validacoes, repository, service, controller e testes."
    )
)

doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    rightMargin=2 * cm,
    leftMargin=2 * cm,
    topMargin=2 * cm,
    bottomMargin=2 * cm,
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
