import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Trash2, File, FileText, Image, Archive } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { fileAPI } from "@/lib/api";

interface UploadedFile {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface UploadedDocumentsProps {
  initiativeId: string | number | undefined;
  canUpload?: boolean;
}

export default function UploadedDocuments({ initiativeId, canUpload = true }: UploadedDocumentsProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initiativeId) {
      fetchFiles();
    }
  }, [initiativeId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      // Convert initiativeId to number if it's a string
      const id = typeof initiativeId === 'string' ? parseInt(initiativeId) : initiativeId;
      if (!id) return;
      
      const data = await fileAPI.getFilesByInitiative(id);
      setFiles(data.data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch uploaded files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit and will be skipped.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    // Validate file types
    const allowedTypes = [
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'
    ];

    const typeValidFiles = validFiles.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (typeValidFiles.length === 0) return;

    try {
      setUploading(true);
      
      // Convert initiativeId to number if it's a string
      const id = typeof initiativeId === 'string' ? parseInt(initiativeId) : initiativeId;
      if (!id) {
        throw new Error('Invalid initiative ID');
      }

      await fileAPI.uploadFiles(id, typeValidFiles);
      
      toast({
        title: "Success",
        description: `${typeValidFiles.length} file(s) uploaded successfully`,
      });
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      console.log(`Attempting to download file ID: ${fileId}, Name: ${fileName}`);
      
      // Show download starting toast
      toast({
        title: "Download Starting",
        description: `Preparing to download ${fileName}...`,
      });
      
      await fileAPI.downloadFile(fileId, fileName);
      
      // Show success toast
      toast({
        title: "Download Complete",
        description: `${fileName} downloaded successfully`,
      });
      
    } catch (error: any) {
      console.error('Error downloading file:', error);
      
      let errorMessage = "Failed to download file";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "File not found. It may have been deleted.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error occurred while downloading file.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        title: "Download Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fileId: number, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await fileAPI.deleteFile(fileId);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-3 w-3 text-blue-600" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-3 w-3 text-red-600" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-3 w-3 text-blue-600" />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <Archive className="h-3 w-3 text-green-600" />;
    } else {
      return <File className="h-3 w-3 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!initiativeId) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground text-sm">Initiative ID not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section - only show if canUpload is true */}
      {canUpload && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4" />
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.bmp"
                  onChange={handleFileUpload}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Supported: Documents (PDF, DOC, DOCX, XLS, XLSX, TXT) and Images (JPG, PNG, GIF, BMP). Max 5MB per file.
                </p>
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Uploading files...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Uploaded Files ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center p-6">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No files uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload your first document using the form above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2.5 border rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2.5 flex-1">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{file.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.fileName)}
                      className="h-6 w-6 p-0"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {canUpload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id, file.fileName)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}