package com.foodorder.kitchen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class KitchenApplication {
    public static void main(String[] args) {
        SpringApplication.run(KitchenApplication.class, args);
    }
}
