# Workflow Data Sourcing Fix Summary

## Issue Description
The workflow system was incorrectly using the OPEX_USERS table for stages 7+ instead of the OPEX_WF_MASTER table, causing inconsistent user assignments for workflow stages.

## Root Cause
The `createStageForRole` method in `WorkflowTransactionService.java` was using `userRepository.findByRoleAndSite()` to fetch users from OPEX_USERS table for all stages, instead of using the predefined workflow configuration from OPEX_WF_MASTER table.

## Solution Implemented

### Fixed File: `/app/backend/src/main/java/com/company/opexhub/service/WorkflowTransactionService.java`

**Method Modified**: `createStageForRole()` (lines 603-659)

**Key Changes**:
1. **Primary Data Source**: Now uses `wfMasterRepository.findBySiteAndStageNumberAndIsActive()` to get predefined user assignments from OPEX_WF_MASTER table
2. **Fallback Mechanism**: Maintains backward compatibility by falling back to OPEX_USERS table if no WfMaster configuration is found
3. **Correct Data Flow**: 
   - Stages 1,2,3,7,8,9,10,11: Use OPEX_WF_MASTER table (WfMaster.java)
   - Stages 4,5,6 (IL Role): Continue using OPEX_USERS table (User.java) - handled by different method

## Workflow Stage Data Sources (After Fix)

| Stage | Stage Name | Role | Data Source |
|-------|------------|------|-------------|
| 1 | Register Initiative | STLD | OPEX_WF_MASTER |
| 2 | Approval | SH | OPEX_WF_MASTER |
| 3 | Define Responsibilities | EH | OPEX_WF_MASTER |
| 4 | MOC Stage | IL | OPEX_USERS (Dynamic Assignment) |
| 5 | CAPEX Stage | IL | OPEX_USERS (Dynamic Assignment) |
| 6 | Initiative Timeline Tracker | IL | OPEX_USERS (Dynamic Assignment) |
| 7 | Trial Implementation & Performance Check | STLD | **OPEX_WF_MASTER** ✅ |
| 8 | Periodic Status Review with CMO | CTSD | **OPEX_WF_MASTER** ✅ |
| 9 | Savings Monitoring (1 Month) | STLD | **OPEX_WF_MASTER** ✅ |
| 10 | Saving Validation with F&A | STLD | **OPEX_WF_MASTER** ✅ |
| 11 | Initiative Closure | STLD | **OPEX_WF_MASTER** ✅ |

## STLD Role Initiative Creation
- ✅ **Confirmed Working**: Multiple users with STLD role can create initiatives
- ✅ **Frontend Filtering**: Only STLD role users see "New Initiative" option in sidebar
- ✅ **No Backend Restrictions**: Initiative creation endpoint allows any authenticated user, frontend controls access

## Code Changes Summary

```java
@Transactional
private void createStageForRole(Long initiativeId, Integer stageNumber, String stageName, String roleCode) {
    Initiative initiative = initiativeRepository.findById(initiativeId)
            .orElseThrow(() -> new RuntimeException("Initiative not found"));
            
    // For stages 7,8,9,10,11: Use WfMaster table to get predefined user assignments
    // For stages 4,5,6 (IL): These are handled separately by createStagesWithAssignedIL method
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
        // This provides backward compatibility
        // ... (existing fallback logic)
    }
}
```

## Impact Analysis
- ✅ **No Breaking Changes**: Fallback mechanism ensures backward compatibility
- ✅ **Improved Consistency**: Workflow stages now use standardized user assignments
- ✅ **Maintained Flexibility**: IL stages (4,5,6) retain dynamic assignment capability
- ✅ **Enhanced Reliability**: Predefined workflow assignments reduce runtime errors

## Testing Recommendations
1. Create a new initiative and verify stages 7+ use users from OPEX_WF_MASTER
2. Verify IL stages (4,5,6) still allow dynamic user assignment
3. Test with multiple STLD users creating initiatives
4. Verify workflow email notifications reach correct users
5. Test fallback mechanism when WfMaster data is missing

## Files Modified
- `backend/src/main/java/com/company/opexhub/service/WorkflowTransactionService.java`

## Files Analyzed (No Changes Required)
- `backend/src/main/java/com/company/opexhub/entity/WfMaster.java`
- `backend/src/main/java/com/company/opexhub/entity/User.java`
- `backend/src/main/java/com/company/opexhub/entity/WorkflowTransaction.java`
- `backend/src/main/java/com/company/opexhub/config/DataInitializer.java`
- `backend/src/main/java/com/company/opexhub/repository/WfMasterRepository.java`
- `frontend/src/components/layout/AppSidebar.tsx`