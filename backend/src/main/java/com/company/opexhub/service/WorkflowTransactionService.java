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
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Workflow Approval Required</title>
            </head>
            <body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;">
                
                <h2 style="color: #2c5aa0; margin-bottom: 20px;">Workflow Approval Required</h2>
                
                <p>Dear <strong>%s</strong>,</p>
                
                <p>A workflow stage requires your approval. Please review the details below and take the necessary action.</p>
                
                <h3 style="color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;">Initiative Details</h3>
                
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%%; max-width: 600px; border: 1px solid #ccc;">
                    <tr style="background-color: #f5f5f5;">
                        <td style="font-weight: bold; width: 30%%;">Initiative Title</td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f5f5f5;">Initiative Number</td>
                        <td>%s</td>
                    </tr>
                    <tr style="background-color: #f5f5f5;">
                        <td style="font-weight: bold;">Site</td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f5f5f5;">Expected Savings</td>
                        <td>₹%s K</td>
                    </tr>
                    <tr style="background-color: #f5f5f5;">
                        <td style="font-weight: bold;">Last Approved By</td>
                        <td>%s</td>
                    </tr>
                </table>
                
                <h3 style="color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;">Workflow Status</h3>
                
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%%; max-width: 600px; border: 1px solid #ccc;">
                    <tr style="background-color: #f5f5f5;">
                        <td style="font-weight: bold; width: 30%%;">Completed Stage</td>
                        <td style="color: #28a745;">%s ✓</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; background-color: #f5f5f5;">Pending Stage</td>
                        <td style="color: #dc3545; font-weight: bold;">%s (Awaiting Your Action)</td>
                    </tr>
                </table>
                
                <h3 style="color: #2c5aa0; margin-top: 25px; margin-bottom: 15px;">Next Steps</h3>
                
                <ol style="line-height: 1.6;">
                    <li>Access the OPEX Dashboard using the link below</li>
                    <li>Navigate to Workflow Management section</li>
                    <li>Locate this initiative and review the details</li>
                    <li>Add your comments and approve or reject the stage</li>
                </ol>
                
                <p style="margin-top: 20px;">
                    <a href="%s" style="background-color: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Access Dashboard</a>
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;">
                
                <p style="font-size: 12px; color: #666;">
                    <strong>OPEX Initiative Management System</strong><br>
                    This is an automated notification. Please do not reply to this email.<br>
                    For support, contact: dnsharma@godeepak.com
                </p>
                
            </body>
            </html>
            """, 
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
        
        // Check if next stage is an IL stage (4, 5, 6) - handle dynamically
        if (nextStageNumber >= 4 && nextStageNumber <= 6) {
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
                
                // Create Stage 2 as pending
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
        // Skip IL stages (4, 5, 6) as they are created dynamically by createStagesWithAssignedIL
        if (stageNumber >= 4 && stageNumber <= 6) {
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
                                                String actionBy, Long assignedUserId) {
        WorkflowTransaction transaction = workflowTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Workflow transaction not found"));

        if (!"pending".equals(transaction.getApproveStatus())) {
            throw new RuntimeException("Transaction is not pending");
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
            
            // Special handling for Stage 3 - Create and assign IL for stages 4, 5, 6
            if (currentStageNumber == 3 && assignedUserId != null) {
                createStagesWithAssignedIL(initiative.getId(), assignedUserId);
            } else if (currentStageNumber == 4) {
                // After Stage 4 (MOC), activate Stage 5 (CAPEX)
                activateNextILStage(initiative.getId(), 5);
            } else if (currentStageNumber == 5) {
                // After Stage 5 (CAPEX), activate Stage 6 (Timeline)
                activateNextILStage(initiative.getId(), 6);
            } else if (currentStageNumber == 6) {
                // After Stage 6 (Timeline), create Stage 7 for STLD
                createStageForRole(initiative.getId(), 7, "Trial Implementation & Performance Check", "STLD");
            } else if (currentStageNumber == 7) {
                // After Stage 7 (Trial Implementation), create Stage 8 for CTSD
                createStageForRole(initiative.getId(), 8, "Periodic Status Review with CMO", "CTSD");
            } else if (currentStageNumber == 8) {
                // After Stage 8 (Review), create Stage 9 for STLD
                createStageForRole(initiative.getId(), 9, "Savings Monitoring (1 Month)", "STLD");
            } else if (currentStageNumber == 9) {
                // After Stage 9 (Savings Monitoring), create Stage 10 for STLD
                createStageForRole(initiative.getId(), 10, "Saving Validation with F&A", "STLD");
            } else if (currentStageNumber == 10) {
                // After Stage 10 (Validation), create Stage 11 for STLD (final closure)
                createStageForRole(initiative.getId(), 11, "Initiative Closure", "STLD");
            } else if (currentStageNumber < 11) {
                // For other stages beyond our defined workflow, try to get from wf_master
                createNextStage(initiative.getId(), currentStageNumber + 1);
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
            
            // Legacy check for dynamic stages (keeping for backward compatibility)
            Integer totalStages = wfMasterRepository.findBySiteAndIsActiveOrderByStageNumber(
                initiative.getSite(), "Y").size();
            
            if (totalStages > 11 && currentStageNumber >= totalStages) {
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

        // Create IL stages 4, 5, 6 dynamically with the selected IL
        // DO NOT create WfMaster entries - keep workflow dynamic
        String[][] ilStages = {
            {"4", "MOC Stage", "IL"},
            {"5", "CAPEX Stage", "IL"},
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
                
                if (stageNumber == 4) {
                    // Stage 4 is pending after Stage 3 approval
                    transaction.setApproveStatus("pending");
                    transaction.setPendingWith(assignedUser.getEmail());
                } else {
                    // Stages 5, 6 are not started yet
                    transaction.setApproveStatus("not_started");
                    transaction.setPendingWith(null);
                }
                
                // Store assigned user ID for dynamic user resolution
                transaction.setAssignedUserId(assignedUserId);
                workflowTransactionRepository.save(transaction);
                
                // REMOVED: WfMaster creation to keep workflow dynamic
                // This allows future IL changes without being locked to specific users
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
                
        // Find a user with the required role and site
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

    public Integer getProgressPercentage(Long initiativeId) {
        Integer approvedStages = workflowTransactionRepository.countApprovedStages(initiativeId);
        Integer totalStages = workflowTransactionRepository.countTotalStages(initiativeId);
        
        if (totalStages == 0) return 0;
        return (approvedStages * 100) / totalStages;
    }

    public List<WorkflowTransactionDetailDTO> getInitiativesReadyForClosure() {
        // Get initiatives that have approved stage 10 and are ready for stage 11 closure
        List<WorkflowTransaction> stage10Approved = workflowTransactionRepository.findInitiativesReadyForClosure();
        return stage10Approved.stream()
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get initiatives where Stage 6 (Timeline Tracker) is approved and user is assigned as IL
     */
    public List<WorkflowTransactionDetailDTO> getInitiativesWithApprovedStage6ForUser(String userEmail, String site) {
        List<WorkflowTransaction> approvedStage6 = workflowTransactionRepository
                .findByStageNumberAndApproveStatusAndSite(6, "approved", site);
        
        return approvedStage6.stream()
                .filter(transaction -> userEmail.equals(transaction.getPendingWith()) || 
                       (transaction.getAssignedUserId() != null && 
                        userRepository.findById(transaction.getAssignedUserId())
                                .map(user -> userEmail.equals(user.getEmail()))
                                .orElse(false)))
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get initiatives where Stage 9 (Savings Monitoring) is approved and user is assigned as STLD
     */
    public List<WorkflowTransactionDetailDTO> getInitiativesWithApprovedStage9ForUser(String userEmail, String site) {
        List<WorkflowTransaction> approvedStage9 = workflowTransactionRepository
                .findByStageNumberAndApproveStatusAndSite(9, "approved", site);
        
        return approvedStage9.stream()
                .filter(transaction -> userEmail.equals(transaction.getPendingWith()) || 
                       "STLD".equals(transaction.getRequiredRole()))
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Check if user has access to Stage 6 (Timeline Tracker) for a specific initiative
     */
    public boolean hasTimelineTrackerAccess(Long initiativeId, String userEmail) {
        Optional<WorkflowTransaction> stage6Transaction = workflowTransactionRepository
                .findByInitiativeIdAndStageNumber(initiativeId, 6);
        
        if (stage6Transaction.isPresent()) {
            WorkflowTransaction transaction = stage6Transaction.get();
            // Check if stage 6 is approved and user is assigned as IL
            if ("approved".equals(transaction.getApproveStatus())) {
                if (transaction.getAssignedUserId() != null) {
                    Optional<User> assignedUser = userRepository.findById(transaction.getAssignedUserId());
                    return assignedUser.map(user -> userEmail.equals(user.getEmail())).orElse(false);
                }
                return userEmail.equals(transaction.getPendingWith());
            }
        }
        return false;
    }

    /**
     * Check if user has access to Stage 9 (Savings Monitoring) for a specific initiative
     */
    public boolean hasSavingsMonitoringAccess(Long initiativeId, String userEmail, String userRole) {
        Optional<WorkflowTransaction> stage9Transaction = workflowTransactionRepository
                .findByInitiativeIdAndStageNumber(initiativeId, 9);
        
        if (stage9Transaction.isPresent()) {
            WorkflowTransaction transaction = stage9Transaction.get();
            // Check if stage 9 is approved and user has STLD role
            return "approved".equals(transaction.getApproveStatus()) && 
                   ("STLD".equals(userRole) || userEmail.equals(transaction.getPendingWith()));
        }
        return false;
    }
}