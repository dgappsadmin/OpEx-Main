package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.InitiativeFile;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.List;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileUploadController {

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private InitiativeRepository initiativeRepository;

    @PostMapping("/upload/{initiativeId}")
    public ResponseEntity<ApiResponse> uploadFiles(
            @PathVariable Long initiativeId,
            @RequestParam("files") List<MultipartFile> files) {
        try {
            // Validate inputs
            if (files == null || files.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, "No files provided for upload", null));
            }

            Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found with ID: " + initiativeId));

            List<InitiativeFile> uploadedFiles = fileUploadService.uploadFiles(files, initiative);
            
            System.out.println("Successfully uploaded " + uploadedFiles.size() + " files for initiative: " + initiativeId);
            
            return ResponseEntity.ok(new ApiResponse(true, 
                "Successfully uploaded " + uploadedFiles.size() + " file(s)", 
                uploadedFiles));
                
        } catch (RuntimeException e) {
            System.err.println("File upload error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(false, e.getMessage(), null));
        } catch (Exception e) {
            System.err.println("Unexpected error during file upload: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Internal server error during file upload", null));
        }
    }

    @GetMapping("/initiative/{initiativeId}")
    public ResponseEntity<ApiResponse> getFilesByInitiative(@PathVariable Long initiativeId) {
        try {
            List<InitiativeFile> files = fileUploadService.getFilesByInitiativeId(initiativeId);
            return ResponseEntity.ok(new ApiResponse(true, "Files retrieved successfully", files));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId) {
        try {
            // Get file record directly by ID
            InitiativeFile fileRecord = fileUploadService.getFileById(fileId);
            
            // Get file bytes from disk
            byte[] fileBytes = fileUploadService.downloadFile(fileId);
            
            // Sanitize filename for download - replace spaces and special characters
            String sanitizedFileName = fileRecord.getFileName()
                .replaceAll("[<>:\"/\\\\|?*]", "_")  // Replace illegal characters
                .replaceAll("\\s+", "_")             // Replace spaces with underscores
                .replaceAll("_{2,}", "_");           // Replace multiple underscores with single
            
            // Set proper headers for download
            HttpHeaders headers = new HttpHeaders();
            
            // Set content type
            String contentType = fileRecord.getFileType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/octet-stream";
            }
            headers.setContentType(MediaType.parseMediaType(contentType));
            
            // Set content disposition with both the original and sanitized filename
            headers.add("Content-Disposition", 
                String.format("attachment; filename=\"%s\"; filename*=UTF-8''%s", 
                    sanitizedFileName, 
                    java.net.URLEncoder.encode(sanitizedFileName, "UTF-8")));
            
            headers.setContentLength(fileBytes.length);
            
            // Add cache control headers
            headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(fileBytes);
                
        } catch (RuntimeException e) {
            System.err.println("File download error: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Unexpected error during file download: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<ApiResponse> deleteFile(@PathVariable Long fileId) {
        try {
            fileUploadService.deleteFile(fileId);
            return ResponseEntity.ok(new ApiResponse(true, "File deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}