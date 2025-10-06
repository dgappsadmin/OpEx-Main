package com.company.opexhub.controller;

import com.company.opexhub.dto.*;
import com.company.opexhub.entity.User;
import com.company.opexhub.service.AuthService;
import com.company.opexhub.service.EmailVerificationService;
import com.company.opexhub.service.TokenInvalidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthService authService;

    @Autowired
    EmailVerificationService emailVerificationService;
    
    @Autowired
    TokenInvalidationService tokenInvalidationService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
            
            // Create response with token and user data structured for frontend
            java.util.Map<String, Object> responseData = new java.util.HashMap<>();
            responseData.put("token", jwtResponse.getToken());
            
            // Create user object without token for frontend
            java.util.Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("id", jwtResponse.getId());
            userData.put("email", jwtResponse.getEmail());
            userData.put("fullName", jwtResponse.getFullName());
            userData.put("site", jwtResponse.getSite());
            userData.put("discipline", jwtResponse.getDiscipline());
            userData.put("role", jwtResponse.getRole());
            userData.put("roleName", jwtResponse.getRoleName());
            
            responseData.put("user", userData);
            
            return ResponseEntity.ok(new ApiResponse(true, "Login successful", responseData));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Invalid credentials!"));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        try {
            User result = authService.registerUser(signUpRequest);
            return ResponseEntity.ok(new ApiResponse(true, "User registered successfully", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Send email verification code for new registration
     */
    @PostMapping("/send-verification-code")
    public ResponseEntity<?> sendVerificationCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String fullName = request.get("fullName");
            String site = request.get("site");
            String discipline = request.get("discipline");
            String role = request.get("role");
            String roleName = request.get("roleName");
            String password = request.get("password");

            // Validate required fields
            if (email == null || fullName == null || site == null || discipline == null || 
                role == null || roleName == null || password == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "All registration fields are required"));
            }

            // Validate email domain
            if (!emailVerificationService.isValidEmailDomain(email)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Only @godeepak.com email addresses are allowed for registration"));
            }

            boolean sent = emailVerificationService.sendVerificationCode(email, fullName, site, discipline, role, roleName, password);
            
            if (sent) {
                return ResponseEntity.ok(new ApiResponse(true, "Verification code sent to your email"));
            } else {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Failed to send verification code. User may already exist."));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error sending verification code"));
        }
    }

    /**
     * Verify email verification code and complete registration
     */
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");

            if (email == null || code == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Email and verification code are required"));
            }

            // Validate email domain
            if (!emailVerificationService.isValidEmailDomain(email)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Invalid email domain"));
            }

            User newUser = emailVerificationService.completeRegistration(email, code);
            
            if (newUser != null) {
                return ResponseEntity.ok(new ApiResponse(true, "Email verified successfully. Registration completed!", newUser));
            } else {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Invalid or expired verification code"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error verifying email"));
        }
    }

    /**
     * Resend email verification code
     */
    @PostMapping("/resend-verification-code")
    public ResponseEntity<?> resendVerificationCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Email is required"));
            }

            // Validate email domain
            if (!emailVerificationService.isValidEmailDomain(email)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Invalid email domain"));
            }

            boolean sent = emailVerificationService.resendVerificationCode(email);
            
            if (sent) {
                return ResponseEntity.ok(new ApiResponse(true, "Verification code resent to your email"));
            } else {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Failed to resend verification code"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error resending verification code"));
        }
    }

    /**
     * Mass logout endpoint - Logs out all users regardless of role
     * Only accessible by ADMIN role (hasRole=ADMIN)
     * This will invalidate all existing JWT tokens server-side
     */
    @PostMapping("/logout-all-users")
    public ResponseEntity<?> logoutAllUsers() {
        try {
            // Trigger mass logout - this will invalidate all tokens issued before this moment
            tokenInvalidationService.triggerMassLogout();
            return ResponseEntity.ok(new ApiResponse(true, "All users logged out successfully. All existing tokens are now invalid."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error during mass logout"));
        }
    }
}