package com.company.opexhub.service;

import com.company.opexhub.entity.User;
import com.company.opexhub.repository.UserRepository;
import mailhelper.MailHelper;
import org.springframework.beans.factory.annotation.Autowired;
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
            
            // Store code with 15-minute expiry and user data
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(15);
            verificationCodes.put(email.toLowerCase(), 
                new VerificationCodeData(verificationCode, expiryTime, fullName, site, discipline, role, roleName, password));

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
            newUser.setPassword(verificationData.getPassword()); // Password should already be encoded
            
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
                
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c5aa0; margin-bottom: 10px; font-size: 28px;">Welcome to OPEX Hub!</h1>
                        <div style="width: 60px; height: 4px; background-color: #2c5aa0; margin: 0 auto;"></div>
                    </div>
                
                    <h2 style="color: #2c5aa0; margin-bottom: 20px; font-size: 22px;">Email Verification Required</h2>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>%s</strong>,</p>
                    
                    <p style="margin-bottom: 20px;">Thank you for registering with OPEX Hub - Operational Excellence Platform. To complete your registration and secure your account, please verify your email address using the code below.</p>
                    
                    <table border="1" cellpadding="20" cellspacing="0" style="border-collapse: collapse; margin: 25px auto; border: 3px solid #2c5aa0; border-radius: 8px; background: linear-gradient(135deg, #f8f9ff 0%%, #e8f0ff 100%%);">
                        <tr>
                            <td style="text-align: center;">
                                <h3 style="color: #2c5aa0; margin: 0 0 15px 0; font-size: 20px;">Your Verification Code</h3>
                                <div style="font-size: 42px; font-weight: bold; color: #2c5aa0; letter-spacing: 6px; margin: 15px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">%s</div>
                                <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">⏰ This code will expire in <strong>15 minutes</strong></p>
                            </td>
                        </tr>
                    </table>
                    
                    <h3 style="color: #2c5aa0; margin-top: 30px; margin-bottom: 15px; font-size: 18px;">📧 Registration Details</h3>
                    
                    <table border="1" cellpadding="12" cellspacing="0" style="border-collapse: collapse; width: 100%%; border: 1px solid #ddd; border-radius: 6px;">
                        <tr style="background-color: #f8f9ff;">
                            <td style="font-weight: bold; width: 35%%; color: #2c5aa0;">Email Address</td>
                            <td>%s</td>
                        </tr>
                        <tr style="background-color: #ffffff;">
                            <td style="font-weight: bold; color: #2c5aa0;">Registration Time</td>
                            <td>%s</td>
                        </tr>
                        <tr style="background-color: #f8f9ff;">
                            <td style="font-weight: bold; color: #2c5aa0;">Code Validity</td>
                            <td>15 minutes from registration</td>
                        </tr>
                        <tr style="background-color: #ffffff;">
                            <td style="font-weight: bold; color: #2c5aa0;">Security Level</td>
                            <td>One-time use only</td>
                        </tr>
                    </table>
                    
                    <h3 style="color: #2c5aa0; margin-top: 30px; margin-bottom: 15px; font-size: 18px;">🚀 Next Steps</h3>
                    
                    <div style="background-color: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2c5aa0; margin: 20px 0;">
                        <ol style="line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li><strong>Return to the OPEX Hub registration page</strong></li>
                            <li><strong>Enter the 6-digit verification code shown above</strong></li>
                            <li><strong>Complete your account setup</strong></li>
                            <li><strong>Start using OPEX Hub to drive operational excellence!</strong></li>
                        </ol>
                    </div>
                    
                    <h3 style="color: #2c5aa0; margin-top: 30px; margin-bottom: 15px; font-size: 18px;">🎯 About OPEX Hub</h3>
                    
                    <div style="background-color: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; color: #2d5a2d; font-size: 15px; line-height: 1.6;">
                            <strong>OPEX Hub</strong> is your comprehensive platform for managing operational excellence initiatives, 
                            tracking performance metrics, and driving continuous improvement across your organization.
                        </p>
                    </div>
                    
                    <div style="background-color: #fff9e6; border: 2px solid #ffd700; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #b8860b; font-size: 16px;">🔒 Security Notice</h4>
                        <p style="margin: 0; color: #8b7355; font-size: 14px; line-height: 1.5;">
                            If you did not create an account with OPEX Hub, please ignore this email. 
                            Your email address will not be registered and no account will be created. 
                            For security concerns, contact our support team immediately.
                        </p>
                    </div>
                    
                    <hr style="margin: 40px 0; border: none; border-top: 2px solid #e0e0e0;">
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <div style="background-color: #2c5aa0; color: white; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                            <h4 style="margin: 0 0 5px 0; font-size: 18px;">OPEX Hub - Operational Excellence Platform</h4>
                            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Driving Excellence Through Innovation</p>
                        </div>
                        
                        <p style="font-size: 12px; color: #666; margin: 0; line-height: 1.4;">
                            <strong>🏢 DNL - Operational Excellence Initiative Management System</strong><br>
                            📧 This is an automated notification. Please do not reply to this email.<br>
                            🆘 For support, contact: <a href="mailto:support@godeepak.com" style="color: #2c5aa0;">support@godeepak.com</a><br>
                            🌐 Visit us: <a href="https://www.godeepak.com" style="color: #2c5aa0;">www.godeepak.com</a>
                        </p>
                    </div>
                    
                </div>
                
            </body>
            </html>
            """, userName, verificationCode, email, LocalDateTime.now().toString());
    }

    /**
     * Resend verification code (same as send, but with validation)
     */
    public boolean resendVerificationCode(String email) {
        VerificationCodeData existingData = verificationCodes.get(email.toLowerCase());
        if (existingData == null) {
            return false;
        }
        
        // Generate new code and update
        String newCode = generateVerificationCode();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(15);
        
        verificationCodes.put(email.toLowerCase(), 
            new VerificationCodeData(newCode, expiryTime, existingData.getFullName(), 
            existingData.getSite(), existingData.getDiscipline(), existingData.getRole(), 
            existingData.getRoleName(), existingData.getPassword()));
        
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