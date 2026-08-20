package com.ecommerce.api_gateway.file.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Slf4j
public class FileExceptionHandler {

    @ExceptionHandler(NotAnImageFileException.class)
    public ResponseEntity<String> notAnImageFileException(NotAnImageFileException exception) {
        log.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
    }

    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<String> fileUploadException(FileUploadException exception) {
        log.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
    }

    @ExceptionHandler(FileExistSameNameException.class)
    public ResponseEntity<String> fileExistSameNameException(FileExistSameNameException exception) {
        log.error(exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(exception.getMessage());
    }
}
