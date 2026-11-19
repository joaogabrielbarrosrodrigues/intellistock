package br.com.intellistock.intellistock_backend.service;

import br.com.intellistock.intellistock_backend.dto.FornecedorRequest;
import br.com.intellistock.intellistock_backend.dto.FornecedorResponse;
import br.com.intellistock.intellistock_backend.entity.Fornecedor;
import br.com.intellistock.intellistock_backend.exception.BusinessException;
import br.com.intellistock.intellistock_backend.exception.ConflictException;
import br.com.intellistock.intellistock_backend.exception.ResourceNotFoundException;
import br.com.intellistock.intellistock_backend.repository.ContaPagarRepository;
import br.com.intellistock.intellistock_backend.repository.FornecedorRepository;
import br.com.intellistock.intellistock_backend.repository.ProdutoRepository;
import br.com.intellistock.intellistock_backend.util.CnpjUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Título: Regras de negócio dos fornecedores
 * Explicação: Service com as regras de negócio dos fornecedores.
 */
@Service
public class FornecedorService {

    private final FornecedorRepository fornecedorRepository;
    private final ProdutoRepository produtoRepository;
    private final ContaPagarRepository contaPagarRepository;

    /**
     * Título: Construtor
     * Explicação: O Spring chama ao criar o objeto e entrega pronto o que ele precisa: fornecedorRepository
     *   (FornecedorRepository), produtoRepository (ProdutoRepository) e contaPagarRepository
     *   (ContaPagarRepository).
     */
    public FornecedorService(FornecedorRepository fornecedorRepository, ProdutoRepository produtoRepository,
                             ContaPagarRepository contaPagarRepository) {
        this.fornecedorRepository = fornecedorRepository;
        this.produtoRepository = produtoRepository;
        this.contaPagarRepository = contaPagarRepository;
    }

    /**
     * Título: Lista todos ou busca por parte do nome
     * Explicação: Recebe busca (String). Todos em ordem alfabética, ou só os que contêm o texto no nome.
     *   Devolve List<FornecedorResponse>. Chamado por FornecedorController.
     */
    @Transactional(readOnly = true)
    public List<FornecedorResponse> listar(String busca) {
        List<Fornecedor> fornecedores = busca == null || busca.isBlank()
                ? fornecedorRepository.findAllByOrderByNomeAsc()
                : fornecedorRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(busca.trim());
        return fornecedores.stream().map(FornecedorResponse::from).toList();
    }

    /**
     * Título: Devolve um fornecedor como DTO
     * Explicação: Recebe id (UUID). Devolve o fornecedor (como DTO ou como entidade para outros services); 404
     *   se não existir. Devolve FornecedorResponse. Chamado por FornecedorController.
     */
    @Transactional(readOnly = true)
    public FornecedorResponse buscar(UUID id) {
        return FornecedorResponse.from(buscarEntidade(id));
    }

    /**
     * Título: Valida o CNPJ e grava
     * Explicação: Recebe request (FornecedorRequest). Limpa e valida o CNPJ (dígitos verificadores), recusa
     *   CNPJ já usado (409) e grava. Devolve FornecedorResponse. Chamado por FornecedorController.
     */
    @Transactional
    public FornecedorResponse criar(FornecedorRequest request) {
        String cnpj = validarCnpj(request.cnpj());
        if (cnpj != null && fornecedorRepository.existsByCnpj(cnpj)) {
            throw new ConflictException("CNPJ ja cadastrado.");
        }

        Fornecedor fornecedor = new Fornecedor();
        preencher(fornecedor, request, cnpj);
        return FornecedorResponse.from(fornecedorRepository.save(fornecedor));
    }

    /**
     * Título: Valida o CNPJ (ignorando o próprio registro) e atualiza
     * Explicação: Recebe id (UUID) e request (FornecedorRequest). Mesma validação, ignorando o próprio
     *   registro na checagem de CNPJ repetido. Devolve FornecedorResponse. Chamado por FornecedorController.
     */
    @Transactional
    public FornecedorResponse atualizar(UUID id, FornecedorRequest request) {
        Fornecedor fornecedor = buscarEntidade(id);
        String cnpj = validarCnpj(request.cnpj());
        if (cnpj != null && fornecedorRepository.existsByCnpjAndIdNot(cnpj, id)) {
            throw new ConflictException("CNPJ ja cadastrado.");
        }

        preencher(fornecedor, request, cnpj);
        return FornecedorResponse.from(fornecedor);
    }

    /**
     * Título: Recusa se houver vínculos; senão apaga
     * Explicação: Recebe id (UUID). Recusa (409) se algum produto ou conta aponta para o fornecedor; senão
     *   apaga. Não devolve nada. Chamado por FornecedorController.
     */
    @Transactional
    public void excluir(UUID id) {
        Fornecedor fornecedor = buscarEntidade(id);
        if (produtoRepository.existsByFornecedorId(id) || contaPagarRepository.existsByFornecedorId(id)) {
            throw new ConflictException("Fornecedor possui produtos ou contas vinculados e nao pode ser excluido.");
        }
        fornecedorRepository.delete(fornecedor);
    }

    /**
     * Título: Busca a entidade (usada por outros services)
     * Explicação: Recebe id (UUID). Devolve Fornecedor. Chamado por ContaPagarService e ProdutoService.
     */
    @Transactional(readOnly = true)
    public Fornecedor buscarEntidade(UUID id) {
        return fornecedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor nao encontrado."));
    }

    /**
     * Título: Copia os dados do pedido para a entidade, limpando espaços
     * Explicação: Recebe fornecedor (Fornecedor), request (FornecedorRequest) e cnpj (String). Copia os dados
     *   do pedido para a entidade, tirando espaços e passando o e-mail para minúsculas. Não devolve nada.
     */
    private void preencher(Fornecedor fornecedor, FornecedorRequest request, String cnpj) {
        fornecedor.setNome(request.nome().trim());
        fornecedor.setCnpj(cnpj);
        fornecedor.setTelefone(blankToNull(request.telefone()));
        String email = blankToNull(request.email());
        fornecedor.setEmail(email == null ? null : email.toLowerCase(Locale.ROOT));
    }

    /**
     * Título: Limpa a pontuação e confere os dígitos verificadores
     * Explicação: Recebe cnpj (String). Devolve String.
     */
    private String validarCnpj(String cnpj) {
        String normalized = CnpjUtils.normalize(cnpj);
        if (normalized != null && !CnpjUtils.isValid(normalized)) {
            throw new BusinessException("CNPJ invalido.");
        }
        return normalized;
    }

    /**
     * Título: Transforma texto vazio em null e tira espaços das pontas
     * Explicação: Recebe value (String). Devolve String.
     */
    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
