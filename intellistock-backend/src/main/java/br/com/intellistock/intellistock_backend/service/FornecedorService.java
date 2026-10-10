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
import java.util.UUID;

@Service
public class FornecedorService {

    private final FornecedorRepository fornecedorRepository;
    private final ProdutoRepository produtoRepository;
    private final ContaPagarRepository contaPagarRepository;

    public FornecedorService(FornecedorRepository fornecedorRepository, ProdutoRepository produtoRepository,
                             ContaPagarRepository contaPagarRepository) {
        this.fornecedorRepository = fornecedorRepository;
        this.produtoRepository = produtoRepository;
        this.contaPagarRepository = contaPagarRepository;
    }

    @Transactional(readOnly = true)
    public List<FornecedorResponse> listar(String busca) {
        List<Fornecedor> fornecedores = busca == null || busca.isBlank()
                ? fornecedorRepository.findAllByOrderByNomeAsc()
                : fornecedorRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(busca.trim());
        return fornecedores.stream().map(FornecedorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public FornecedorResponse buscar(UUID id) {
        return FornecedorResponse.from(buscarEntidade(id));
    }

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

    @Transactional
    public void excluir(UUID id) {
        Fornecedor fornecedor = buscarEntidade(id);
        if (produtoRepository.existsByFornecedorId(id) || contaPagarRepository.existsByFornecedorId(id)) {
            throw new ConflictException("Fornecedor possui produtos ou contas vinculados e nao pode ser excluido.");
        }
        fornecedorRepository.delete(fornecedor);
    }

    @Transactional(readOnly = true)
    public Fornecedor buscarEntidade(UUID id) {
        return fornecedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor nao encontrado."));
    }

    private void preencher(Fornecedor fornecedor, FornecedorRequest request, String cnpj) {
        fornecedor.setNome(request.nome().trim());
        fornecedor.setCnpj(cnpj);
        fornecedor.setTelefone(blankToNull(request.telefone()));
        String email = blankToNull(request.email());
        fornecedor.setEmail(email == null ? null : email.toLowerCase());
    }

    private String validarCnpj(String cnpj) {
        String normalized = CnpjUtils.normalize(cnpj);
        if (normalized != null && !CnpjUtils.isValid(normalized)) {
            throw new BusinessException("CNPJ invalido.");
        }
        return normalized;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
