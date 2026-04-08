package com.ecommerce.file_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

import java.io.File;
import static com.ecommerce.file_service.constant.FileConstant.IMAGE_FOLDER;

@SpringBootApplication
@EnableEurekaClient
public class FileServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(FileServiceApplication.class, args);
		new File(IMAGE_FOLDER).mkdirs();
	}

}
