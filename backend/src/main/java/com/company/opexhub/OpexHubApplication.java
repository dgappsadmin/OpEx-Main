package com.company.opexhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class OpexHubApplication extends SpringBootServletInitializer {

    
    public static void main(String[] args) {
        SpringApplication.run(OpexHubApplication.class, args);
        System.out.println("Application is running and up!");
    }

    @Override 
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(OpexHubApplication.class);
    }
}
