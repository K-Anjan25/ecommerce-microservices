package com.ecommerce.api_gateway.file;

import com.ecommerce.api_gateway.file.exception.FileUploadException;
import com.ecommerce.api_gateway.file.exception.NotAnImageFileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

import static com.ecommerce.api_gateway.file.FileConstant.*;

@Service
@Slf4j
public class FileService {
    @Value("${file.storage.path:${user.home}/ecommerce-product-images}")
    private String storagePath;

    private static final Pattern SAFE_NAME = Pattern.compile("[0-9a-fA-F-]{36}\\.(jpg|png|gif)");

    public Mono<String> saveImage(FilePart image) {
        String contentType = image.headers().getContentType() != null
                ? image.headers().getContentType().toString() : "";
        if (!Arrays.asList(MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.IMAGE_GIF_VALUE)
                .contains(contentType)) {
            return Mono.error(new NotAnImageFileException("Upload is not a supported image"));
        }
        Path folder;
        try {
            folder = imageFolder();
        } catch (IOException error) {
            return Mono.error(new FileUploadException(FILE_UPLOAD_ERROR));
        }
        Path temporary = folder.resolve(UUID.randomUUID() + ".upload");
        return image.transferTo(temporary).then(Mono.fromCallable(() -> {
            try {
                String extension = detectExtension(temporary);
                if (extension == null) throw new NotAnImageFileException("Image content does not match JPEG, PNG, or GIF");
                String fileName = UUID.randomUUID() + extension;
                Files.move(temporary, folder.resolve(fileName), StandardCopyOption.ATOMIC_MOVE);
                return FILE_SERVER + fileName;
            } catch (RuntimeException | IOException error) {
                Files.deleteIfExists(temporary);
                if (error instanceof NotAnImageFileException) throw (NotAnImageFileException) error;
                throw new FileUploadException(FILE_UPLOAD_ERROR);
            }
        }));
    }

    public Mono<byte[]> readImage(String imageName) {
        return Mono.fromCallable(() -> Files.readAllBytes(resolveSafe(imageName)));
    }

    public Mono<String> removeImage(String imageName) {
        return Mono.fromCallable(() -> {
            try {
                Files.delete(resolveSafe(imageName));
                log.info("Removed image {}", imageName);
                return FILE_SERVER + imageName;
            } catch (Exception error) {
                throw new FileUploadException(FILE_REMOVE_ERROR);
            }
        });
    }

    private Path imageFolder() throws IOException {
        Path folder = Paths.get(storagePath).toAbsolutePath().normalize();
        if (!Files.exists(folder)) Files.createDirectories(folder);
        return folder;
    }

    private Path resolveSafe(String imageName) throws IOException {
        if (imageName == null || !SAFE_NAME.matcher(imageName.toLowerCase(Locale.ROOT)).matches()) {
            throw new FileUploadException("Invalid image name");
        }
        Path folder = imageFolder();
        Path target = folder.resolve(imageName).normalize();
        if (!target.startsWith(folder)) throw new FileUploadException("Invalid image path");
        return target;
    }

    private String detectExtension(Path path) throws IOException {
        byte[] bytes = Files.readAllBytes(path);
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return ".jpg";
        if (bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47) return ".png";
        if (bytes.length >= 6 && bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == '8'
                && (bytes[4] == '7' || bytes[4] == '9') && bytes[5] == 'a') return ".gif";
        return null;
    }
}
