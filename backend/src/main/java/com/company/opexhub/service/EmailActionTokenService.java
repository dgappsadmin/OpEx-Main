package com.company.opexhub.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service to manage secure tokens for email-based actions
 * Tokens have a 7-day expiry and are single-use
 */
@Service
public class EmailActionTokenService {

    private final Map<String, TokenData> tokenStore = new ConcurrentHashMap<>();
    
    // Make TokenData public so it can be accessed from controllers
    public static class TokenData {
        private final Long entryId;
        private final String action; // "APPROVE" or "REQUEST_EDIT"
        private final LocalDateTime expiryTime;
        private boolean used;
        
        public TokenData(Long entryId, String action, LocalDateTime expiryTime) {
            this.entryId = entryId;
            this.action = action;
            this.expiryTime = expiryTime;
            this.used = false;
        }
        
        public Long getEntryId() { return entryId; }
        public String getAction() { return action; }
        public LocalDateTime getExpiryTime() { return expiryTime; }
        public boolean isUsed() { return used; }
        public void markAsUsed() { this.used = true; }
        public boolean isExpired() { return LocalDateTime.now().isAfter(expiryTime); }
    }
    
    /**
     * Generate a secure token for email action
     * @param entryId The monitoring entry ID
     * @param action The action type (APPROVE or REQUEST_EDIT)
     * @return Secure token string
     */
    public String generateToken(Long entryId, String action) {
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryTime = LocalDateTime.now().plusDays(7); // 7 days validity
        tokenStore.put(token, new TokenData(entryId, action, expiryTime));
        return token;
    }
    
    /**
     * Validate and consume a token
     * @param token The token to validate
     * @return TokenData if valid, null otherwise
     */
    public TokenData validateAndConsumeToken(String token) {
        TokenData tokenData = tokenStore.get(token);
        
        if (tokenData == null) {
            return null; // Token not found
        }
        
        if (tokenData.isExpired()) {
            tokenStore.remove(token);
            return null; // Token expired
        }
        
        if (tokenData.isUsed()) {
            return null; // Token already used
        }
        
        // Mark token as used
        tokenData.markAsUsed();
        
        return tokenData;
    }
    
    /**
     * Get token data without consuming it (for preview/info purposes)
     */
    public TokenData getTokenData(String token) {
        TokenData tokenData = tokenStore.get(token);
        
        if (tokenData == null || tokenData.isExpired() || tokenData.isUsed()) {
            return null;
        }
        
        return tokenData;
    }
    
    /**
     * Clean up expired and used tokens (should be called periodically)
     */
    public void cleanupExpiredTokens() {
        int beforeCount = tokenStore.size();
        tokenStore.entrySet().removeIf(entry -> 
            entry.getValue().isExpired() || entry.getValue().isUsed());
        int afterCount = tokenStore.size();
        
        if (beforeCount > afterCount) {
            System.out.println("Email action tokens cleanup - Removed " + 
                (beforeCount - afterCount) + " expired/used tokens");
        }
    }
}
