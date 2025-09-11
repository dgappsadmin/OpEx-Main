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
            Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));

            List<InitiativeFile> uploadedFiles = fileUploadService.uploadFiles(files, initiative);
            
            return ResponseEntity.ok(new ApiResponse(true, "Files uploaded successfully", uploadedFiles));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse(false, e.getMessage(), null));
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
            // Get file record from database first to get filename and content type
            List<InitiativeFile> allFiles = fileUploadService.getFilesByInitiativeId(null);
            InitiativeFile fileRecord = null;
            
            // Find the file record (this is a simple approach, you might want to add a direct method)
            for (InitiativeFile file : allFiles) {
                if (file.getId().equals(fileId)) {
                    fileRecord = file;
                    break;
                }
            }
            
            if (fileRecord == null) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] fileBytes = fileUploadService.downloadFile(fileId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(fileRecord.getFileType()));
            headers.setContentDispositionFormData("attachment", fileRecord.getFileName());
            headers.setContentLength(fileBytes.length);
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(fileBytes);
        } catch (Exception e) {
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