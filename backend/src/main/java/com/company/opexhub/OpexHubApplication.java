package com.company.opexhub;
 
import java.io.IOException;
 
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import mailhelper.MailHelper;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
 
@SpringBootApplication
@EnableJpaAuditing
public class OpexHubApplication {
 
    public static void main(String[] args) {
        SpringApplication.run(OpexHubApplication.class, args);
        System.out.println("Application is running and up!");
 
        // ✅ Call your send method here
        try {
            send(
                "Test Subject",
                "Hello, this is a test email template!",
                "dnsharma@godeepak.com",
                "",
                "dnsharma@godeepak.com"
            );
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
 
    public static void send(String subject, String emailTemplate, String toEmail, String cc, String bcc) throws IOException {
        MailHelper.send(
            subject,
            emailTemplate,
            toEmail,
            cc,
            bcc
        );
    }
}