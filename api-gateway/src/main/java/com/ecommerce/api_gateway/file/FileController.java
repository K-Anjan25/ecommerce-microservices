package com.ecommerce.api_gateway.file;

import com.ecommerce.api_gateway.file.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.nio.file.Files;
import java.nio.file.Paths;

import static com.ecommerce.api_gateway.file.FileConstant.FORWARD_SLASH;
import static com.ecommerce.api_gateway.file.FileConstant.IMAGE_FOLDER;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/saveImage", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<String>> saveImage(@RequestPart("file") FilePart image) {
        return fileService.saveImage(image).map(ResponseEntity::ok);
    }

    @GetMapping(path = "/image/{imageName}", produces = MediaType.IMAGE_JPEG_VALUE)
    public Mono<byte[]> getImage(@PathVariable String imageName) {
        return Mono.fromCallable(() -> Files.readAllBytes(Paths.get(IMAGE_FOLDER + FORWARD_SLASH + imageName)));
    }

    @DeleteMapping("/removeImage")
    public Mono<ResponseEntity<String>> removeImage(@RequestParam String imagePath) {
        return fileService.removeImage(imagePath).map(ResponseEntity::ok);
    }
}
