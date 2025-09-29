package com.company.opexhub.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.company.opexhub.entity.User;
import com.company.opexhub.entity.WfMaster;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.UserRepository;
import com.company.opexhub.repository.WfMasterRepository;
import com.company.opexhub.repository.WorkflowStageRepository;

/**
 * Data Initializer Component for OpEx Hub Application
 * 
 * This component initializes the application with essential data including:
 * - User accounts for different roles across multiple sites
 * - Workflow stage definitions for the 11-stage approval process
 * - Workflow master data with role-site mappings
 * 
 * NEW WORKFLOW (11 Stages):
 * 1. Register Initiative (Any User)
 * 2. Evaluation and Approval (HOD - Head of Department) - DYNAMIC ASSIGNMENT
 * 3. Initiative assessment and approval (Site TSD Lead - STLD)
 * 4. Define Responsibilities / Decide Initiative Lead (Site Head - SH)
 * 5. MOC-CAPEX Evaluation (Initiative Lead - IL) - DYNAMIC ASSIGNMENT
 * 6. Initiative Timeline Tracker (Initiative Lead - IL) - DYNAMIC ASSIGNMENT
 * 7. Progress monitoring (Site TSD Lead - STLD)
 * 8. Periodic Status Review with CMO (Corporate TSD - CTSD)
 * 9. Savings Monitoring Monthly (Initiative Lead - IL) - DYNAMIC ASSIGNMENT
 * 10. Saving Validation with F&A Monthly (Site F&A)
 * 11. Initiative Closure (Initiative Lead - IL) - DYNAMIC ASSIGNMENT
 * 
 * DYNAMIC STAGES: Stages 2, 5, 6, 9, and 11 are dynamically assigned during workflow execution
 * - Stage 2: HOD is selected during initiative creation
 * - Stages 5, 6, 9, 11: Initiative Lead (IL) is assigned during Stage 4
 * 
 * @author OpEx Development Team
 * @version 2.0
 * @since 2024
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private InitiativeRepository initiativeRepository;

    @Autowired
    private WorkflowStageRepository workflowStageRepository;

    @Autowired
    private WfMasterRepository wfMasterRepository;

    /**
     * Main execution method that initializes all necessary data for the OpEx Hub system.
     * This method is automatically called during application startup.
     * 
     * @param args Command line arguments (not used)
     * @throws Exception If any initialization process fails
     */
    @Override
    public void run(String... args) throws Exception {
        // Initialize users if database is empty
        if (userRepository.count() == 0) {
            initializeUsers();
        }
        
        // Initialize the new 11-stage workflow definitions
        initializeWorkflowStages();
        
        // Initialize workflow master data with role-site mappings
        initializeWfMaster();
    }

    /**
     * Initializes user accounts for the OpEx Hub system.
     * Creates user accounts for different roles across multiple sites (NDS, DHJ).
     * 
     * NEW ROLES INCLUDED:
     * - HOD (Head of Department) - NEW ROLE for Stage 2 approval
     * - STLD (Site TSD Lead) - For Stages 1, 3, 7
     * - SH (Site Head) - For Stage 4
     * - CTSD (Corporate TSD) - For Stage 8
     * - IL (Initiative Lead) - Dynamic assignment for Stages 5, 6, 9, 11
     * - F&A (Finance & Accounts) - For Stage 10
     * 
     * Each user is created with specific discipline expertise matching the 6 core OpEx areas.
     */
    private void initializeUsers() {
        // ===== NDS SITE USERS =====
        
        // HOD (Head of Department) users for Stage 2 - NEW ROLE
        // These users will be available for selection during initiative creation
        User[] ndsHodUsers = {
            new User("Rajesh Kumar", "rajesh.kumar.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Operation", "HOD", "Head of Department - Operation"),
            new User("Priya Sharma", "priya.sharma.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Engineering & Utility", "HOD", "Head of Department - Engineering"),
            new User("Amit Singh", "amit.singh.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Environment", "HOD", "Head of Department - Environment"),
            new User("Sunita Gupta", "sunita.gupta.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Safety", "HOD", "Head of Department - Safety"),
            new User("Vikram Patel", "vikram.patel.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Quality", "HOD", "Head of Department - Quality"),
            new User("Kavya Nair", "kavya.nair.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Others", "HOD", "Head of Department - Others")
        };

        // STLD (Site TSD Lead) users for Stages 1, 3, 7
        User[] ndsStldUsers = {
            new User("Manoj Tiwari", "manoj.tiwari@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Operation", "STLD", "Site TSD Lead"),
            new User("Deepika Singh", "deepika.singh@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Engineering & Utility", "STLD", "Site TSD Lead"),
            new User("Rohit Jain", "rohit.jain@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Environment", "STLD", "Site TSD Lead")
        };

        // SH (Site Head) users for Stage 4
        User[] ndsSiteHeads = {
            new User("Ananya Verma", "ananya.verma@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Management", "SH", "Site Head")
        };

        // CTSD (Corporate TSD) users for Stage 8
        User[] ndsCtsdUsers = {
            new User("Ravi Kumar", "ravi.kumar@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Corporate", "CTSD", "Corporate TSD")
        };

        // IL (Initiative Lead) users for dynamic assignment to Stages 5, 6, 9, 11
        User[] ndsInitiativeLeads = {
            new User("Kiran Sharma", "kiran.sharma@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Operation", "IL", "Initiative Lead"),
            new User("Neha Reddy", "neha.reddy@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Engineering & Utility", "IL", "Initiative Lead"),
            new User("Arjun Mishra", "arjun.mishra@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Environment", "IL", "Initiative Lead"),
            new User("Pooja Agarwal", "pooja.agarwal@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Safety", "IL", "Initiative Lead"),
            new User("Nikhil Reddy", "nikhil.reddy@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Quality", "IL", "Initiative Lead")
        };

        // F&A (Finance & Accounts) users for Stage 10
        User[] ndsFaUsers = {
            new User("Sonia Jain", "sonia.jain@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "Finance", "F&A", "Site F&A")
        };

        // ===== DHJ SITE USERS =====
        
        // HOD (Head of Department) users for Stage 2 - NEW ROLE
        User[] dhjHodUsers = {
            new User("Deepak Singh", "deepak.singh.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Operation", "HOD", "Head of Department - Operation"),
            new User("Ritu Nair", "ritu.nair.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Engineering & Utility", "HOD", "Head of Department - Engineering"),
            new User("Karan Sharma", "karan.sharma.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Environment", "HOD", "Head of Department - Environment"),
            new User("Meera Gupta", "meera.gupta.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Safety", "HOD", "Head of Department - Safety"),
            new User("Rahul Verma", "rahul.verma.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Quality", "HOD", "Head of Department - Quality"),
            new User("Sneha Patel", "sneha.patel.hod@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Others", "HOD", "Head of Department - Others")
        };

        // STLD (Site TSD Lead) users for Stages 1, 3, 7
        User[] dhjStldUsers = {
            new User("Sunil Kumar", "sunil.kumar@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Operation", "STLD", "Site TSD Lead"),
            new User("Priya Singh", "priya.singh@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Engineering & Utility", "STLD", "Site TSD Lead"),
            new User("Ajay Sharma", "ajay.sharma@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Environment", "STLD", "Site TSD Lead")
        };

        // SH (Site Head) users for Stage 4
        User[] dhjSiteHeads = {
            new User("Rekha Gupta", "rekha.gupta@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Management", "SH", "Site Head")
        };

        // CTSD (Corporate TSD) users for Stage 8
        User[] dhjCtsdUsers = {
            new User("Anil Mishra", "anil.mishra@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Corporate", "CTSD", "Corporate TSD")
        };

        // IL (Initiative Lead) users for dynamic assignment to Stages 5, 6, 9, 11
        User[] dhjInitiativeLeads = {
            new User("Manish Patel", "manish.patel@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Operation", "IL", "Initiative Lead"),
            new User("Shweta Singh", "shweta.singh@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Engineering & Utility", "IL", "Initiative Lead"),
            new User("Vikas Sharma", "vikas.sharma@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Environment", "IL", "Initiative Lead"),
            new User("Ritu Agarwal", "ritu.agarwal@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Safety", "IL", "Initiative Lead"),
            new User("Sachin Kumar", "sachin.kumar@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Quality", "IL", "Initiative Lead")
        };

        // F&A (Finance & Accounts) users for Stage 10
        User[] dhjFaUsers = {
            new User("Nisha Jain", "nisha.jain@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "Finance", "F&A", "Site F&A")
        };

        // Save all NDS users
        saveUserArray(ndsHodUsers, "NDS HOD Users");
        saveUserArray(ndsStldUsers, "NDS STLD Users");
        saveUserArray(ndsSiteHeads, "NDS Site Head Users");
        saveUserArray(ndsCtsdUsers, "NDS CTSD Users");
        saveUserArray(ndsInitiativeLeads, "NDS Initiative Lead Users");
        saveUserArray(ndsFaUsers, "NDS F&A Users");

        // Save all DHJ users
        saveUserArray(dhjHodUsers, "DHJ HOD Users");
        saveUserArray(dhjStldUsers, "DHJ STLD Users");
        saveUserArray(dhjSiteHeads, "DHJ Site Head Users");
        saveUserArray(dhjCtsdUsers, "DHJ CTSD Users");
        saveUserArray(dhjInitiativeLeads, "DHJ Initiative Lead Users");
        saveUserArray(dhjFaUsers, "DHJ F&A Users");

        System.out.println("=== OpEx Hub Users Initialized Successfully ===");
        System.out.println("NEW WORKFLOW (11 Stages) with dynamic role assignments");
        System.out.println("=== NDS SITE LOGIN CREDENTIALS ===");
        printRoleCredentials("HOD (Head of Department)", ndsHodUsers);
        printRoleCredentials("STLD (Site TSD Lead)", ndsStldUsers);
        printRoleCredentials("SH (Site Head)", ndsSiteHeads);
        printRoleCredentials("CTSD (Corporate TSD)", ndsCtsdUsers);
        printRoleCredentials("IL (Initiative Lead)", ndsInitiativeLeads);
        printRoleCredentials("F&A (Finance & Accounts)", ndsFaUsers);
        
        System.out.println("=== DHJ SITE LOGIN CREDENTIALS ===");
        printRoleCredentials("HOD (Head of Department)", dhjHodUsers);
        printRoleCredentials("STLD (Site TSD Lead)", dhjStldUsers);
        printRoleCredentials("SH (Site Head)", dhjSiteHeads);
        printRoleCredentials("CTSD (Corporate TSD)", dhjCtsdUsers);
        printRoleCredentials("IL (Initiative Lead)", dhjInitiativeLeads);
        printRoleCredentials("F&A (Finance & Accounts)", dhjFaUsers);
        System.out.println("================================================");
    /**
     * Helper method to save an array of users to the database.
     * 
     * @param users Array of User objects to save
     * @param description Description of the user group for logging
     */
    private void saveUserArray(User[] users, String description) {
        for (User user : users) {
            userRepository.save(user);
        }
        System.out.println("Saved " + users.length + " " + description);
    }

    /**
     * Helper method to print login credentials for a specific role.
     * 
     * @param roleDescription Human-readable description of the role
     * @param users Array of users with that role
     */
    private void printRoleCredentials(String roleDescription, User[] users) {
        System.out.println("--- " + roleDescription + " ---");
        for (User user : users) {
            System.out.printf("Email: %s | Password: password123 | Name: %s | Discipline: %s%n", 
                user.getEmail(), user.getFullName(), user.getDiscipline());
        }
    }

    /**
     * Helper method to save WfMaster data for a specific site.
     * 
     * @param wfMasterData 2D array containing stage data [stageNumber, stageName, roleCode, userEmail]
     * @param site Site code (NDS, DHJ, etc.)
     */
    private void saveWfMasterData(String[][] wfMasterData, String site) {
        for (String[] data : wfMasterData) {
            WfMaster wfMaster = new WfMaster(
                Integer.parseInt(data[0]), // stageNumber
                data[1], // stageName
                data[2], // roleCode
                site, // site
                data[3]  // userEmail
            );
            wfMasterRepository.save(wfMaster);
        }
        System.out.println("Saved " + wfMasterData.length + " WfMaster entries for site: " + site);
    }
    }

    /**
     * Initializes workflow stage definitions for the new 11-stage approval process.
     * 
     * NEW WORKFLOW STAGE DEFINITIONS:
     * Stage 1: Register Initiative (Any User)
     * Stage 2: Evaluation and Approval (HOD - Dynamic Assignment)
     * Stage 3: Initiative assessment and approval (STLD)
     * Stage 4: Define Responsibilities (SH)
     * Stage 5: MOC-CAPEX Evaluation (IL - Dynamic Assignment)
     * Stage 6: Initiative Timeline Tracker (IL - Dynamic Assignment)
     * Stage 7: Progress monitoring (STLD)
     * Stage 8: Periodic Status Review with CMO (CTSD)
     * Stage 9: Savings Monitoring Monthly (IL - Dynamic Assignment)
     * Stage 10: Saving Validation with F&A Monthly (F&A)
     * Stage 11: Initiative Closure (IL - Dynamic Assignment)
     * 
     * Note: Stages 2, 5, 6, 9, and 11 are dynamically assigned during workflow execution
     */
    private void initializeWorkflowStages() {
        String[][] stageDefinitions = {
            {"1", "Register Initiative", "ANYONE"},
            {"2", "Evaluation and Approval", "HOD"},  // NEW: HOD role for Stage 2
            {"3", "Initiative assessment and approval", "STLD"},
            {"4", "Define Responsibilities (Decide Initiative Lead)", "SH"},
            {"5", "MOC-CAPEX Evaluation", "IL"},  // Dynamic - IL assigned at stage 4
            {"6", "Initiative Timeline Tracker", "IL"},  // Dynamic - same IL
            {"7", "Progress monitoring", "STLD"},
            {"8", "Periodic Status Review with CMO", "CTSD"},
            {"9", "Savings Monitoring (Monthly)", "IL"},  // Dynamic - IL
            {"10", "Saving Validation with F&A (Monthly)", "F&A"},  // NEW: F&A role
            {"11", "Initiative Closure", "IL"}  // Dynamic - IL
        };

        System.out.println("Workflow stages initialized with new 11-stage process including HOD and F&A roles");
    }

    /**
     * Initializes WfMaster (Workflow Master) data for role-site mappings.
     * 
     * This method creates the workflow master data that defines which users
     * are assigned to specific workflow stages at each site.
     * 
     * IMPORTANT: Dynamic stages (2, 5, 6, 9, 11) are NOT included here as they
     * are created dynamically during workflow execution:
     * - Stage 2: HOD is assigned during initiative creation
     * - Stages 5, 6, 9, 11: IL is assigned during Stage 4 approval
     * 
     * Only static stages are defined in WfMaster.
     */
    private void initializeWfMaster() {
        // Check if wf_master data already exists
        if (wfMasterRepository.count() == 0) {
            // NDS site workflow master data - UPDATED FOR NEW WORKFLOW
            String[][] ndsWfMasterData = {
                {"1", "Register Initiative", "STLD", "manoj.tiwari@godeepak.com"},
                // Stage 2: HOD - Dynamic, created during initiative creation
                {"3", "Initiative assessment and approval", "STLD", "deepika.singh@godeepak.com"},
                {"4", "Define Responsibilities (Decide Initiative Lead)", "SH", "ananya.verma@godeepak.com"},
                // Stages 5, 6: IL - Dynamic, created after Stage 4 approval
                {"7", "Progress monitoring", "STLD", "rohit.jain@godeepak.com"},
                {"8", "Periodic Status Review with CMO", "CTSD", "ravi.kumar@godeepak.com"},
                // Stage 9: IL - Dynamic, created after Stage 4 approval
                {"10", "Saving Validation with F&A (Monthly)", "F&A", "sonia.jain@godeepak.com"}
                // Stage 11: IL - Dynamic, created after Stage 4 approval
            };

            // DHJ site workflow master data - UPDATED FOR NEW WORKFLOW
            String[][] dhjWfMasterData = {
                {"1", "Register Initiative", "STLD", "sunil.kumar@godeepak.com"},
                // Stage 2: HOD - Dynamic, created during initiative creation
                {"3", "Initiative assessment and approval", "STLD", "priya.singh@godeepak.com"},
                {"4", "Define Responsibilities (Decide Initiative Lead)", "SH", "rekha.gupta@godeepak.com"},
                // Stages 5, 6: IL - Dynamic, created after Stage 4 approval
                {"7", "Progress monitoring", "STLD", "ajay.sharma@godeepak.com"},
                {"8", "Periodic Status Review with CMO", "CTSD", "anil.mishra@godeepak.com"},
                // Stage 9: IL - Dynamic, created after Stage 4 approval
                {"10", "Saving Validation with F&A (Monthly)", "F&A", "nisha.jain@godeepak.com"}
                // Stage 11: IL - Dynamic, created after Stage 4 approval
            };

            // Save NDS WF Master data
            saveWfMasterData(ndsWfMasterData, "NDS");

            // Save DHJ WF Master data
            saveWfMasterData(dhjWfMasterData, "DHJ");

            System.out.println("WF Master data initialized successfully for NDS and DHJ sites");
            System.out.println("NEW 11-STAGE WORKFLOW with dynamic HOD and IL assignments implemented");
            System.out.println("Dynamic stages (2, 5, 6, 9, 11) will be created automatically during workflow execution");
        }
    }
}