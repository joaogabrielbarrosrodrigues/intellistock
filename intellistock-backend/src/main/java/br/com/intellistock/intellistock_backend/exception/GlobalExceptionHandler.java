package br.com.intellistock.intellistock_backend.exception;

import br.com.intellistock.intellistock_backend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Título: Tradutor de erros para respostas HTTP
 * Explicação: Classe central de tratamento de erros (@RestControllerAdvice). Intercepta qualquer erro
 *   lançado por controllers ou services e o transforma em uma resposta JSON com o código HTTP adequado.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Título: Trata InvalidRegistrationCodeException
     * Explicação: Quando algum controller, service ou o próprio Spring lança InvalidRegistrationCodeException,
     *   responde HTTP 403 com a mensagem “Codigo de acesso invalido.”, no formato ErrorResponse.
     */
    @ExceptionHandler(InvalidRegistrationCodeException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRegistrationCode(InvalidRegistrationCodeException ex,
                                                                       HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Codigo de acesso invalido.", request, null);
    }

    /**
     * Título: Trata ConflictException
     * Explicação: Quando algum controller, service ou o próprio Spring lança ConflictException, responde HTTP
     *   409 com a mensagem do próprio erro, no formato ErrorResponse.
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    /**
     * Título: Trata BusinessException
     * Explicação: Quando algum controller, service ou o próprio Spring lança BusinessException, responde HTTP
     *   422 com a mensagem do próprio erro, no formato ErrorResponse.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex, HttpServletRequest request) {
        return build(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage(), request, null);
    }

    /**
     * Título: Trata ResourceNotFoundException
     * Explicação: Quando algum controller, service ou o próprio Spring lança ResourceNotFoundException,
     *   responde HTTP 404 com a mensagem do próprio erro, no formato ErrorResponse.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    /**
     * Título: Trata BadCredentialsException
     * Explicação: Quando algum controller, service ou o próprio Spring lança BadCredentialsException, responde
     *   HTTP 401 com a mensagem “Credenciais invalidas.”, no formato ErrorResponse.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Credenciais invalidas.", request, null);
    }

    /**
     * Título: Trata AuthenticationException
     * Explicação: Quando algum controller, service ou o próprio Spring lança AuthenticationException, responde
     *   HTTP 401 com a mensagem “Nao foi possivel autenticar.”, no formato ErrorResponse.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Nao foi possivel autenticar.", request, null);
    }

    /**
     * Título: Trata AccessDeniedException
     * Explicação: Quando algum controller, service ou o próprio Spring lança AccessDeniedException, responde
     *   HTTP 403 com a mensagem “Acesso negado.”, no formato ErrorResponse.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Acesso negado.", request, null);
    }

    /**
     * Título: Trata MethodArgumentNotValidException
     * Explicação: Quando algum controller, service ou o próprio Spring lança MethodArgumentNotValidException,
     *   responde HTTP 400 com a mensagem “Dados invalidos.”, no formato ErrorResponse.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fields.put(error.getField(), error.getDefaultMessage()));

        return build(HttpStatus.BAD_REQUEST, "Dados invalidos.", request, fields);
    }

    /**
     * Título: Trata HandlerMethodValidationException
     * Explicação: Quando algum controller, service ou o próprio Spring lança HandlerMethodValidationException,
     *   responde HTTP 400 com a mensagem “Parametros invalidos.”, no formato ErrorResponse.
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleMethodValidation(HandlerMethodValidationException ex,
                                                                HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getParameterValidationResults().forEach(result -> {
            String name = result.getMethodParameter().getParameterName();
            result.getResolvableErrors().forEach(error -> fields.put(name, error.getDefaultMessage()));
        });

        return build(HttpStatus.BAD_REQUEST, "Parametros invalidos.", request, fields);
    }

    /**
     * Título: Trata HttpMessageNotReadableException
     * Explicação: Quando algum controller, service ou o próprio Spring lança HttpMessageNotReadableException,
     *   responde HTTP 400 com a mensagem “Corpo da requisicao invalido ou mal formatado.”, no formato
     *   ErrorResponse.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex,
                                                           HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Corpo da requisicao invalido ou mal formatado.", request, null);
    }

    /**
     * Título: Trata MethodArgumentTypeMismatchException
     * Explicação: Quando algum controller, service ou o próprio Spring lança
     *   MethodArgumentTypeMismatchException, responde HTTP 400 com a mensagem “Valor invalido para o parametro
     *   ...”, completada com o nome do parâmetro, no formato ErrorResponse.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                            HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Valor invalido para o parametro '" + ex.getName() + "'.", request, null);
    }

    /**
     * Título: Trata MissingServletRequestParameterException
     * Explicação: Quando algum controller, service ou o próprio Spring lança
     *   MissingServletRequestParameterException, responde HTTP 400 com a mensagem “Parametro obrigatorio
     *   ausente: ...”, completada com o nome do parâmetro, no formato ErrorResponse.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex,
                                                                HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Parametro obrigatorio ausente: '" + ex.getParameterName() + "'.",
                request, null);
    }

    /**
     * Título: Trata HttpRequestMethodNotSupportedException
     * Explicação: Quando algum controller, service ou o próprio Spring lança
     *   HttpRequestMethodNotSupportedException, responde HTTP 405 com a mensagem “Metodo HTTP nao suportado para
     *   este endpoint.”, no formato ErrorResponse.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
                                                                  HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "Metodo HTTP nao suportado para este endpoint.", request, null);
    }

    /**
     * Título: Trata HttpMediaTypeNotSupportedException
     * Explicação: Quando algum controller, service ou o próprio Spring lança
     *   HttpMediaTypeNotSupportedException, responde HTTP 415 com a mensagem “Tipo de conteudo nao suportado.
     *   Envie application/json.”, no formato ErrorResponse.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex,
                                                                   HttpServletRequest request) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Tipo de conteudo nao suportado. Envie application/json.",
                request, null);
    }

    /**
     * Título: Trata HttpMediaTypeNotAcceptableException
     * Explicação: Quando algum controller, service ou o próprio Spring lança
     *   HttpMediaTypeNotAcceptableException, responde HTTP 406 com a mensagem “Formato de resposta nao
     *   suportado. Use application/json.”, no formato ErrorResponse.
     */
    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    public ResponseEntity<ErrorResponse> handleNotAcceptable(HttpMediaTypeNotAcceptableException ex,
                                                            HttpServletRequest request) {
        return build(HttpStatus.NOT_ACCEPTABLE, "Formato de resposta nao suportado. Use application/json.",
                request, null);
    }

    /**
     * Título: Trata NoResourceFoundException
     * Explicação: Quando algum controller, service ou o próprio Spring lança NoResourceFoundException,
     *   responde HTTP 404 com a mensagem “Endpoint nao encontrado.”, no formato ErrorResponse.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Endpoint nao encontrado.", request, null);
    }

    /**
     * Título: Trata ObjectOptimisticLockingFailureException
     * Explicação: Quando algum controller, service ou o próprio Spring lança
     *   ObjectOptimisticLockingFailureException, responde HTTP 409 com a mensagem “O registro foi alterado por
     *   outra operacao. Tente novamente.”, no formato ErrorResponse.
     */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex,
                                                              HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "O registro foi alterado por outra operacao. Tente novamente.", request, null);
    }

    /**
     * Título: Trata DataIntegrityViolationException
     * Explicação: Quando algum controller, service ou o próprio Spring lança DataIntegrityViolationException,
     *   responde HTTP 409 com a mensagem “A operacao viola uma restricao de integridade dos dados.”, no formato
     *   ErrorResponse.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex,
                                                             HttpServletRequest request) {
        log.warn("Violacao de integridade em {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "A operacao viola uma restricao de integridade dos dados.", request, null);
    }

    /**
     * Título: Trata Exception
     * Explicação: Quando algum controller, service ou o próprio Spring lança Exception, responde HTTP 500 com
     *   a mensagem “Erro interno no servidor.”, no formato ErrorResponse.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Erro inesperado em {}", request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno no servidor.", request, null);
    }

    /**
     * Título: Monta a resposta de erro com status, mensagem, URL e campos
     * Explicação: Recebe status (HttpStatus), message (String), request (HttpServletRequest) e fields
     *   (Map<String,String>). Devolve ResponseEntity<ErrorResponse>.
     */
    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, HttpServletRequest request,
                                                Map<String, String> fields) {
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON)
                .body(ErrorResponse.of(status, message, request.getRequestURI(), fields));
    }
}
