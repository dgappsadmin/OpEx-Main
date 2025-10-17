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
     * Create F&A notification email template (Outlook Classic compatible with one-click approval)
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
        template.append("<body style=\"font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;\">\n");
        template.append("    \n");
        template.append("    <h2 style=\"color: #2c5aa0; margin-bottom: 20px;\">Monthly Monitoring Entry - F&A Approval Required</h2>\n");
        template.append("    \n");
        template.append("    <p>Dear <strong>%s</strong>,</p>\n");
        template.append("    \n");
        template.append("    <p>A monthly monitoring entry has been finalized by the Initiative Lead and requires your approval as F&A.</p>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Initiative Details</h3>\n");
        template.append("    \n");
        template.append("    <table border=\"1\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; width: 100%%; max-width: 600px; border: 1px solid #ccc;\">\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold; width: 35%%;\">Initiative Number</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Initiative Title</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold;\">Site</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("    </table>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Monitoring Entry Details</h3>\n");
        template.append("    \n");
        template.append("    <table border=\"1\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; width: 100%%; max-width: 600px; border: 1px solid #ccc;\">\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold; width: 35%%;\">Monitoring Month</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Category</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold;\">KPI Description</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Target Value</td>\n");
        template.append("            <td style=\"font-weight: bold; color: #1976d2;\">₹ %s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold;\">Achieved Value</td>\n");
        template.append("            <td style=\"font-weight: bold; color: #388e3c;\">₹ %s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Deviation</td>\n");
        template.append("            <td style=\"font-weight: bold; color: %s;\">₹ %s (%s)</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold;\">Remarks</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("    </table>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Quick Actions</h3>\n");
        template.append("    \n");
        template.append("    <p style=\"line-height: 1.6;\">\n");
        template.append("        Click one of the links below to take action on this entry:\n");
        template.append("    </p>\n");
        template.append("    \n");
        template.append("    <table border=\"1\" cellpadding=\"12\" cellspacing=\"0\" style=\"border-collapse: collapse; margin: 20px 0; border: 2px solid #2c5aa0; width: 100%%; max-width: 600px;\">\n");
        template.append("        <tr style=\"background-color: #f0f8f0;\">\n");
        template.append("            <td style=\"padding: 12px;\">\n");
        template.append("                <strong style=\"color: #2c5aa0;\">1. APPROVE ENTRY</strong><br>\n");
        template.append("                <span style=\"font-size: 13px;\">Click to approve this monitoring entry</span><br>\n");
        template.append("                <a href=\"%s\" style=\"color: #10b981; text-decoration: underline; font-weight: bold;\">%s</a>\n");
        template.append("            </td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #fff8f0;\">\n");
        template.append("            <td style=\"padding: 12px;\">\n");
        template.append("                <strong style=\"color: #2c5aa0;\">2. REQUEST EDIT</strong><br>\n");
        template.append("                <span style=\"font-size: 13px;\">Click to re-open entry and request changes</span><br>\n");
        template.append("                <a href=\"%s\" style=\"color: #f59e0b; text-decoration: underline; font-weight: bold;\">%s</a>\n");
        template.append("            </td>\n");
        template.append("        </tr>\n");
        template.append("    </table>\n");
        template.append("    \n");
        template.append("    <div style=\"background-color: #e3f2fd; border: 1px solid #90caf9; padding: 15px; margin: 20px 0;\">\n");
        template.append("        <p style=\"margin: 0; color: #1565c0; font-size: 13px;\">\n");
        template.append("            <strong>Note:</strong><br>\n");
        template.append("            • These links are valid for 7 days and can only be used once<br>\n");
        template.append("            • Clicking \"Approve\" will automatically approve the entry<br>\n");
        template.append("            • Clicking \"Request Edit\" will re-open the entry for Initiative Lead to modify\n");
        template.append("        </p>\n");
        template.append("    </div>\n");
        template.append("    \n");
        template.append("    <div style=\"background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0;\">\n");
        template.append("        <p style=\"margin: 0; color: #856404;\">\n");
        template.append("            <strong>Important:</strong> Monthly monitoring entries require F&A validation before the initiative can progress. \n");
        template.append("            Please review and take action at your earliest convenience.\n");
        template.append("        </p>\n");
        template.append("    </div>\n");
        template.append("    \n");
        template.append("    <hr style=\"margin: 30px 0; border: none; border-top: 1px solid #ccc;\">\n");
        template.append("    \n");
        template.append("    <p style=\"font-size: 12px; color: #666;\">\n");
        template.append("        <strong>OPEX Hub - Operational Excellence Platform</strong><br>\n");
        template.append("        This is an automated notification. Please do not reply to this email.\n");
        template.append("    </p>\n");
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
            approveUrl,
            editRequestUrl,
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
