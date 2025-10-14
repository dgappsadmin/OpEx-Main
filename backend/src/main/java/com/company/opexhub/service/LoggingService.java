package com.company.opexhub.service;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

/**
 * Logging service for OPEX Hub application
 * Creates daily log files for troubleshooting workflow and initiative operations
 */
@Service
public class LoggingService {
    
    // Log directory - relative to application root for flexibility
    private final String LOG_DIRECTORY = "D:\\opexhub\\";
    
    /**
     * Write INFO level log
     */
    public void info(String message) {
        writeLog("INFO", message);
    }
    
    /**
     * Write WARNING level log
     */
    public void warning(String message) {
        writeLog("WARNING", message);
    }
    
    /**
     * Write ERROR level log
     */
    public void error(String message) {
        writeLog("ERROR", message);
    }
    
    /**
     * Write ERROR level log with exception
     */
    public void error(String message, Exception e) {
        writeLog("ERROR", message + " | Exception: " + e.getMessage());
    }
    
    /**
     * Write log entry to daily log file
     */
    private void writeLog(String level, String message) {
        try {
            String logFileName = LOG_DIRECTORY + getTodayDate() + ".log";
            createDirectoryIfNotExists(LOG_DIRECTORY);

            Timestamp timestamp = new Timestamp(System.currentTimeMillis());
            String logMessage = String.format("[%s] [%s] %s%n", 
                timestamp.toString(), level, message);

            Path logFilePath = Paths.get(logFileName);

            try (BufferedWriter writer = Files.newBufferedWriter(logFilePath, 
                    java.nio.file.StandardOpenOption.CREATE, 
                    java.nio.file.StandardOpenOption.APPEND)) {
                writer.write(logMessage);
            }
        } catch (IOException e) {
            // Fallback to console logging if file writing fails
            System.err.println("Failed to write to log file: " + e.getMessage());
            System.err.println("[" + level + "] " + message);
        }
    }
    
    /**
     * Create log directory if it doesn't exist
     */
    private void createDirectoryIfNotExists(String directoryPath) throws IOException {
        Path directory = Paths.get(directoryPath);
        if (Files.notExists(directory)) {
            Files.createDirectories(directory);
        }
    }
    
    /**
     * Get today's date in dd-MMM-yyyy format for log file name
     */
    private String getTodayDate() {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
        LocalDateTime now = LocalDateTime.now();
        return dtf.format(now);
    }
}
