package com.company.opexhub.controller;

import com.company.opexhub.dto.*;
import com.company.opexhub.entity.User;
import com.company.opexhub.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthService authService;

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
}