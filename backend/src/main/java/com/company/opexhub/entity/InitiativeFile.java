package com.company.opexhub.entity;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "OPEX_INITIATIVE_FILES")
public class InitiativeFile {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "initiative_file_seq")
    @SequenceGenerator(name = "initiative_file_seq", sequenceName = "OPEX_INITIATIVE_FILE_SEQ", allocationSize = 1)
    private Long id;

    @NotBlank
    @Size(max = 255)
    @Column(name = "file_name")
    private String fileName;

    @NotBlank
    @Size(max = 500)
    @Column(name = "file_path")
    private String filePath;

    @Size(max = 100)
    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiative_id", nullable = false)
    @JsonBackReference
    private Initiative initiative;

    // Constructors
    public InitiativeFile() {}

    public InitiativeFile(String fileName, String filePath, String fileType, Long fileSize, Initiative initiative) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.initiative = initiative;
        this.uploadedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public Initiative getInitiative() { return initiative; }
    public void setInitiative(Initiative initiative) { this.initiative = initiative; }
}