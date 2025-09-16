package com.company.opexhub.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.opexhub.dto.WorkflowTransactionDetailDTO;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.User;
import com.company.opexhub.entity.WfMaster;
import com.company.opexhub.entity.WorkflowTransaction;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.UserRepository;
import com.company.opexhub.repository.WfMasterRepository;
import com.company.opexhub.repository.WorkflowTransactionRepository;
import mailhelper.MailHelper;
import java.io.IOException;
import java.util.logging.Logger;
import java.util.logging.Level;

@Service
public class WorkflowTransactionService {

    @Autowired
    private WorkflowTransactionRepository workflowTransactionRepository;

    @Autowired
    private InitiativeRepository initiativeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WfMasterRepository wfMasterRepository;

    /**
     * Create simple email template for workflow notifications (Outlook Classic friendly)
     */
    private String createWorkflowEmailTemplate(String recipientName, String initiativeTitle, 
                                             String initiativeNumber, String currentStageName, 
                                             String nextStageName, String senderName, String site,
                                             String expectedSavings, String dashboardUrl) {
        
        StringBuilder template = new StringBuilder();
        template.append("<!DOCTYPE html>\n");
        template.append("<html>\n");
        template.append("<head>\n");
        template.append("    <meta charset=\"UTF-8\">\n");
        template.append("    <title>Workflow Approval Required</title>\n");
        template.append("</head>\n");
        template.append("<body style=\"font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;\">\n");
        template.append("    \n");
        template.append("    <h2 style=\"color: #2c5aa0; margin-bottom: 20px;\">Workflow Approval Required</h2>\n");
        template.append("    \n");
        template.append("    <p>Dear <strong>%s</strong>,</p>\n");
        template.append("    \n");
        template.append("    <p>A workflow stage requires your approval. Please review the details below and take the necessary action.</p>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Initiative Details</h3>\n");
        template.append("    \n");
        template.append("    <table border=\"1\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; width: 100%%; max-width: 600px; border: 1px solid #ccc;\">\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold; width: 30%%;\">Initiative Title</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Initiative Number</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold;\">Site</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Expected Savings</td>\n");
        template.append("            <td>₹%s K</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold;\">Last Approved By</td>\n");
        template.append("            <td>%s</td>\n");
        template.append("        </tr>\n");
        template.append("    </table>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Workflow Status</h3>\n");
        template.append("    \n");
        template.append("    <table border=\"1\" cellpadding=\"8\" cellspacing=\"0\" style=\"border-collapse: collapse; width: 100%%; max-width: 600px; border: 1px solid #ccc;\">\n");
        template.append("        <tr style=\"background-color: #f5f5f5;\">\n");
        template.append("            <td style=\"font-weight: bold; width: 30%%;\">Completed Stage</td>\n");
        template.append("            <td style=\"color: #28a745;\">%s ✓</td>\n");
        template.append("        </tr>\n");
        template.append("        <tr>\n");
        template.append("            <td style=\"font-weight: bold; background-color: #f5f5f5;\">Pending Stage</td>\n");
        template.append("            <td style=\"color: #dc3545; font-weight: bold;\">%s (Awaiting Your Action)</td>\n");
        template.append("        </tr>\n");
        template.append("    </table>\n");
        template.append("    \n");
        template.append("    <h3 style=\"color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;\">Next Steps</h3>\n");
        template.append("    \n");
        template.append("    <ol style=\"line-height: 1.6;\">\n");
        template.append("        <li>Access the OPEX Dashboard using the link below</li>\n");
        template.append("        <li>Navigate to Workflow Management section</li>\n");
        template.append("        <li>Locate this initiative and review the details</li>\n");
        template.append("        <li>Add your comments and approve or reject the stage</li>\n");
        template.append("    </ol>\n");
        template.append("    \n");
        template.append("    <p style=\"margin-top: 20px;\">\n");
        template.append("        <a href=\"%s\" style=\"background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;\">Access Dashboard</a>\n");
        template.append("    </p>\n");
        template.append("    \n");
        template.append("    <hr style=\"margin: 30px 0; border: none; border-top: 1px solid #ccc;\">\n");
        template.append("    \n");
        template.append("    <p style=\"font-size: 12px; color: #666;\">\n");
        template.append("        <strong>OPEX Initiative Management System</strong><br>\n");
        template.append("        This is an automated notification. Please do not reply to this email.<br>\n");
        // template.append("        For support, contact: dnsharma@godeepak.com\n");
        template.append("    </p>\n");
        template.append("    \n");
        template.append("</body>\n");
        template.append("</html>\n");
        
        return String.format(template.toString(), 
            recipientName, initiativeTitle, initiativeNumber, site, expectedSavings, senderName,
            currentStageName, nextStageName, dashboardUrl);
    }

    /**
     * Send workflow notification email to next approver
     */
    private void sendWorkflowNotificationEmail(WorkflowTransaction approvedTransaction, WorkflowTransaction nextTransaction, 
                                             Initiative initiative, String approverName) {
        if (nextTransaction == null || nextTransaction.getPendingWith() == null) {
            return; // No next user to notify
        }
        
        try {
            // Get next user details
            Optional<User> nextUser = userRepository.findByEmail(nextTransaction.getPendingWith());
            String recipientName = nextUser.map(User::getFullName).orElse("Team Member");
            
            // Prepare email details
            String subject = String.format("Workflow Approval Required - %s (Stage %d: %s)", 
                initiative.getInitiativeNumber() != null ? initiative.getInitiativeNumber() : initiative.getTitle(),
                nextTransaction.getStageNumber(),
                nextTransaction.getStageName());
                
            // String dashboardUrl = "http://localhost:3000/dashboard";
             String dashboardUrl = "https://dgpilotapps.godeepak.com:8444/opexhub/";

            String emailTemplate = createWorkflowEmailTemplate(
                recipientName,
                initiative.getTitle(),
                initiative.getInitiativeNumber() != null ? initiative.getInitiativeNumber() : "N/A",
                approvedTransaction.getStageName(),
                nextTransaction.getStageName(),
                approverName,
                initiative.getSite(),
                initiative.getExpectedSavings() != null ? initiative.getExpectedSavings().toString() : "0",
                dashboardUrl
            );
            
            String toEmail = nextTransaction.getPendingWith();
            String cc = null; // Add CC emails if needed (e.g., site head, initiative lead)
            String bcc = "dnsharma@godeepak.com";
            
            // Send email
            MailHelper.send(subject, emailTemplate, toEmail, cc, bcc);
            
            Logger.getLogger(this.getClass().getName()).info(
                String.format("✅ Workflow notification email sent successfully to %s for initiative %s, stage %d (%s)", 
                    toEmail, initiative.getInitiativeNumber(), nextTransaction.getStageNumber(), nextTransaction.getStageName()));
                    
        } catch (IOException e) {
            Logger.getLogger(this.getClass().getName()).log(Level.SEVERE, 
                String.format("❌ Failed to send workflow notification email for initiative %s: %s", 
                    initiative.getInitiativeNumber(), e.getMessage()), e);
        } catch (Exception e) {
            Logger.getLogger(this.getClass().getName()).log(Level.WARNING, 
                String.format("⚠️ Error in email notification process for initiative %s: %s", 
                    initiative.getInitiativeNumber(), e.getMessage()), e);
        }
    }

    public List<WorkflowTransaction> getWorkflowTransactions(Long initiativeId) {
        return workflowTransactionRepository.findByInitiativeIdOrderByStageNumber(initiativeId);
    }
    
    public List<WorkflowTransactionDetailDTO> getVisibleWorkflowTransactions(Long initiativeId) {
        List<WorkflowTransaction> allTransactions = workflowTransactionRepository
                .findByInitiativeIdOrderByStageNumber(initiativeId);
        
        return allTransactions.stream()
                .map(this::convertToDetailDTO)
                .filter(WorkflowTransactionDetailDTO::getIsVisible)
                .collect(Collectors.toList());
    }
    
    private WorkflowTransactionDetailDTO convertToDetailDTO(WorkflowTransaction transaction) {
        WorkflowTransactionDetailDTO dto = new WorkflowTransactionDetailDTO();
        dto.setId(transaction.getId());
        dto.setInitiativeId(transaction.getInitiativeId());
        dto.setStageNumber(transaction.getStageNumber());
        dto.setStageName(transaction.getStageName());
        dto.setSite(transaction.getSite());
        dto.setApproveStatus(transaction.getApproveStatus());
        dto.setComment(transaction.getComment());
        dto.setActionBy(transaction.getActionBy());
        dto.setActionDate(transaction.getActionDate());
        dto.setPendingWith(transaction.getPendingWith());
        dto.setRequiredRole(transaction.getRequiredRole());
        dto.setAssignedUserId(transaction.getAssignedUserId());
        dto.setCreatedAt(transaction.getCreatedAt());
        dto.setUpdatedAt(transaction.getUpdatedAt());
        
        // Get initiative details
        Optional<Initiative> initiative = initiativeRepository.findById(transaction.getInitiativeId());
        if (initiative.isPresent()) {
            Initiative init = initiative.get();
            dto.setInitiativeNumber(init.getInitiativeNumber());
            dto.setInitiativeTitle(init.getTitle());
            dto.setInitiativeStatus(init.getStatus());
            dto.setExpectedSavings(init.getExpectedSavings());
            dto.setDescription(init.getDescription());
        }
        
        // Get assigned user name if available
        if (transaction.getAssignedUserId() != null) {
            Optional<User> assignedUser = userRepository.findById(transaction.getAssignedUserId());
            if (assignedUser.isPresent()) {
                dto.setAssignedUserName(assignedUser.get().getFullName());
                dto.setAssignedUserEmail(assignedUser.get().getEmail());
            }
        }
        
        // Set MOC/CAPEX information from Initiative entity instead of WorkflowTransaction
        if (initiative.isPresent()) {
            Initiative init = initiative.get();
            dto.setRequiresMoc(init.getRequiresMoc());
            dto.setMocNumber(init.getMocNumber());
            dto.setRequiresCapex(init.getRequiresCapex());
            dto.setCapexNumber(init.getCapexNumber());
        }
        
        // Set next stage information
        setNextStageInfo(dto, transaction);
        
        // Determine visibility based on workflow progression
        dto.setIsVisible(isStageVisible(transaction));
        
        return dto;
    }
    
    private void setNextStageInfo(WorkflowTransactionDetailDTO dto, WorkflowTransaction transaction) {
        Integer nextStageNumber = transaction.getStageNumber() + 1;
        
        // Check if next stage is an IL stage (5, 6, 9, 11) - handle dynamically
        if (nextStageNumber == 5 || nextStageNumber == 6 || nextStageNumber == 9 || nextStageNumber == 11) {
            // For IL stages, get info from existing WorkflowTransaction if it exists
            Optional<WorkflowTransaction> nextTransaction = workflowTransactionRepository
                    .findByInitiativeIdAndStageNumber(transaction.getInitiativeId(), nextStageNumber);
                    
            if (nextTransaction.isPresent()) {
                WorkflowTransaction nextStage = nextTransaction.get();
                dto.setNextStageName(nextStage.getStageName());
                
                // Get assigned user dynamically
                if (nextStage.getAssignedUserId() != null) {
                    Optional<User> assignedUser = userRepository.findById(nextStage.getAssignedUserId());
                    if (assignedUser.isPresent()) {
                        dto.setNextUserEmail(assignedUser.get().getEmail());
                        dto.setNextUser(assignedUser.get().getFullName());
                    }
                }
            }
        } else {
            // For non-IL stages, use WfMaster as before
            Optional<WfMaster> nextStageConfig = wfMasterRepository
                    .findBySiteAndStageNumberAndIsActive(transaction.getSite(), nextStageNumber, "Y");
                    
            if (nextStageConfig.isPresent()) {
                WfMaster nextStage = nextStageConfig.get();
                dto.setNextStageName(nextStage.getStageName());
                dto.setNextUserEmail(nextStage.getUserEmail());
                
                // Get next user name
                Optional<User> nextUser = userRepository.findByEmail(nextStage.getUserEmail());
                if (nextUser.isPresent()) {
                    dto.setNextUser(nextUser.get().getFullName());
                }
            }
        }
    }
    
    private boolean isStageVisible(WorkflowTransaction transaction) {
        // Stage 1 is always visible (auto-approved)
        if (transaction.getStageNumber() == 1) {
            return true;
        }
        
        // Check if previous stage is approved
        Optional<WorkflowTransaction> previousStage = workflowTransactionRepository
                .findByInitiativeIdAndStageNumber(transaction.getInitiativeId(), 
                    transaction.getStageNumber() - 1);
                    
        if (previousStage.isPresent()) {
            String previousStatus = previousStage.get().getApproveStatus();
            // Current stage is visible if previous stage is approved or if current stage is pending/approved
            return "approved".equals(previousStatus) || 
                   "pending".equals(transaction.getApproveStatus()) || 
                   "approved".equals(transaction.getApproveStatus());
        }
        
        return false;
    }

    public List<WorkflowTransaction> getPendingTransactionsByRole(String roleCode) {
        return workflowTransactionRepository.findPendingTransactionsByRole(roleCode);
    }

    public List<WorkflowTransaction> getPendingTransactionsBySiteAndRole(String site, String roleCode) {
        return workflowTransactionRepository.findPendingTransactionsBySiteAndRole(site, roleCode);
    }

    @Transactional
    public void createInitialWorkflowTransactions(Initiative initiative) {
        // Get workflow configuration from wf_master table
        List<WfMaster> workflowStages = wfMasterRepository.findBySiteAndIsActiveOrderByStageNumber(
            initiative.getSite(), "Y");

        if (workflowStages.isEmpty()) {
            throw new RuntimeException("No workflow configuration found for site: " + initiative.getSite());
        }

        // Only create Stage 1 initially - other stages will be created sequentially
        for (WfMaster wfStage : workflowStages) {
            if (wfStage.getStageNumber() == 1) {
                WorkflowTransaction transaction = new WorkflowTransaction(
                    initiative.getId(),
                    wfStage.getStageNumber(),
                    wfStage.getStageName(),
                    initiative.getSite(),
                    wfStage.getRoleCode(),
                    wfStage.getUserEmail()
                );

                // First stage is auto-approved and creates Stage 2
                transaction.setApproveStatus("approved");
                transaction.setActionBy(initiative.getCreatedBy().getFullName());
                transaction.setActionDate(LocalDateTime.now());
                transaction.setComment("Initiative created and registered");
                transaction.setPendingWith(null);
                
                workflowTransactionRepository.save(transaction);
                
                // Create Stage 2 as pending (NEW STAGE - Initiative assessment)
                createNextStage(initiative.getId(), 2);
                
                // Send email notification to Stage 2 approver
                Optional<WorkflowTransaction> stage2Transaction = workflowTransactionRepository
                        .findByInitiativeIdAndStageNumber(initiative.getId(), 2);
                        
                if (stage2Transaction.isPresent() && stage2Transaction.get().getPendingWith() != null) {
                    sendWorkflowNotificationEmail(transaction, stage2Transaction.get(), initiative, 
                        initiative.getCreatedBy().getFullName());
                    
                    Logger.getLogger(this.getClass().getName()).info(
                        String.format("📧 Initial workflow email sent for new initiative %s to %s", 
                            initiative.getInitiativeNumber(), stage2Transaction.get().getPendingWith()));
                } else {
                    Logger.getLogger(this.getClass().getName()).warning(
                        String.format("⚠️ Could not send initial workflow email for initiative %s - no Stage 2 approver found", 
                            initiative.getInitiativeNumber()));
                }
                
                break;
            }
        }
    }
    
    @Transactional
    private void createNextStage(Long initiativeId, Integer stageNumber) {
        // Skip IL stages (5, 6, 9, 11) as they are created dynamically by createStagesWithAssignedIL
        if (stageNumber == 5 || stageNumber == 6 || stageNumber == 9 || stageNumber == 11) {
            return; // IL stages are handled separately
        }
        
        // Get the workflow configuration for the next stage
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));
                
        Optional<WfMaster> nextStageConfig = wfMasterRepository
                .findBySiteAndStageNumberAndIsActive(initiative.getSite(), stageNumber, "Y");
                
        if (nextStageConfig.isPresent()) {
            WfMaster wfStage = nextStageConfig.get();
            
            // Check if transaction already exists
            Optional<WorkflowTransaction> existingTransaction = workflowTransactionRepository
                    .findByInitiativeIdAndStageNumber(initiativeId, stageNumber);
                    
            if (!existingTransaction.isPresent()) {
                WorkflowTransaction transaction = new WorkflowTransaction(
                    initiativeId,
                    wfStage.getStageNumber(),
                    wfStage.getStageName(),
                    initiative.getSite(),
                    wfStage.getRoleCode(),
                    wfStage.getUserEmail()
                );
                
                transaction.setApproveStatus("pending");
                transaction.setPendingWith(wfStage.getUserEmail());
                workflowTransactionRepository.save(transaction);
            }
        }
    }

    @Transactional
    public WorkflowTransaction processStageAction(Long transactionId, String action, String comment, 
                                                String actionBy, Long assignedUserId, String currentUserEmail) {
        WorkflowTransaction transaction = workflowTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Workflow transaction not found"));

        if (!"pending".equals(transaction.getApproveStatus())) {
            throw new RuntimeException("Transaction is not pending");
        }

        // Authorization check: Only the user in pendingWith can process this transaction
        if (transaction.getPendingWith() == null || !transaction.getPendingWith().equals(currentUserEmail)) {
            throw new RuntimeException("You are not authorized to process this workflow stage. Only " + 
                transaction.getPendingWith() + " can approve this stage.");
        }

        transaction.setApproveStatus(action); // "approved" or "rejected"
        transaction.setActionBy(actionBy);
        transaction.setActionDate(LocalDateTime.now());
        transaction.setComment(comment);
        transaction.setPendingWith(null);

        // Store additional data based on stage
        if (assignedUserId != null) {
            transaction.setAssignedUserId(assignedUserId);
        }

        WorkflowTransaction savedTransaction = workflowTransactionRepository.save(transaction);

        // Update initiative status and move to next stage if approved
        Initiative initiative = initiativeRepository.findById(transaction.getInitiativeId())
                .orElseThrow(() -> new RuntimeException("Initiative not found"));

        if ("approved".equals(action)) {
            Integer currentStageNumber = transaction.getStageNumber();
            
            // NEW 11-STAGE WORKFLOW PROCESSING
            if (currentStageNumber == 1) {
                // After Stage 1 (Register), create Stage 2 (Assessment)
                createNextStage(initiative.getId(), 2);
            } else if (currentStageNumber == 2) {
                // After Stage 2 (Assessment), create Stage 3 (Approval)
                createNextStage(initiative.getId(), 3);
            } else if (currentStageNumber == 3) {
                // After Stage 3 (Approval), create Stage 4 (Define Responsibilities)
                createNextStage(initiative.getId(), 4);
            } else if (currentStageNumber == 4 && assignedUserId != null) {
                // After Stage 4 (Define Responsibilities), create and assign IL for stages 5, 6
                createStagesWithAssignedIL(initiative.getId(), assignedUserId);
            } else if (currentStageNumber == 5) {
                // After Stage 5 (MOC-CAPEX), activate Stage 6 (Timeline)
                activateNextILStage(initiative.getId(), 6);
            } else if (currentStageNumber == 6) {
                // After Stage 6 (Timeline), create Stage 7 (Progress monitoring)
                createNextStage(initiative.getId(), 7);
            } else if (currentStageNumber == 7) {
                // After Stage 7 (Progress monitoring), create Stage 8 (CMO Review)
                createNextStage(initiative.getId(), 8);
            } else if (currentStageNumber == 8) {
                // After Stage 8 (CMO Review), create Stage 9 (Savings Monitoring) for IL
                createILStage(initiative.getId(), 9, "Savings Monitoring (1 Month)");
            } else if (currentStageNumber == 9) {
                // After Stage 9 (Savings Monitoring), create Stage 10 (F&A Validation)
                createNextStage(initiative.getId(), 10);
            } else if (currentStageNumber == 10) {
                // After Stage 10 (F&A Validation), create Stage 11 (Initiative Closure) for IL
                createILStage(initiative.getId(), 11, "Initiative Closure");
            }
            
            // Update initiative current stage - Cap at stage 11 (final stage)
            if (currentStageNumber < 11) {
                initiative.setCurrentStage(currentStageNumber + 1);
                initiative.setStatus("In Progress");
            } else if (currentStageNumber == 11) {
                // Stage 11 is the final stage, don't increment beyond 11
                initiative.setCurrentStage(11);
                initiative.setStatus("Completed");
            }
            
            // Send email notification to next user (only if not the final stage)
            if (currentStageNumber < 11) {
                Optional<WorkflowTransaction> nextTransaction = workflowTransactionRepository
                        .findByInitiativeIdAndStageNumber(initiative.getId(), currentStageNumber + 1);
                
                if (nextTransaction.isPresent() && nextTransaction.get().getPendingWith() != null) {
                    sendWorkflowNotificationEmail(savedTransaction, nextTransaction.get(), initiative, actionBy);
                }
            } else {
                // Final stage completed - log completion
                Logger.getLogger(this.getClass().getName()).info(
                    String.format("🎉 Initiative %s has been completed successfully (Stage 11 approved)", 
                        initiative.getInitiativeNumber()));
            }
        } else {
            // Rejected
            initiative.setStatus("Rejected");
        }

        initiativeRepository.save(initiative);
        return savedTransaction;
    }

    @Transactional
    private void createStagesWithAssignedIL(Long initiativeId, Long assignedUserId) {
        // Get the assigned user
        User assignedUser = userRepository.findById(assignedUserId)
                .orElseThrow(() -> new RuntimeException("Assigned user not found"));
                
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));

        // Create IL stages 5, 6 dynamically with the selected IL
        // DO NOT create WfMaster entries - keep workflow dynamic
        String[][] ilStages = {
            {"5", "MOC-CAPEX Evaluation", "IL"},
            {"6", "Initiative Timeline Tracker", "IL"}
        };
        
        for (String[] stageData : ilStages) {
            int stageNumber = Integer.parseInt(stageData[0]);
            String stageName = stageData[1];
            String roleCode = stageData[2];
            
            // Check if transaction already exists
            Optional<WorkflowTransaction> existingTransaction = workflowTransactionRepository
                    .findByInitiativeIdAndStageNumber(initiativeId, stageNumber);
                    
            if (!existingTransaction.isPresent()) {
                WorkflowTransaction transaction = new WorkflowTransaction(
                    initiativeId,
                    stageNumber,
                    stageName,
                    initiative.getSite(),
                    roleCode,
                    assignedUser.getEmail()  // Use assigned IL's email for reference
                );
                
                if (stageNumber == 5) {
                    // Stage 5 is pending after Stage 4 approval
                    transaction.setApproveStatus("pending");
                    transaction.setPendingWith(assignedUser.getEmail());
                } else {
                    // Stage 6 is not started yet
                    transaction.setApproveStatus("not_started");
                    transaction.setPendingWith(null);
                }
                
                // Store assigned user ID for dynamic user resolution
                transaction.setAssignedUserId(assignedUserId);
                workflowTransactionRepository.save(transaction);
            }
        }
    }

    @Transactional
    private void createILStage(Long initiativeId, Integer stageNumber, String stageName) {
        // Get the IL assigned in stage 4 for stages 9 and 11
        Optional<WorkflowTransaction> stage5Transaction = workflowTransactionRepository
                .findByInitiativeIdAndStageNumber(initiativeId, 5);
        
        if (stage5Transaction.isPresent() && stage5Transaction.get().getAssignedUserId() != null) {
            Long assignedUserId = stage5Transaction.get().getAssignedUserId();
            User assignedUser = userRepository.findById(assignedUserId)
                    .orElseThrow(() -> new RuntimeException("Assigned IL user not found"));
                    
            Initiative initiative = initiativeRepository.findById(initiativeId)
                    .orElseThrow(() -> new RuntimeException("Initiative not found"));
            
            // Check if transaction already exists
            Optional<WorkflowTransaction> existingTransaction = workflowTransactionRepository
                    .findByInitiativeIdAndStageNumber(initiativeId, stageNumber);
                    
            if (!existingTransaction.isPresent()) {
                WorkflowTransaction transaction = new WorkflowTransaction(
                    initiativeId,
                    stageNumber,
                    stageName,
                    initiative.getSite(),
                    "IL",
                    assignedUser.getEmail()
                );
                
                transaction.setApproveStatus("pending");
                transaction.setPendingWith(assignedUser.getEmail());
                transaction.setAssignedUserId(assignedUserId);
                workflowTransactionRepository.save(transaction);
            }
        }
    }

    @Transactional
    private void activateNextILStage(Long initiativeId, Integer stageNumber) {
        Optional<WorkflowTransaction> nextStage = workflowTransactionRepository
                .findByInitiativeIdAndStageNumber(initiativeId, stageNumber);
                
        if (nextStage.isPresent()) {
            WorkflowTransaction transaction = nextStage.get();
            transaction.setApproveStatus("pending");
            
            // Get the assigned user's email for pending with
            if (transaction.getAssignedUserId() != null) {
                Optional<User> assignedUser = userRepository.findById(transaction.getAssignedUserId());
                if (assignedUser.isPresent()) {
                    transaction.setPendingWith(assignedUser.get().getEmail());
                }
            }
            
            workflowTransactionRepository.save(transaction);
        }
    }

    public Optional<WorkflowTransaction> getCurrentPendingStage(Long initiativeId) {
        return workflowTransactionRepository.findCurrentPendingStage(initiativeId);
    }

    @Transactional
    private void createStageForRole(Long initiativeId, Integer stageNumber, String stageName, String roleCode) {
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));
                
        // For stages from WfMaster table, get predefined user assignments
        Optional<WfMaster> wfMasterConfig = wfMasterRepository
                .findBySiteAndStageNumberAndIsActive(initiative.getSite(), stageNumber, "Y");
        
        if (wfMasterConfig.isPresent()) {
            // Use predefined user from WfMaster table
            WfMaster wfStage = wfMasterConfig.get();
            WorkflowTransaction transaction = new WorkflowTransaction(
                initiativeId,
                stageNumber,
                stageName,
                initiative.getSite(),
                roleCode,
                wfStage.getUserEmail()
            );
            
            transaction.setApproveStatus("pending");
            transaction.setPendingWith(wfStage.getUserEmail());
            workflowTransactionRepository.save(transaction);
        } else {
            // Fallback: If no WfMaster configuration found, try to find user from Users table
            List<User> roleUsers = userRepository.findByRoleAndSite(roleCode, initiative.getSite());
            
            if (roleUsers.isEmpty()) {
                // If no specific user found, create with role-based assignment
                WorkflowTransaction transaction = new WorkflowTransaction(
                    initiativeId,
                    stageNumber,
                    stageName,
                    initiative.getSite(),
                    roleCode,
                    null  // No specific user email - will be assigned based on role
                );
                
                transaction.setApproveStatus("pending");
                transaction.setPendingWith(roleCode);  // Pending with role code
                workflowTransactionRepository.save(transaction);
            } else {
                // Create with specific user assignment (use first user found)
                User assignedUser = roleUsers.get(0);
                WorkflowTransaction transaction = new WorkflowTransaction(
                    initiativeId,
                    stageNumber,
                    stageName,
                    initiative.getSite(),
                    roleCode,
                    assignedUser.getEmail()
                );
                
                transaction.setApproveStatus("pending");
                transaction.setPendingWith(assignedUser.getEmail());
                workflowTransactionRepository.save(transaction);
            }
        }
    }

    public Integer getProgressPercentage(Long initiativeId) {
        Integer approvedStages = workflowTransactionRepository.countApprovedStages(initiativeId);
        Integer totalStages = workflowTransactionRepository.countTotalStages(initiativeId);
        
        if (totalStages == 0) return 0;
        return (approvedStages * 100) / totalStages;
    }

    public List<WorkflowTransactionDetailDTO> getInitiativesReadyForClosure() {
        // Get initiatives that have approved stage 10 and are ready for stage 11 closure
        List<WorkflowTransaction> stage10Approved = workflowTransactionRepository.findByStageNumberAndApproveStatusAndSite(10, "approved", "");
        return stage10Approved.stream()
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get initiatives where previous stage of Timeline Tracker (Stage 5) is approved and current stage is 6 - all users can view, IL can perform actions
     */
    public List<WorkflowTransactionDetailDTO> getInitiativesWithApprovedStage6ForUser(String userEmail, String site) {
        return getInitiativesForCurrentStage(6, site);
    }

    /**
     * Get initiatives where previous stage of Savings Monitoring (Stage 8) is approved and current stage is 9 - all users can view, IL can perform actions
     */
    public List<WorkflowTransactionDetailDTO> getInitiativesWithApprovedStage9ForUser(String userEmail, String site) {
        return getInitiativesForCurrentStage(9, site);
    }

    /**
     * Check if user has view access to Stage 6 (Timeline Tracker) for a specific initiative
     * All users can view if Stage 5 is approved and Stage 6 exists (current stage is 6)
     */
    public boolean hasTimelineTrackerViewAccess(Long initiativeId, String userEmail, String userRole) {
        return hasStageViewAccess(initiativeId, 6, userEmail, userRole);
    }

    /**
     * Check if user has action access to Stage 6 (Timeline Tracker) for a specific initiative
     * Only IL role can perform actions (create, edit, delete) - when Stage 5 is approved and Stage 6 exists
     */
    public boolean hasTimelineTrackerAccess(Long initiativeId, String userEmail) {
        return hasStageActionAccess(initiativeId, 6, userEmail);
    }

    /**
     * Check if user has view access to Stage 9 (Savings Monitoring) for a specific initiative
     * All users can view if Stage 8 is approved and Stage 9 exists (current stage is 9)
     */
    public boolean hasSavingsMonitoringViewAccess(Long initiativeId, String userEmail, String userRole) {
        return hasStageViewAccess(initiativeId, 9, userEmail, userRole);
    }

    /**
     * Check if user has action access to Stage 9 (Savings Monitoring) for a specific initiative
     * Only IL role can perform actions (create, edit, delete, finalize) - when Stage 8 is approved and Stage 9 exists
     */
    public boolean hasSavingsMonitoringAccess(Long initiativeId, String userEmail, String userRole) {
        return hasStageActionAccess(initiativeId, 9, userEmail);
    }

    /**
     * Generic method to get initiatives where previous stage is approved and current stage exists
     * @param currentStageNumber The stage number to check for (e.g., 6 for Timeline Tracker, 9 for Savings Monitoring)
     * @param site The site to filter by
     * @return List of initiatives where previous stage is approved and current stage exists
     */
    public List<WorkflowTransactionDetailDTO> getInitiativesForCurrentStage(Integer currentStageNumber, String site) {
        Integer previousStageNumber = currentStageNumber - 1;
        
        // Get initiatives where previous stage is approved
        List<WorkflowTransaction> approvedPreviousStage = workflowTransactionRepository
                .findByStageNumberAndApproveStatusAndSite(previousStageNumber, "approved", site);
        
        // Filter to only include initiatives where current stage exists (meaning current stage is active)
        return approvedPreviousStage.stream()
                .filter(previousTransaction -> {
                    // Check if current stage exists for this initiative
                    Optional<WorkflowTransaction> currentTransaction = workflowTransactionRepository
                            .findByInitiativeIdAndStageNumber(previousTransaction.getInitiativeId(), currentStageNumber);
                    return currentTransaction.isPresent();
                })
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Generic method to check if user has view access to a specific stage
     * @param initiativeId The initiative ID
     * @param currentStageNumber The stage number to check access for
     * @param userEmail User's email
     * @param userRole User's role
     * @return true if user has view access
     */
    public boolean hasStageViewAccess(Long initiativeId, Integer currentStageNumber, String userEmail, String userRole) {
        Integer previousStageNumber = currentStageNumber - 1;
        
        // Check if previous stage is approved
        Optional<WorkflowTransaction> previousTransaction = workflowTransactionRepository
                .findByInitiativeIdAndStageNumber(initiativeId, previousStageNumber);
        
        if (previousTransaction.isPresent() && "approved".equals(previousTransaction.get().getApproveStatus())) {
            // Check if current stage exists (indicating current stage is active)
            Optional<WorkflowTransaction> currentTransaction = workflowTransactionRepository
                    .findByInitiativeIdAndStageNumber(initiativeId, currentStageNumber);
            return currentTransaction.isPresent();
        }
        return false;
    }

    /**
     * Generic method to check if user has action access to a specific stage (for IL stages)
     * @param initiativeId The initiative ID
     * @param currentStageNumber The stage number to check access for
     * @param userEmail User's email
     * @return true if user has action access
     */
    public boolean hasStageActionAccess(Long initiativeId, Integer currentStageNumber, String userEmail) {
        Integer previousStageNumber = currentStageNumber - 1;
        
        // Check if previous stage is approved
        Optional<WorkflowTransaction> previousTransaction = workflowTransactionRepository
                .findByInitiativeIdAndStageNumber(initiativeId, previousStageNumber);
        
        if (previousTransaction.isPresent() && "approved".equals(previousTransaction.get().getApproveStatus())) {
            // Check if current stage exists and user is assigned as IL
            Optional<WorkflowTransaction> currentTransaction = workflowTransactionRepository
                    .findByInitiativeIdAndStageNumber(initiativeId, currentStageNumber);
            
            if (currentTransaction.isPresent()) {
                WorkflowTransaction transaction = currentTransaction.get();
                if (transaction.getAssignedUserId() != null) {
                    Optional<User> assignedUser = userRepository.findById(transaction.getAssignedUserId());
                    return assignedUser.map(user -> userEmail.equals(user.getEmail())).orElse(false);
                }
                return userEmail.equals(transaction.getPendingWith());
            }
        }
        return false;
    }
}