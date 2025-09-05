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
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // In-memory storage for reset codes (in production, use Redis or database)
    private final Map<String, ResetCodeData> resetCodes = new ConcurrentHashMap<>();
    
    private static class ResetCodeData {
        private final String code;
        private final LocalDateTime expiryTime;
        
        public ResetCodeData(String code, LocalDateTime expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }
        
        public String getCode() { return code; }
        public LocalDateTime getExpiryTime() { return expiryTime; }
        public boolean isExpired() { return LocalDateTime.now().isAfter(expiryTime); }
    }

    /**
     * Generate and send password reset code to user's email
     */
    public boolean sendResetCode(String email) {
        try {
            // Check if user exists
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return false;
            }

            // Generate 6-digit code
            String resetCode = generateResetCode();
            
            // Store code with 15-minute expiry
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(15);
            resetCodes.put(email.toLowerCase(), new ResetCodeData(resetCode, expiryTime));

            // Send email
            String subject = "Password Reset Code - OPEX Hub";
            String emailTemplate = createPasswordResetEmailTemplate(user.getFullName(), resetCode);
            
            MailHelper.send(subject, emailTemplate, email, null, null);
            
            Logger.getLogger(this.getClass().getName()).info(
                String.format("Password reset code sent to %s", email));
            
            return true;

        } catch (IOException e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, 
                "Failed to send password reset email", e);
            return false;
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.WARNING, 
                "Error in password reset code generation", e);
            return false;
        }
    }

    /**
     * Verify the reset code
     */
    public boolean verifyResetCode(String email, String code) {
        ResetCodeData resetData = resetCodes.get(email.toLowerCase());
        
        if (resetData == null) {
            return false;
        }
        
        if (resetData.isExpired()) {
            resetCodes.remove(email.toLowerCase());
            return false;
        }
        
        return resetData.getCode().equals(code);
    }

    /**
     * Reset password with verification
     */
    public boolean resetPassword(String email, String code, String newPassword) {
        // Verify code first
        if (!verifyResetCode(email, code)) {
            return false;
        }
        
        try {
            // Get user
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return false;
            }
            
            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            // Remove used code
            resetCodes.remove(email.toLowerCase());
            
            Logger.getLogger(this.getClass().getName()).info(
                String.format("Password reset successfully for %s", email));
            
            return true;
            
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, 
                "Failed to reset password", e);
            return false;
        }
    }

    /**
     * Generate 6-digit reset code
     */
    private String generateResetCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    /**
     * Create simple email template for password reset
     */
    private String createPasswordResetEmailTemplate(String userName, String resetCode) {
        StringBuilder template = new StringBuilder();
        template.append("<!DOCTYPE html>\n");
        template.append("<html>\n");
        template.append("<head>\n");
        template.append("    <meta charset=\"UTF-8\">\n");
        template.append("    <title>Password Reset Code</title>\n");
        template.append("</head>\n");
        template.append("<body style=\"font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;\">\n");
        template.append("    \n");
        template.append("    <h2 style=\"color: #2c5aa0; margin-bottom: 20px;\">Password Reset Request</h2>\n");
        template.append("    \n");
        template.append("    <p>Dear <strong>%s</strong>,</p>\n");
        template.append("    \n");
        template.append("    <p>You have requested to reset your password for OPEX Hub. Please use the verification code below to proceed with your password reset.</p>\n");
        template.append("    \n");
        template.append("    <table border=\"1\" cellpadding=\"15\" cellspacing=\"0\" style=\"border-collapse: collapse; margin: 20px 0; border: 2px solid #2c5aa0;\">\n");
        template.append("        <tr style=\"background-color: #f8f9ff;\">\n");
        template.append("            <td style=\"text-align: center;\">\n");
        template.append("                <h3 style=\"color: #2c5aa0; margin: 0; font-size: 18px;\">Your Reset Code</h3>\n");
        template.append("                <div style=\"font-size: 32px; font-weight: bold; color: #2c5aa0; letter-spacing: 4px; margin: 10px 0;\">%s</div>\n");
        template.append("                <p style=\"margin: 0; font-size: 12px; color: #666;\">This code will expire in 15 minutes</p>\n");
        template.append("            </td>\n");
        template.append("        </tr>\n");
        template.append("    </table>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Security Information</h3>\n");
        template.append("    \n");
        template.append("    <table border=\"1\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; width: 100%%; max-width: 500px; border: 1px solid #ccc;\">\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold; width: 30%%;\">Code Validity</td>\n");
        template.append("            <td>15 minutes from now</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Security</td>\n");
        template.append("            <td>One-time use only</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold;\">Action Required</td>\n");
        template.append("            <td>Enter this code in the password reset form</td>\n");
        template.append("        </tr>\n");
        template.append("    </table>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Next Steps</h3>\n");
        template.append("    \n");
        template.append("    <ol style=\"line-height: 1.6;\">\n");
        template.append("        <li>Return to the OPEX Hub password reset page</li>\n");
        template.append("        <li>Enter the 6-digit code shown above</li>\n");
        template.append("        <li>Create your new password</li>\n");
        template.append("        <li>Sign in with your new credentials</li>\n");
        template.append("    </ol>\n");
        template.append("    \n");
        template.append("    <div style=\"background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;\">\n");
        template.append("        <p style=\"margin: 0; color: #856404;\">\n");
        template.append("            <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email. \n");
        template.append("            Your account security has not been compromised.\n");
        template.append("        </p>\n");
        template.append("    </div>\n");
        template.append("    \n");
        template.append("    <hr style=\"margin: 30px 0; border: none; border-top: 1px solid #ccc;\">\n");
        template.append("    \n");
        template.append("    <p style=\"font-size: 12px; color: #666;\">\n");
        template.append("        <strong>OPEX Hub - Operational Excellence Platform</strong><br>\n");
        template.append("        This is an automated notification. Please do not reply to this email.<br>\n");
        // template.append("        For support, contact: support@company.com\n");
        template.append("    </p>\n");
        template.append("    \n");
        template.append("</body>\n");
        template.append("</html>\n");
        
        return String.format(template.toString(), userName, resetCode);
    }

    /**
     * Clean up expired codes (call this periodically)
     */
    public void cleanupExpiredCodes() {
        resetCodes.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}