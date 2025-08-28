package com.company.opexhub.service;

import com.company.opexhub.entity.User;
import com.company.opexhub.repository.UserRepository;
import mailhelper.MailHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;
import java.util.logging.Level;

@Service
public class EmailVerificationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // In-memory storage for verification codes (in production, use Redis or database)
    private final Map<String, VerificationCodeData> verificationCodes = new ConcurrentHashMap<>();
    
    private static class VerificationCodeData {
        private final String code;
        private final LocalDateTime expiryTime;
        private final String fullName;
        private final String site;
        private final String discipline;
        private final String role;
        private final String roleName;
        private final String password;
        
        public VerificationCodeData(String code, LocalDateTime expiryTime, String fullName, 
                                  String site, String discipline, String role, String roleName, String password) {
            this.code = code;
            this.expiryTime = expiryTime;
            this.fullName = fullName;
            this.site = site;
            this.discipline = discipline;
            this.role = role;
            this.roleName = roleName;
            this.password = password;
        }
        
        public String getCode() { return code; }
        public LocalDateTime getExpiryTime() { return expiryTime; }
        public boolean isExpired() { return LocalDateTime.now().isAfter(expiryTime); }
        public String getFullName() { return fullName; }
        public String getSite() { return site; }
        public String getDiscipline() { return discipline; }
        public String getRole() { return role; }
        public String getRoleName() { return roleName; }
        public String getPassword() { return password; }
    }

    /**
     * Validate email domain - only allow @godeepak.com
     */
    public boolean isValidEmailDomain(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return email.toLowerCase().trim().endsWith("@godeepak.com");
    }

    /**
     * Generate and send email verification code for new registration
     */
    public boolean sendVerificationCode(String email, String fullName, String site, 
                                      String discipline, String role, String roleName, String password) {
        try {
            // Validate email domain
            if (!isValidEmailDomain(email)) {
                Logger.getLogger(this.getClass().getName()).warning(
                    String.format("Invalid email domain for registration: %s", email));
                return false;
            }

            // Check if user already exists
            User existingUser = userRepository.findByEmail(email).orElse(null);
            if (existingUser != null) {
                Logger.getLogger(this.getClass().getName()).warning(
                    String.format("User already exists with email: %s", email));
                return false;
            }

            // Generate 6-digit code
            String verificationCode = generateVerificationCode();
            
            // Encode password before storing temporarily
            String encodedPassword = passwordEncoder.encode(password);
            
            // Store code with 15-minute expiry and user data
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(15);
            verificationCodes.put(email.toLowerCase(), 
                new VerificationCodeData(verificationCode, expiryTime, fullName, site, discipline, role, roleName, encodedPassword));

            // Send email
            String subject = "Email Verification Code - OPEX Hub Registration";
            String emailTemplate = createEmailVerificationTemplate(fullName, verificationCode, email);
            
            MailHelper.send(subject, emailTemplate, email, null, null);
            
            Logger.getLogger(this.getClass().getName()).info(
                String.format("Email verification code sent to %s for registration", email));
            
            return true;

        } catch (IOException e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, 
                "Failed to send email verification code", e);
            return false;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.WARNING, 
                "Error in email verification code generation", e);
            return false;
        }
    }

    /**
     * Verify the email verification code
     */
    public boolean verifyCode(String email, String code) {
        if (!isValidEmailDomain(email)) {
            return false;
        }

        VerificationCodeData verificationData = verificationCodes.get(email.toLowerCase());
        
        if (verificationData == null) {
            return false;
        }
        
        if (verificationData.isExpired()) {
            verificationCodes.remove(email.toLowerCase());
            return false;
        }
        
        return verificationData.getCode().equals(code);
    }

    /**
     * Complete registration after email verification
     */
    public User completeRegistration(String email, String code) {
        // Verify code first
        if (!verifyCode(email, code)) {
            return null;
        }
        
        try {
            VerificationCodeData verificationData = verificationCodes.get(email.toLowerCase());
            if (verificationData == null) {
                return null;
            }

            // Check if user already exists (double check)
            User existingUser = userRepository.findByEmail(email).orElse(null);
            if (existingUser != null) {
                verificationCodes.remove(email.toLowerCase());
                return null;
            }
            
            // Create new user
            User newUser = new User();
            newUser.setEmail(email.toLowerCase());
            newUser.setFullName(verificationData.getFullName());
            newUser.setSite(verificationData.getSite());
            newUser.setDiscipline(verificationData.getDiscipline());
            newUser.setRole(verificationData.getRole());
            newUser.setRoleName(verificationData.getRoleName());
            newUser.setPassword(verificationData.getPassword()); // Password is already encoded
            
            User savedUser = userRepository.save(newUser);
            
            // Remove used code
            verificationCodes.remove(email.toLowerCase());
            
            Logger.getLogger(this.getClass().getName()).info(
                String.format("User registration completed for %s", email));
            
            return savedUser;
            
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, 
                "Failed to complete user registration", e);
            return null;
        }
    }

    /**
     * Generate 6-digit verification code
     */
    private String generateVerificationCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    /**
     * Create professional email template for email verification
     */
    private String createEmailVerificationTemplate(String userName, String verificationCode, String email) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Email Verification Code</title>
            </head>
            <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;">
                
                <h2 style="color: #2c5aa0; margin-bottom: 20px;">Email Verification Required</h2>
                
                <p>Dear <strong>%s</strong>,</p>
                
                <p>Thank you for registering with OPEX Hub - Operational Excellence Platform. To complete your registration and secure your account, please use the verification code below.</p>
                
                <table border="1" cellpadding="15" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; border: 2px solid #2c5aa0;">
                    <tr style="background-color: #f8f9ff;">
                        <td style="text-align: center;">
                            <h3 style="color: #2c5aa0; margin: 0; font-size: 18px;">Your Verification Code</h3>
                            <div style="font-size: 32px; font-weight: bold; color: #2c5aa0; letter-spacing: 4px; margin: 10px 0;">%s</div>
                            <p style="margin: 0; font-size: 12px; color: #666;">This code will expire in 15 minutes</p>
                        </td>
                    </tr>
                </table>
                
                <h3 style="color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;">Registration Information</h3>
                
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%%; max-width: 500px; border: 1px solid #ccc;">
                    <tr style="background-color: #f5f5f5;">
                        <td style="font-weight: bold; width: 30%%;">Email Address</td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f5f5f5;">Code Validity</td>
                        <td>15 minutes from now</td>
                    </tr>
                    <tr style="background-color: #f5f5f5;">
                        <td style="font-weight: bold;">Security</td>
                        <td>One-time use only</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f5f5f5;">Action Required</td>
                        <td>Enter this code in the registration form</td>
                    </tr>
                </table>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404;">
                        <strong>Security Notice:</strong> If you did not create an account with OPEX Hub, please ignore this email. 
                        Your email address will not be registered and no account will be created.
                    </p>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;">
                
                <p style="font-size: 12px; color: #666;">
                    <strong>OPEX Hub - Operational Excellence Platform</strong><br>
                    This is an automated notification. Please do not reply to this email.<br>
                    For support, contact: dnsharma@godeepak.com
                </p>
                
            </body>
            </html>
            """, userName, verificationCode, email);
    }

    /**
     * Resend verification code (same as send, but with validation)
     */
    public boolean resendVerificationCode(String email) {
        VerificationCodeData existingData = verificationCodes.get(email.toLowerCase());
        if (existingData == null) {
            return false;
        }
        
        // Generate new code and update (keep existing encoded password)
        String newCode = generateVerificationCode();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(15);
        
        verificationCodes.put(email.toLowerCase(), 
            new VerificationCodeData(newCode, expiryTime, existingData.getFullName(), 
            existingData.getSite(), existingData.getDiscipline(), existingData.getRole(), 
            existingData.getRoleName(), existingData.getPassword())); // Keep encoded password
        
        try {
            String subject = "Email Verification Code - OPEX Hub Registration (Resent)";
            String emailTemplate = createEmailVerificationTemplate(existingData.getFullName(), newCode, email);
            
            MailHelper.send(subject, emailTemplate, email, null, null);
            
            Logger.getLogger(this.getClass().getName()).info(
                String.format("Email verification code resent to %s", email));
            
            return true;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, 
                "Failed to resend verification code", e);
            return false;
        }
    }

    /**
     * Clean up expired codes (call this periodically)
     */
    public void cleanupExpiredCodes() {
        verificationCodes.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}