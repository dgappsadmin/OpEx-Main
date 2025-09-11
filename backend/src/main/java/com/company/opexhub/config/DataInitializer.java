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

    @Override
    public void run(String... args) throws Exception {
        // Check if users already exist
        if (userRepository.count() == 0) {
            initializeUsers();
        }
        
        // Check if workflow stages need to be initialized for existing initiatives
        initializeWorkflowStages();
        
        // Initialize workflow master data
        initializeWfMaster();
    }

    private void initializeUsers() {
        // Create NDS site users (existing users)
        User[] ndsUsers = {
            // Stage 1: Register Initiative - STLD (Site TSD Lead) - Can CREATE initiatives (but anyone can register)
            new User("Manoj Tiwari", "manoj.tiwari@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "TSD", "STLD", "Site TSD Lead"),
            
            // Stage 2: Initiative assessment and approval - CTSD (Corporate TSD)
            new User("Kavya Nair", "kavya.nair@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "CORP", "CTSD", "Corporate TSD"),
            
            // Stage 3: Approval - SH (Site Head)
            new User("Priya Sharma", "priya.sharma@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "MGMT", "SH", "Site Head"),
            
            // Stage 4: Define Responsibilities - CTSD (Corporate TSD) - Assigns IL
            new User("Ravi Kumar", "ravi.kumar@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "CORP", "CTSD", "Corporate TSD"),
            
            // Stage 5: MOC-CAPEX Evaluation - IL (Initiative Lead) - Dynamic
            new User("Rajesh Kumar", "rajesh.kumar@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "MECH", "IL", "Initiative Lead"),
            
            // Additional Initiative Leads for dynamic assignment
            new User("Amit Patel", "amit.patel@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "ENG", "IL", "Initiative Lead"),
            new User("Sunita Gupta", "sunita.gupta@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "ELEC", "IL", "Initiative Lead"),
            
            // Stage 7: Progress monitoring - STLD (Site TSD Lead)
            new User("Vikram Gupta", "vikram.gupta@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "MAINT", "STLD", "Site TSD Lead"),
            
            // Stage 8: Periodic Status Review with CMO - CTSD (Corporate TSD)
            new User("Deepika Singh", "deepika.singh@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "CORP", "CTSD", "Corporate TSD"),
            
            // Stage 10: Saving Validation with F&A - STLD (Site TSD Lead)
            new User("Rohit Jain", "rohit.jain@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "SF", "STLD", "Site TSD Lead"),
            
            // Additional users for other roles
            new User("Ananya Verma", "ananya.verma@godeepak.com", 
                    passwordEncoder.encode("password123"), "NDS", "QA", "STLD", "Site TSD Lead")
        };

        // Create DHJ site users (new users with updated workflow)
        User[] dhjUsers = {
            // Stage 1: Register Initiative - STLD (Site TSD Lead) - Can CREATE initiatives (but anyone can register)
            new User("Deepak Singh", "deepak.singh@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "TSD", "STLD", "Site TSD Lead"),
            
            // Stage 2: Initiative assessment and approval - CTSD (Corporate TSD)
            new User("Ritu Nair", "ritu.nair@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "CORP", "CTSD", "Corporate TSD"),
            
            // Stage 3: Approval - SH (Site Head)
            new User("Meera Gupta", "meera.gupta@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "MGMT", "SH", "Site Head"),
            
            // Stage 4: Define Responsibilities - CTSD (Corporate TSD) - Assigns IL
            new User("Arjun Mishra", "arjun.mishra@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "CORP", "CTSD", "Corporate TSD"),
            
            // Stage 5: MOC-CAPEX Evaluation - IL (Initiative Lead) - Dynamic
            new User("Pooja Agarwal", "pooja.agarwal@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "MECH", "IL", "Initiative Lead"),
            
            // Additional Initiative Leads for dynamic assignment
            new User("Kiran Sharma", "kiran.sharma@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "ENG", "IL", "Initiative Lead"),
            new User("Neha Reddy", "neha.reddy@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "ELEC", "IL", "Initiative Lead"),
            
            // Stage 7: Progress monitoring - STLD (Site TSD Lead)
            new User("Karan Sharma", "karan.sharma@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "MAINT", "STLD", "Site TSD Lead"),
            
            // Stage 8: Periodic Status Review with CMO - CTSD (Corporate TSD)
            new User("Priya Singh", "priya.singh@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "CORP", "CTSD", "Corporate TSD"),
            
            // Stage 10: Saving Validation with F&A - STLD (Site TSD Lead)
            new User("Sonia Jain", "sonia.jain@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "SF", "STLD", "Site TSD Lead"),
            
            // Additional users for other roles
            new User("Nikhil Reddy", "nikhil.reddy@godeepak.com", 
                    passwordEncoder.encode("password123"), "DHJ", "QA", "STLD", "Site TSD Lead")
        };

        // Save NDS users
        for (User user : ndsUsers) {
            userRepository.save(user);
        }

        // Save DHJ users
        for (User user : dhjUsers) {
            userRepository.save(user);
        }

        System.out.println("Demo users initialized successfully with NEW 11-STAGE WORKFLOW!");
        System.out.println("=== NDS SITE LOGIN CREDENTIALS (NEW WORKFLOW) ===");
        System.out.println("Email: manoj.tiwari@godeepak.com | Password: password123 | Role: STLD - Site TSD Lead (Stage 1 - CREATE INITIATIVES - Anyone can register)");
        System.out.println("Email: kavya.nair@godeepak.com | Password: password123 | Role: CTSD - Corporate TSD (Stage 2 - Assessment)");
        System.out.println("Email: priya.sharma@godeepak.com | Password: password123 | Role: SH - Site Head (Stage 3 - Approval)");
        System.out.println("Email: ravi.kumar@godeepak.com | Password: password123 | Role: CTSD - Corporate TSD (Stage 4 - Define Responsibilities)");
        System.out.println("Email: rajesh.kumar@godeepak.com | Password: password123 | Role: IL - Initiative Lead (Stage 5 - MOC-CAPEX - Dynamic)");
        System.out.println("Email: amit.patel@godeepak.com | Password: password123 | Role: IL - Initiative Lead (Stage 6 - Timeline - Dynamic)");
        System.out.println("Email: vikram.gupta@godeepak.com | Password: password123 | Role: STLD - Site TSD Lead (Stage 7 - Progress monitoring)");
        System.out.println("Email: deepika.singh@godeepak.com | Password: password123 | Role: CTSD - Corporate TSD (Stage 8 - CMO Review)");
        System.out.println("Email: rohit.jain@godeepak.com | Password: password123 | Role: STLD - Site TSD Lead (Stage 10 - F&A Validation)");
        
        System.out.println("=== DHJ SITE LOGIN CREDENTIALS (NEW WORKFLOW) ===");
        System.out.println("Email: deepak.singh@godeepak.com | Password: password123 | Role: STLD - Site TSD Lead (Stage 1 - CREATE INITIATIVES - Anyone can register)");
        System.out.println("Email: ritu.nair@godeepak.com | Password: password123 | Role: CTSD - Corporate TSD (Stage 2 - Assessment)");
        System.out.println("Email: meera.gupta@godeepak.com | Password: password123 | Role: SH - Site Head (Stage 3 - Approval)");
        System.out.println("Email: arjun.mishra@godeepak.com | Password: password123 | Role: CTSD - Corporate TSD (Stage 4 - Define Responsibilities)");
        System.out.println("Email: pooja.agarwal@godeepak.com | Password: password123 | Role: IL - Initiative Lead (Stage 5 - MOC-CAPEX - Dynamic)");
        System.out.println("Email: kiran.sharma@godeepak.com | Password: password123 | Role: IL - Initiative Lead (Stage 6 - Timeline - Dynamic)");
        System.out.println("Email: karan.sharma@godeepak.com | Password: password123 | Role: STLD - Site TSD Lead (Stage 7 - Progress monitoring)");
        System.out.println("Email: priya.singh@godeepak.com | Password: password123 | Role: CTSD - Corporate TSD (Stage 8 - CMO Review)");
        System.out.println("Email: sonia.jain@godeepak.com | Password: password123 | Role: STLD - Site TSD Lead (Stage 10 - F&A Validation)");
        System.out.println("========================");
    }

    private void initializeWorkflowStages() {
        // NEW Workflow stage definitions (11 stages total - dynamic and flexible)
        String[][] stageDefinitions = {
            {"1", "Register Initiative", "ANYONE"},  // Changed: Anyone can register
            {"2", "Initiative assessment and approval", "CTSD"},  // NEW STAGE
            {"3", "Approval", "SH"},
            {"4", "Define Responsibilities", "CTSD"},  // Changed: CTSD instead of EH
            {"5", "MOC-CAPEX Evaluation", "IL"},  // Dynamic - IL assigned at stage 4
            {"6", "Initiative Timeline Tracker", "IL"},  // Dynamic - same IL
            {"7", "Progress monitoring", "STLD"},  // Changed name from "Trial Implementation"
            {"8", "Periodic Status Review with CMO", "CTSD"},
            {"9", "Savings Monitoring (1 Month)", "IL"},  // Changed: IL instead of STLD
            {"10", "Saving Validation with F&A", "STLD"},
            {"11", "Initiative Closure", "IL"}  // Changed: IL instead of STLD
        };

        // WorkflowStage is now a master table - no need to create stages per initiative
        // The WorkflowStageService will initialize the master stages automatically
    }

    private void initializeWfMaster() {
        // Check if wf_master data already exists
        if (wfMasterRepository.count() == 0) {
            // Initialize WF Master data for NDS site with NEW 11-STAGE WORKFLOW
            // Note: IL stages (5, 6, 9, 11) are NOT included here as they are dynamic
            String[][] ndsWfMasterData = {
                {"1", "Register Initiative", "STLD", "manoj.tiwari@godeepak.com"},  // Anyone can register, but STLD as default
                {"2", "Initiative assessment and approval", "CTSD", "kavya.nair@godeepak.com"},  // NEW STAGE
                {"3", "Approval", "SH", "priya.sharma@godeepak.com"},
                {"4", "Define Responsibilities", "CTSD", "ravi.kumar@godeepak.com"},  // CTSD assigns IL
                // IL stages 5, 6 are created dynamically after Stage 4 approval
                {"7", "Progress monitoring", "STLD", "vikram.gupta@godeepak.com"},  // Changed name
                {"8", "Periodic Status Review with CMO", "CTSD", "deepika.singh@godeepak.com"},
                // Stage 9 is IL - created dynamically
                {"10", "Saving Validation with F&A", "STLD", "rohit.jain@godeepak.com"}
                // Stage 11 is IL - created dynamically
            };

            // Initialize WF Master data for DHJ site with NEW 11-STAGE WORKFLOW
            String[][] dhjWfMasterData = {
                {"1", "Register Initiative", "STLD", "deepak.singh@godeepak.com"},  // Anyone can register, but STLD as default
                {"2", "Initiative assessment and approval", "CTSD", "ritu.nair@godeepak.com"},  // NEW STAGE
                {"3", "Approval", "SH", "meera.gupta@godeepak.com"},
                {"4", "Define Responsibilities", "CTSD", "arjun.mishra@godeepak.com"},  // CTSD assigns IL
                // IL stages 5, 6 are created dynamically after Stage 4 approval
                {"7", "Progress monitoring", "STLD", "karan.sharma@godeepak.com"},  // Changed name
                {"8", "Periodic Status Review with CMO", "CTSD", "priya.singh@godeepak.com"},
                // Stage 9 is IL - created dynamically
                {"10", "Saving Validation with F&A", "STLD", "sonia.jain@godeepak.com"}
                // Stage 11 is IL - created dynamically
            };

            // Save NDS WF Master data
            for (String[] data : ndsWfMasterData) {
                WfMaster wfMaster = new WfMaster(
                    Integer.parseInt(data[0]), // stageNumber
                    data[1], // stageName
                    data[2], // roleCode
                    "NDS", // site
                    data[3]  // userEmail
                );
                wfMasterRepository.save(wfMaster);
            }

            // Save DHJ WF Master data
            for (String[] data : dhjWfMasterData) {
                WfMaster wfMaster = new WfMaster(
                    Integer.parseInt(data[0]), // stageNumber
                    data[1], // stageName
                    data[2], // roleCode
                    "DHJ", // site
                    data[3]  // userEmail
                );
                wfMasterRepository.save(wfMaster);
            }

            System.out.println("WF Master data initialized successfully for NDS and DHJ sites with NEW 11-STAGE WORKFLOW!");
            System.out.println("Dynamic IL stages (5, 6, 9, 11) will be created automatically during workflow execution.");
        }
    }
}