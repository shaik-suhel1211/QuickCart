package com.quickcart.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class MvcConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:./uploads/product-images}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String resolvedPath = Paths.get(uploadDir).toAbsolutePath().normalize().toString();
        if (!resolvedPath.endsWith("/")) {
            resolvedPath += "/";
        }
        registry.addResourceHandler("/product-images/**")
                .addResourceLocations("file:" + resolvedPath);
    }
} 