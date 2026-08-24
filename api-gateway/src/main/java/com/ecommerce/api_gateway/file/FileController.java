package com.ecommerce.api_gateway.file;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {
    private final FileService fileService;
    private final FileAuthorizationService authorizationService;

    @PostMapping(value = "/saveImage", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<String>> saveImage(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestPart("file") FilePart image) {
        return authorizationService.authenticatedUser(authorization)
                .flatMap(ignored -> fileService.saveImage(image))
                .map(ResponseEntity::ok);
    }

    @GetMapping(path = "/image/{imageName}")
    public Mono<ResponseEntity<byte[]>> getImage(@PathVariable String imageName) {
        MediaType type = imageName.endsWith(".png") ? MediaType.IMAGE_PNG
                : imageName.endsWith(".gif") ? MediaType.IMAGE_GIF : MediaType.IMAGE_JPEG;
        return fileService.readImage(imageName)
                .map(bytes -> ResponseEntity.ok().contentType(type).cacheControl(CacheControl.noCache()).body(bytes));
    }

    @DeleteMapping("/removeImage")
    public Mono<ResponseEntity<String>> removeImage(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
            @RequestParam String imagePath) {
        return authorizationService.authenticatedUser(authorization)
                .flatMap(user -> authorizationService.isAdmin(user)
                        ? fileService.removeImage(imagePath)
                        : Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required")))
                .map(ResponseEntity::ok);
    }
}
