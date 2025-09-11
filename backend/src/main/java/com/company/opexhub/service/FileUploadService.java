package com.company.opexhub.service;

import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.InitiativeFile;
import com.company.opexhub.repository.InitiativeFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileUploadService {

    @Autowired
    private InitiativeFileRepository initiativeFileRepository;

    private static final String BASE_UPLOAD_DIR = "D:/opexhub/uploads/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    
    // Allowed file types
    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
        "application/pdf", "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain"
    );
    
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"
    );

    public List<InitiativeFile> uploadFiles(List<MultipartFile> files, Initiative initiative) throws IOException {
        List<InitiativeFile> uploadedFiles = new ArrayList<>();
        
        // Create directory if it doesn't exist
        String initiativeDir = BASE_UPLOAD_DIR + "initiative_" + initiative.getId() + "/";
        Path dirPath = Paths.get(initiativeDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        for (MultipartFile file : files) {
            // Validate file
            validateFile(file);
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;
            
            // Save file to disk
            Path filePath = dirPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Create file record
            InitiativeFile initiativeFile = new InitiativeFile(
                originalFilename,
                filePath.toString(),
                file.getContentType(),
                file.getSize(),
                initiative
            );
            
            uploadedFiles.add(initiativeFileRepository.save(initiativeFile));
        }
        
        return uploadedFiles;
    }

    public List<InitiativeFile> getFilesByInitiativeId(Long initiativeId) {
        return initiativeFileRepository.findByInitiativeId(initiativeId);
    }

    public byte[] downloadFile(Long fileId) throws IOException {
        InitiativeFile file = initiativeFileRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found"));
        
        Path filePath = Paths.get(file.getFilePath());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("File not found on disk");
        }
        
        return Files.readAllBytes(filePath);
    }

    public void deleteFile(Long fileId) throws IOException {
        InitiativeFile file = initiativeFileRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found"));
        
        // Delete file from disk
        Path filePath = Paths.get(file.getFilePath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }
        
        // Delete record from database
        initiativeFileRepository.delete(file);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds maximum allowed size of 5MB");
        }
        
        String contentType = file.getContentType();
        if (!ALLOWED_DOCUMENT_TYPES.contains(contentType) && !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new RuntimeException("File type not allowed. Only documents and images are permitted.");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}