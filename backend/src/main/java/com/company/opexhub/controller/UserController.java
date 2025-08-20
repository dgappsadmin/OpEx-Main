package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.entity.User;
import com.company.opexhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/site/{site}")
    public ResponseEntity<List<User>> getUsersBySite(@PathVariable String site) {
        List<User> users = userRepository.findBySite(site);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        List<User> users = userRepository.findByRole(role);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/site/{site}/role/{role}")
    public ResponseEntity<List<User>> getUsersBySiteAndRole(
            @PathVariable String site, 
            @PathVariable String role) {
        List<User> users = userRepository.findBySiteAndRole(site, role);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/site/{site}/discipline/{discipline}")
    public ResponseEntity<List<User>> getUsersBySiteAndDiscipline(
            @PathVariable String site, 
            @PathVariable String discipline) {
        List<User> users = userRepository.findBySiteAndDiscipline(site, discipline);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsersByName(@RequestParam String name) {
        List<User> users = userRepository.findByFullNameContaining(name);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/initiative-leads/{site}")
    public ResponseEntity<List<User>> getInitiativeLeadsBySite(@PathVariable String site) {
        // Get IL users specifically for this site
        List<User> users = userRepository.findBySiteAndRole(site, "IL");
        return ResponseEntity.ok(users);
    }
}