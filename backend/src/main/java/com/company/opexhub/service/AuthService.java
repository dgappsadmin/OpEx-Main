// package com.company.opexhub.service;

// import com.company.opexhub.dto.JwtResponse;
// import com.company.opexhub.dto.LoginRequest;
// import com.company.opexhub.dto.SignUpRequest;
// import com.company.opexhub.entity.User;
// import com.company.opexhub.repository.UserRepository;
// import com.company.opexhub.security.JwtTokenProvider;
// import com.company.opexhub.security.UserPrincipal;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.stereotype.Service;

// @Service
// public class AuthService {

//     @Autowired
//     AuthenticationManager authenticationManager;

//     @Autowired
//     UserRepository userRepository;

//     @Autowired
//     PasswordEncoder passwordEncoder;

//     @Autowired
//     JwtTokenProvider tokenProvider;

//     public JwtResponse authenticateUser(LoginRequest loginRequest) {
//         Authentication authentication = authenticationManager.authenticate(
//                 new UsernamePasswordAuthenticationToken(
//                         loginRequest.getEmail(),
//                         loginRequest.getPassword()
//                 )
//         );

//         SecurityContextHolder.getContext().setAuthentication(authentication);

//         String jwt = tokenProvider.generateToken(authentication);
        
//         UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
//         return new JwtResponse(jwt, userPrincipal.getId(), userPrincipal.getUsername(), 
//                              userPrincipal.getFullName(), userPrincipal.getSite(), 
//                              userPrincipal.getDiscipline(), userPrincipal.getRole(), 
//                              userPrincipal.getRoleName());
//     }

//     public User registerUser(SignUpRequest signUpRequest) {
//         if (userRepository.existsByEmail(signUpRequest.getEmail())) {
//             throw new RuntimeException("Email is already taken!");
//         }

//         // Creating user's account
//         User user = new User(signUpRequest.getFullName(), signUpRequest.getEmail(), 
//                            passwordEncoder.encode(signUpRequest.getPassword()),
//                            signUpRequest.getSite(), signUpRequest.getDiscipline(),
//                            signUpRequest.getRole(), signUpRequest.getRoleName());

//         return userRepository.save(user);
//     }
// }

package com.company.opexhub.service;

import com.company.opexhub.dto.JwtResponse;
import com.company.opexhub.dto.LoginRequest;
import com.company.opexhub.dto.SignUpRequest;
import com.company.opexhub.entity.User;
import com.company.opexhub.repository.UserRepository;
import com.company.opexhub.security.JwtTokenProvider;
import com.company.opexhub.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtTokenProvider tokenProvider;
    
    @Autowired
    LoggingService loggingService;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        try {
            loggingService.info("Login attempt - Email: " + loginRequest.getEmail());
            
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(authentication);
            
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            
            loggingService.info("Login successful - User: " + userPrincipal.getFullName() + 
                " | Email: " + loginRequest.getEmail() + " | Role: " + userPrincipal.getRole() + 
                " | Site: " + userPrincipal.getSite());
            
            return new JwtResponse(jwt, userPrincipal.getId(), userPrincipal.getUsername(), 
                                 userPrincipal.getFullName(), userPrincipal.getSite(), 
                                 userPrincipal.getDiscipline(), userPrincipal.getRole(), 
                                 userPrincipal.getRoleName());
        } catch (Exception e) {
            loggingService.warning("Login failed - Email: " + loginRequest.getEmail() + " | Reason: " + e.getMessage());
            throw e;
        }
    }

    public User registerUser(SignUpRequest signUpRequest) {
        loggingService.info("User registration attempt - Email: " + signUpRequest.getEmail() + 
            " | Name: " + signUpRequest.getFullName() + " | Role: " + signUpRequest.getRole() + 
            " | Site: " + signUpRequest.getSite());
        
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            loggingService.warning("Registration failed - Email already exists: " + signUpRequest.getEmail());
            throw new RuntimeException("Email is already taken!");
        }

        // Creating user's account
        User user = new User(signUpRequest.getFullName(), signUpRequest.getEmail(), 
                           passwordEncoder.encode(signUpRequest.getPassword()),
                           signUpRequest.getSite(), signUpRequest.getDiscipline(),
                           signUpRequest.getRole(), signUpRequest.getRoleName());

        User savedUser = userRepository.save(user);
        loggingService.info("User registered successfully - ID: " + savedUser.getId() + 
            " | Email: " + savedUser.getEmail() + " | Role: " + savedUser.getRole());
        
        return savedUser;
    }
}