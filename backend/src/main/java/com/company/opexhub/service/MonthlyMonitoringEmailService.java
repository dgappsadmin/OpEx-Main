package com.company.opexhub.service;

import com.company.opexhub.entity.MonthlyMonitoringEntry;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.User;
import com.company.opexhub.repository.UserRepository;
import mailhelper.MailHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.text.DecimalFormat;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.logging.Level;

@Service
public class MonthlyMonitoringEmailService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailActionTokenService tokenService;
    
    @Autowired
    private LoggingService loggingService;
    
    @Value("${app.base.url:http://localhost:8001}")
    private String baseUrl;
    
    private static final Logger LOGGER = Logger.getLogger(MonthlyMonitoringEmailService.class.getName());
    
    /**
     * Send notification to F&A user when Initiative Lead finalizes a monitoring entry
     */
    public boolean sendFANotificationEmail(MonthlyMonitoringEntry entry) {
        try {
            Initiative initiative = entry.getInitiative();
            String site = initiative.getSite();
            
            // Get F&A user for this site
            List<User> faUsers = userRepository.findByRoleAndSite("F&A", site);
            
            if (faUsers.isEmpty()) {
                loggingService.warning("No F&A user found for site: " + site + 
                    " - Cannot send notification for entry ID: " + entry.getId());
                return false;
            }
            
            // Use first F&A user (or implement logic to select specific F&A user)
            User faUser = faUsers.get(0);
            
            // Generate secure tokens for email actions
            String approveToken = tokenService.generateToken(entry.getId(), "APPROVE");
            String editRequestToken = tokenService.generateToken(entry.getId(), "REQUEST_EDIT");
            
            // Create email content
            String subject = "Monthly Monitoring Entry Finalized - Action Required [" + 
                initiative.getInitiativeNumber() + "]";
            String cc = null;
            String bcc = "dnsharma@godeepak.com";
            String emailBody = createFANotificationEmailTemplate(
                faUser.getFullName(),
                entry,
                initiative,
                approveToken,
                editRequestToken
            );
            
            // Send email
            MailHelper.send(subject, emailBody, faUser.getEmail(), cc, bcc);
            
            loggingService.info("F&A notification email sent successfully - " +
                "Entry ID: " + entry.getId() + " | " +
                "Initiative: " + initiative.getInitiativeNumber() + " | " +
                "F&A User: " + faUser.getEmail());
            
            LOGGER.info(String.format("F&A notification sent to %s for entry %d", 
                faUser.getEmail(), entry.getId()));
            
            return true;
            
        } catch (IOException e) {
            loggingService.error("Failed to send F&A notification email - Entry ID: " + 
                entry.getId(), e);
            LOGGER.log(Level.SEVERE, "Failed to send F&A notification email", e);
            return false;
        } catch (Exception e) {
            loggingService.error("Error in F&A notification process - Entry ID: " + 
                entry.getId(), e);
            LOGGER.log(Level.WARNING, "Error in F&A notification process", e);
            return false;
        }
    }
    
    /**
     * Send confirmation email after F&A approves an entry
     */
    public boolean sendApprovalConfirmationEmail(MonthlyMonitoringEntry entry, User faUser) {
        try {
            Initiative initiative = entry.getInitiative();
            String enteredBy = entry.getEnteredBy();
            
            // Get Initiative Lead user
            Optional<User> ilUserOpt = userRepository.findByEmail(enteredBy);
            if (!ilUserOpt.isPresent()) {
                return false;
            }
            
            User ilUser = ilUserOpt.get();
            
            String subject = "Monthly Entry Approved by F&A [" + 
                initiative.getInitiativeNumber() + "]";
            String emailBody = createApprovalConfirmationTemplate(
                ilUser.getFullName(),
                entry,
                initiative,
                faUser.getFullName()
            );
            
            MailHelper.send(subject, emailBody, ilUser.getEmail(), null, "dnsharma@godeepak.com");
            
            loggingService.info("Approval confirmation sent - Entry ID: " + entry.getId());
            return true;
            
        } catch (Exception e) {
            loggingService.error("Failed to send approval confirmation - Entry ID: " + 
                entry.getId(), e);
            return false;
        }
    }
    
    /**
     * Send notification when F&A requests edit
     */
    public boolean sendEditRequestEmail(MonthlyMonitoringEntry entry, String faComments, User faUser) {
        try {
            Initiative initiative = entry.getInitiative();
            String enteredBy = entry.getEnteredBy();
            
            // Get Initiative Lead user
            Optional<User> ilUserOpt = userRepository.findByEmail(enteredBy);
            if (!ilUserOpt.isPresent()) {
                return false;
            }
            
            User ilUser = ilUserOpt.get();
            
            String subject = "Edit Requested by F&A - Action Required [" + 
                initiative.getInitiativeNumber() + "]";
            String emailBody = createEditRequestTemplate(
                ilUser.getFullName(),
                entry,
                initiative,
                faUser.getFullName(),
                faComments
            );
            
            MailHelper.send(subject, emailBody, ilUser.getEmail(), null, "dnsharma@godeepak.com");
            
            loggingService.info("Edit request notification sent - Entry ID: " + entry.getId());
            return true;
            
        } catch (Exception e) {
            loggingService.error("Failed to send edit request notification - Entry ID: " + 
                entry.getId(), e);
            return false;
        }
    }
    
    /**
     * Create F&A notification email template
     */
    private String createFANotificationEmailTemplate(
            String faUserName,
            MonthlyMonitoringEntry entry,
            Initiative initiative,
            String approveToken,
            String editRequestToken) {
        
        DecimalFormat currencyFormat = new DecimalFormat("#,##0.00");
        String approveUrl = baseUrl + "/api/monthly-monitoring/email-action/approve?token=" + approveToken;
        String editRequestUrl = baseUrl + "/api/monthly-monitoring/email-action/request-edit?token=" + editRequestToken;
        
        StringBuilder template = new StringBuilder();
        template.append("<!DOCTYPE html>\n");
        template.append("<html>\n");
        template.append("<head>\n");
        template.append("    <meta charset=\"UTF-8\">\n");
        template.append("    <title>Monthly Monitoring Entry - F&A Approval Required</title>\n");
        template.append("</head>\n");
        template.append("<body style=\"font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: " + "#333" + "; max-width: 700px; margin: 0 auto; padding: 20px;\">\n");
        template.append("    \n");
        template.append("    <div style=\"background: linear-gradient(135deg, " + "#667eea" + " 0%, " + "#764ba2" + " 100%); padding: 25px; border-radius: 8px 8px 0 0; text-align: center;\">\n");
        template.append("        <h1 style=\"color: white; margin: 0; font-size: 24px;\">📊 Monthly Monitoring Entry Finalized</h1>\n");
        template.append("        <p style=\"color: " + "#f0f0f0" + "; margin: 8px 0 0 0; font-size: 14px;\">Action Required: F&A Approval</p>\n");
        template.append("    </div>\n");
        template.append("    \n");
        template.append("    <div style=\"background: " + "#ffffff" + "; border: 1px solid " + "#e0e0e0" + "; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;\">\n");
        template.append("        \n");
        template.append("        <p>Dear <strong>%s</strong>,</p>\n");
        template.append("        \n");
        template.append("        <p>A monthly monitoring entry has been finalized by the Initiative Lead and requires your approval as F&A.</p>\n");
        template.append("        \n");
        template.append("        <h3 style=\"color: " + "#667eea" + "; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid " + "#667eea" + "; padding-bottom: 8px;\">📋 Initiative Details</h3>\n");
        template.append("        \n");
        template.append("        <table style=\"width: 100%%; border-collapse: collapse; margin: 20px 0; background: " + "#f8f9ff" + ";\">\n");
        template.append("            <tr style=\"background: " + "#e8ecff" + ";\">\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#d0d7ff" + "; font-weight: bold; width: 35%%;\">Initiative Number</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#d0d7ff" + ";\">%s</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#d0d7ff" + "; font-weight: bold;\">Initiative Title</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#d0d7ff" + ";\">%s</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr style=\"background: " + "#e8ecff" + ";\">\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#d0d7ff" + "; font-weight: bold;\">Site</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#d0d7ff" + ";\">%s</td>\n");
        template.append("            </tr>\n");
        template.append("        </table>\n");
        template.append("        \n");
        template.append("        <h3 style=\"color: " + "#667eea" + "; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid " + "#667eea" + "; padding-bottom: 8px;\">💰 Monitoring Entry Details</h3>\n");
        template.append("        \n");
        template.append("        <table style=\"width: 100%%; border-collapse: collapse; margin: 20px 0; background: " + "#fffbf0" + ";\">\n");
        template.append("            <tr style=\"background: " + "#fff8e1" + ";\">\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold; width: 35%%;\">Monitoring Month</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + ";\">%s</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold;\">Category</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + ";\">%s</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr style=\"background: " + "#fff8e1" + ";\">\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold;\">KPI Description</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + ";\">%s</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold;\">Target Value</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold; color: " + "#1976d2" + ";\">₹ %s</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr style=\"background: " + "#fff8e1" + ";\">\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold;\">Achieved Value</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold; color: " + "#388e3c" + ";\">₹ %s</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold;\">Deviation</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold; color: %s;\">₹ %s (%s)</td>\n");
        template.append("            </tr>\n");
        template.append("            <tr style=\"background: " + "#fff8e1" + ";\">\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + "; font-weight: bold;\">Remarks</td>\n");
        template.append("                <td style=\"padding: 12px; border: 1px solid " + "#ffe0b2" + ";\">%s</td>\n");
        template.append("            </tr>\n");
        template.append("        </table>\n");
        template.append("        \n");
        template.append("        <h3 style=\"color: " + "#667eea" + "; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid " + "#667eea" + "; padding-bottom: 8px;\">⚡ Quick Actions</h3>\n");
        template.append("        \n");
        template.append("        <div style=\"text-align: center; margin: 30px 0;\">\n");
        template.append("            \n");
        template.append("            <!-- Approve Button -->\n");
        template.append("            <a href=\"%s\" style=\"display: inline-block; background: linear-gradient(135deg, " + "#10b981" + " 0%, " + "#059669" + " 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: all 0.3s ease;\">\n");
        template.append("                ✓ APPROVE ENTRY\n");
        template.append("            </a>\n");
        template.append("            \n");
        template.append("            <!-- Request Edit Button -->\n");
        template.append("            <a href=\"%s\" style=\"display: inline-block; background: linear-gradient(135deg, " + "#f59e0b" + " 0%, " + "#d97706" + " 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3); transition: all 0.3s ease;\">\n");
        template.append("                ✎ REQUEST EDIT\n");
        template.append("            </a>\n");
        template.append("            \n");
        template.append("        </div>\n");
        template.append("        \n");
        template.append("        <div style=\"background: " + "#e3f2fd" + "; border-left: 4px solid " + "#2196f3" + "; padding: 15px; margin: 25px 0; border-radius: 4px;\">\n");
        template.append("            <p style=\"margin: 0; color: " + "#1565c0" + "; font-size: 13px;\">\n");
        template.append("                <strong>📌 Note:</strong><br>\n");
        template.append("                • Click <strong>APPROVE ENTRY</strong> to automatically approve this monitoring entry<br>\n");
        template.append("                • Click <strong>REQUEST EDIT</strong> to re-open the entry and request changes from Initiative Lead<br>\n");
        template.append("                • These links are valid for 7 days and can only be used once\n");
        template.append("            </p>\n");
        template.append("        </div>\n");
        template.append("        \n");
        template.append("        <div style=\"background: " + "#fff3cd" + "; border-left: 4px solid " + "#ffc107" + "; padding: 15px; margin: 25px 0; border-radius: 4px;\">\n");
        template.append("            <p style=\"margin: 0; color: " + "#856404" + "; font-size: 13px;\">\n");
        template.append("                <strong>⚠️ Important:</strong> Monthly monitoring entries require F&A validation before the initiative can progress. Please review and take action at your earliest convenience.\n");
        template.append("            </p>\n");
        template.append("        </div>\n");
        template.append("        \n");
        template.append("    </div>\n");
        template.append("    \n");
        template.append("    <div style=\"background: " + "#f5f5f5" + "; padding: 20px; border-radius: 0 0 8px 8px; margin-top: 2px; text-align: center;\">\n");
        template.append("        <p style=\"font-size: 12px; color: " + "#666" + "; margin: 0;\">\n");
        template.append("            <strong>OPEX Hub - Operational Excellence Platform</strong><br>\n");
        template.append("            This is an automated notification. Please do not reply to this email.\n");
        template.append("        </p>\n");
        template.append("    </div>\n");
        template.append("    \n");
        template.append("</body>\n");
        template.append("</html>\n");
        
        // Calculate deviation color and sign
        String deviationColor = "#d32f2f"; // Red for negative
        String deviationSign = "";
        if (entry.getDeviation() != null && entry.getDeviation().doubleValue() >= 0) {
            deviationColor = "#388e3c"; // Green for positive
            deviationSign = "+";
        }
        
        String deviationPercentage = entry.getDeviationPercentage() != null ? 
            String.format("%.2f%%", entry.getDeviationPercentage()) : "0.00%";
        
        return String.format(template.toString(),
            faUserName,
            initiative.getInitiativeNumber(),
            initiative.getTitle(),
            initiative.getSite(),
            entry.getMonitoringMonth(),
            entry.getCategory() != null ? entry.getCategory() : "General",
            entry.getKpiDescription(),
            currencyFormat.format(entry.getTargetValue()),
            currencyFormat.format(entry.getAchievedValue() != null ? entry.getAchievedValue() : 0),
            deviationColor,
            deviationSign + currencyFormat.format(entry.getDeviation() != null ? entry.getDeviation().abs() : 0),
            deviationSign + deviationPercentage,
            entry.getRemarks() != null ? entry.getRemarks() : "No remarks provided",
            approveUrl,
            editRequestUrl
        );
    }
    
    /**
     * Create approval confirmation email template
     */
    private String createApprovalConfirmationTemplate(
            String ilUserName,
            MonthlyMonitoringEntry entry,
            Initiative initiative,
            String faUserName) {
        
        StringBuilder template = new StringBuilder();
        template.append("<!DOCTYPE html>\n");
        template.append("<html><head><meta charset=\"UTF-8\"></head>\n");
        template.append("<body style=\"font-family: Arial, sans-serif; font-size: 14px; color: #333; padding: 20px;\">\n");
        template.append("    <h2 style=\"color: #10b981;\">✓ Monthly Entry Approved by F&A</h2>\n");
        template.append("    <p>Dear <strong>%s</strong>,</p>\n");
        template.append("    <p>Your monthly monitoring entry has been <strong>approved</strong> by F&A.</p>\n");
        template.append("    <table style=\"border-collapse: collapse; margin: 20px 0;\">\n");
        template.append("        <tr><td style=\"padding: 8px; border: 1px solid #ddd; font-weight: bold;\">Initiative</td><td style=\"padding: 8px; border: 1px solid #ddd;\">%s</td></tr>\n");
        template.append("        <tr><td style=\"padding: 8px; border: 1px solid #ddd; font-weight: bold;\">Month</td><td style=\"padding: 8px; border: 1px solid #ddd;\">%s</td></tr>\n");
        template.append("        <tr><td style=\"padding: 8px; border: 1px solid #ddd; font-weight: bold;\">Approved By</td><td style=\"padding: 8px; border: 1px solid #ddd;\">%s</td></tr>\n");
        template.append("    </table>\n");
        template.append("    <p style=\"font-size: 12px; color: #666; margin-top: 30px;\">OPEX Hub - Automated Notification</p>\n");
        template.append("</body></html>\n");
        
        return String.format(template.toString(),
            ilUserName,
            initiative.getInitiativeNumber(),
            entry.getMonitoringMonth(),
            faUserName
        );
    }
    
    /**
     * Create edit request email template
     */
    private String createEditRequestTemplate(
            String ilUserName,
            MonthlyMonitoringEntry entry,
            Initiative initiative,
            String faUserName,
            String faComments) {
        
        StringBuilder template = new StringBuilder();
        template.append("<!DOCTYPE html>\n");
        template.append("<html><head><meta charset=\"UTF-8\"></head>\n");
        template.append("<body style=\"font-family: Arial, sans-serif; font-size: 14px; color: #333; padding: 20px;\">\n");
        template.append("    <h2 style=\"color: #f59e0b;\">✎ Edit Requested by F&A</h2>\n");
        template.append("    <p>Dear <strong>%s</strong>,</p>\n");
        template.append("    <p>F&A has requested edits to your monthly monitoring entry. The entry has been <strong>re-opened</strong> for modifications.</p>\n");
        template.append("    <table style=\"border-collapse: collapse; margin: 20px 0;\">\n");
        template.append("        <tr><td style=\"padding: 8px; border: 1px solid #ddd; font-weight: bold;\">Initiative</td><td style=\"padding: 8px; border: 1px solid #ddd;\">%s</td></tr>\n");
        template.append("        <tr><td style=\"padding: 8px; border: 1px solid #ddd; font-weight: bold;\">Month</td><td style=\"padding: 8px; border: 1px solid #ddd;\">%s</td></tr>\n");
        template.append("        <tr><td style=\"padding: 8px; border: 1px solid #ddd; font-weight: bold;\">Requested By</td><td style=\"padding: 8px; border: 1px solid #ddd;\">%s</td></tr>\n");
        template.append("        <tr><td style=\"padding: 8px; border: 1px solid #ddd; font-weight: bold;\">F&A Comments</td><td style=\"padding: 8px; border: 1px solid #ddd;\">%s</td></tr>\n");
        template.append("    </table>\n");
        template.append("    <p><strong>Action Required:</strong> Please log in to OPEX Hub and make the necessary changes, then re-finalize the entry.</p>\n");
        template.append("    <p style=\"font-size: 12px; color: #666; margin-top: 30px;\">OPEX Hub - Automated Notification</p>\n");
        template.append("</body></html>\n");
        
        return String.format(template.toString(),
            ilUserName,
            initiative.getInitiativeNumber(),
            entry.getMonitoringMonth(),
            faUserName,
            faComments != null ? faComments : "No comments provided"
        );
    }
}
