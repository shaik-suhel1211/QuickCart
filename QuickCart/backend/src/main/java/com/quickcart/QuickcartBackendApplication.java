package com.quickcart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
public class QuickcartBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuickcartBackendApplication.class, args);
	}

}

