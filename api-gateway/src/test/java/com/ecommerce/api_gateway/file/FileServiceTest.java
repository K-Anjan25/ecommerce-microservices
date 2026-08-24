package com.ecommerce.api_gateway.file;

import com.ecommerce.api_gateway.file.exception.FileUploadException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FileServiceTest {
    @TempDir Path folder;

    @Test
    void rejectsTraversalAndArbitraryNames() {
        FileService service = new FileService();
        ReflectionTestUtils.setField(service, "storagePath", folder.toString());

        assertThatThrownBy(() -> service.readImage("../secrets.txt").block())
                .isInstanceOf(FileUploadException.class);
        assertThatThrownBy(() -> service.removeImage("not-a-managed-file.jpg").block())
                .isInstanceOf(FileUploadException.class);
    }

    @Test
    void verifiesImageSignatureAndKeepsCorrectExtension() throws Exception {
        FileService service = new FileService();
        ReflectionTestUtils.setField(service, "storagePath", folder.toString());
        FilePart part = mock(FilePart.class);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        when(part.headers()).thenReturn(headers);
        when(part.transferTo(any(Path.class))).thenAnswer(invocation -> {
            Files.write(invocation.getArgument(0), new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a});
            return Mono.empty();
        });

        String url = service.saveImage(part).block();

        assertThat(url).startsWith("/file/image/").endsWith(".png");
        assertThat(Files.exists(folder.resolve(url.substring(url.lastIndexOf('/') + 1)))).isTrue();
    }

    @Test
    void readsManagedImageFromConfiguredVolume() throws Exception {
        FileService service = new FileService();
        ReflectionTestUtils.setField(service, "storagePath", folder.toString());
        String name = UUID.randomUUID() + ".png";
        byte[] content = new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47};
        Files.write(folder.resolve(name), content);

        assertThat(service.readImage(name).block()).containsExactly(content);
    }
}
