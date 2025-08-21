// package com.company.opexhub.config;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.context.annotation.Configuration;

// @Configuration
// public class EmailConfig {
    
//     @Value("${app.frontend.url:http://localhost:3000}")
//     private String frontendUrl;
    
//     @Value("${app.company.name:DNL Company}")
//     private String companyName;
    
//     @Value("${app.support.email:support@company.com}")
//     private String supportEmail;
    
//     @Value("${app.opex.email:opex@company.com}")
//     private String opexEmail;
    
//     public String getFrontendUrl() {
//         return frontendUrl;
//     }
    
//     public String getCompanyName() {
//         return companyName;
//     }
    
//     public String getSupportEmail() {
//         return supportEmail;
//     }
    
//     public String getOpexEmail() {
//         return opexEmail;
//     }
    
//     public String getLogoUrl() {
//         return frontendUrl + "/src/assets/dnl-logo.png";
//     }
    
//     public String getDashboardUrl() {
//         return frontendUrl + "/dashboard";
//     }
// }