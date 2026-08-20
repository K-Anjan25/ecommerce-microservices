package com.ecommerce.api_gateway.file;

import com.ecommerce.api_gateway.file.exception.FileUploadException;
import com.ecommerce.api_gateway.file.exception.NotAnImageFileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.UUID;

import static com.ecommerce.api_gateway.file.FileConstant.*;

@Service
@Slf4j
public class FileService {

    public Mono<String> saveImage(FilePart image) {
        String contentType = image.headers().getContentType() != null
                ? image.headers().getContentType().toString() : "";
        if(!Arrays.asList(MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.IMAGE_GIF_VALUE)
                .contains(contentType)) {
            return Mono.error(new NotAnImageFileException(image.filename() + NOT_AN_IMAGE_FILE));
        }
        String randomId = UUID.randomUUID().toString();
        String fileName = randomId + ".jpg";
        Path imageFolder;
        try {
            imageFolder = Paths.get(IMAGE_FOLDER).toAbsolutePath().normalize();
            if(!Files.exists(imageFolder)) {
                Files.createDirectories(imageFolder);
                log.info(DIRECTORY_CREATED + imageFolder);
            }
        } catch (IOException e) {
            return Mono.error(new FileUploadException(FILE_UPLOAD_ERROR));
        }
        Path target = imageFolder.resolve(fileName).toAbsolutePath().normalize();
        return image.transferTo(target)
                .thenReturn(FILE_SERVER + fileName);
    }

    public Mono<String> removeImage(String imagePath) {
        return Mono.fromRunnable(() -> {
            try {
                Path imageFolder = Paths.get(IMAGE_FOLDER).toAbsolutePath().normalize();
                Files.delete(imageFolder.resolve(imagePath));
                log.info(FILE_SAVED_IN_FILE_SYSTEM + imagePath);
            } catch (Exception e) {
                throw new FileUploadException(FILE_REMOVE_ERROR);
            }
        }).thenReturn(FILE_SERVER + imagePath);
    }
}
