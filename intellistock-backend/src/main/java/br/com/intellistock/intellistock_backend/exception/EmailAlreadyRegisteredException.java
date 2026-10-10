package br.com.intellistock.intellistock_backend.exception;

public class EmailAlreadyRegisteredException extends ConflictException {

    public EmailAlreadyRegisteredException(String message) {
        super(message);
    }
}
