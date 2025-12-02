import { toast } from 'react-toastify';
import mockDocuments from '../mockData/documents.json';

class DocumentService {
  constructor() {
    this.documents = [...mockDocuments];
  }

  // Get all documents
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.documents]);
      }, 300);
    });
  }

  // Get documents by client ID
  async getByClientId(clientId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const clientDocuments = this.documents.filter(doc => doc.clientId === parseInt(clientId));
        resolve([...clientDocuments]);
      }, 400);
    });
  }

  // Create new document (simulate upload)
  async create(documentData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Validate required fields
          if (!documentData.name || !documentData.clientId) {
            throw new Error('Document name and client ID are required');
          }

          // Simulate file validation
          const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'xlsx', 'ppt', 'pptx'];
          const fileExtension = documentData.name.split('.').pop()?.toLowerCase();
          
          if (!allowedTypes.includes(fileExtension)) {
            throw new Error('File type not supported');
          }

          // Generate new document
          const newDocument = {
            Id: Math.max(...this.documents.map(d => d.Id), 0) + 1,
            name: documentData.name,
            type: documentData.type || this.getDocumentType(documentData.name),
            size: documentData.size || Math.floor(Math.random() * 5000000) + 100000, // Random size 100KB-5MB
            uploadDate: new Date().toISOString(),
            clientId: parseInt(documentData.clientId),
            uploadedBy: documentData.uploadedBy || 'Current User',
            description: documentData.description || ''
          };

          this.documents.push(newDocument);
          resolve({ ...newDocument });
        } catch (error) {
          reject(error);
        }
      }, 1200); // Simulate upload time
    });
  }

  // Delete document
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.documents.findIndex(doc => doc.Id === parseInt(id));
        if (index === -1) {
          reject(new Error('Document not found'));
          return;
        }
        
        const deleted = this.documents.splice(index, 1)[0];
        resolve(deleted);
      }, 500);
    });
  }

  // Helper method to determine document type from filename
  getDocumentType(filename) {
    const extension = filename.split('.').pop()?.toLowerCase();
    const typeMap = {
      pdf: 'Contract',
      doc: 'Document',
      docx: 'Document', 
      txt: 'Document',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      xlsx: 'Spreadsheet',
      ppt: 'Presentation',
      pptx: 'Presentation'
    };
    return typeMap[extension] || 'Document';
  }
}

export default new DocumentService();