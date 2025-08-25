package com.company.opexhub;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
 
@SpringBootApplication
@EnableJpaAuditing
public class OpexHubApplication {
 
    public static void main(String[] args) {
        SpringApplication.run(OpexHubApplication.class, args);
        System.out.println("Application is running and up!");
 
    }
}