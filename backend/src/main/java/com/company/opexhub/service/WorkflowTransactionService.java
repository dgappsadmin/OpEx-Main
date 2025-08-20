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
        
        // Set MOC/CAPEX information
        dto.setRequiresMoc(transaction.getRequiresMoc());
        dto.setMocNumber(transaction.getMocNumber());
        dto.setRequiresCapex(transaction.getRequiresCapex());
        dto.setCapexNumber(transaction.getCapexNumber());
        
        // Set next stage information
        setNextStageInfo(dto, transaction);
        
        // Determine visibility based on workflow progression
        dto.setIsVisible(isStageVisible(transaction));
        
        return dto;
    }
    
    private void setNextStageInfo(WorkflowTransactionDetailDTO dto, WorkflowTransaction transaction) {
        Optional<WfMaster> nextStageConfig = wfMasterRepository
                .findBySiteAndStageNumberAndIsActive(transaction.getSite(), 
                    transaction.getStageNumber() + 1, true);
                    
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
            initiative.getSite(), true);

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
                break;
            }
        }
    }
    
    @Transactional
    private void createNextStage(Long initiativeId, Integer stageNumber) {
        // Get the workflow configuration for the next stage
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));
                
        Optional<WfMaster> nextStageConfig = wfMasterRepository
                .findBySiteAndStageNumberAndIsActive(initiative.getSite(), stageNumber, true);
                
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
                                                String actionBy, Long assignedUserId, Boolean requiresMoc, 
                                                String mocNumber, Boolean requiresCapex, String capexNumber) {
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
        
        // Store MOC/CAPEX information
        if (requiresMoc != null) {
            transaction.setRequiresMoc(requiresMoc);
        }
        if (mocNumber != null) {
            transaction.setMocNumber(mocNumber);
        }
        if (requiresCapex != null) {
            transaction.setRequiresCapex(requiresCapex);
        }
        if (capexNumber != null) {
            transaction.setCapexNumber(capexNumber);
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
            } else {
                // For other stages beyond our defined workflow, try to get from wf_master
                createNextStage(initiative.getId(), currentStageNumber + 1);
            }
            
            // Update initiative current stage
            initiative.setCurrentStage(currentStageNumber + 1);
            
            // Check if this is the last stage
            Integer totalStages = wfMasterRepository.findBySiteAndIsActiveOrderByStageNumber(
                initiative.getSite(), true).size();
            
            if (currentStageNumber >= totalStages) {
                initiative.setStatus("Completed");
            } else {
                initiative.setStatus("In Progress");
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
                    assignedUser.getEmail()  // Use assigned IL's email
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
                
                transaction.setAssignedUserId(assignedUserId);
                workflowTransactionRepository.save(transaction);
                
                // Also create corresponding WfMaster entry dynamically
                Optional<WfMaster> existingWfMaster = wfMasterRepository
                        .findBySiteAndStageNumberAndIsActive(initiative.getSite(), stageNumber, true);
                        
                if (!existingWfMaster.isPresent()) {
                    WfMaster wfMaster = new WfMaster(
                        stageNumber,
                        stageName,
                        roleCode,
                        initiative.getSite(),
                        assignedUser.getEmail()
                    );
                    wfMasterRepository.save(wfMaster);
                }
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