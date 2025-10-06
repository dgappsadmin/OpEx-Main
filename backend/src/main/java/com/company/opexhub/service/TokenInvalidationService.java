package com.company.opexhub.service;

import org.springframework.stereotype.Service;
import java.util.Date;

@Service
public class TokenInvalidationService {
    
    // Timestamp when mass logout was triggered
    private Date massLogoutTimestamp = null;
    
    /**
     * Trigger mass logout - all tokens issued before this time will be invalid
     */
    public void triggerMassLogout() {
        this.massLogoutTimestamp = new Date();
    }
    
    /**
     * Check if a token issued at given time is still valid
     * @param tokenIssuedAt The time when token was issued
     * @return true if token is valid, false if invalidated by mass logout
     */
    public boolean isTokenValid(Date tokenIssuedAt) {
        if (massLogoutTimestamp == null) {
            return true;
        }
        return tokenIssuedAt.after(massLogoutTimestamp);
    }
    
    /**
     * Get the mass logout timestamp
     */
    public Date getMassLogoutTimestamp() {
        return massLogoutTimestamp;
    }
}
