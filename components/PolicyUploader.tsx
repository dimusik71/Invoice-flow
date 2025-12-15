
import React, { useRef, useState, DragEvent } from 'react';
import { Upload, FileText, Trash2, File as FileIcon } from 'lucide-react';
import { PolicyDocument } from '../types';

interface PolicyUploaderProps {
  files: PolicyDocument[];
  onUpload: (newFiles: PolicyDocument[]) => void;
  onRemove: (fileId: string) => void;
}

const PolicyUploader: React.FC<PolicyUploaderProps> = ({ files, onUpload, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newDocs: PolicyDocument[] = [];
    
    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf') {
        alert(`Skipped ${file.name}: Only PDF files are supported.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`Skipped ${file.name}: File too large (>10MB).`);
        continue;
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
             const result = reader.result as string;
             // Remove data URL prefix if present
             const base64 = result.includes('base64,') ? result.split(',')[1] : result;
             resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          data: base64Data
        });
      } catch (err) {
        console.error('File read error', err);
      }
    }

    if (newDocs.length > 0) {
      onUpload(newDocs);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 mb-4">
          {files.map(file => (
              <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-50 text-red-600 rounded">
                          <FileIcon size={16} />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-slate-700">{file.name}</p>
                          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB • PDF</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => onRemove(file.id)}
                      className="text-slate-400 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove file"
                  >
                      <Trash2 size={16} />
                  </button>
              </div>
          ))}
          
          {(!files || files.length === 0) && (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm text-slate-400 italic">No policy documents uploaded yet.</p>
              </div>
          )}
      </div>

      <div 
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
           <Upload size={24} />
        </div>
        <p className="font-medium text-slate-700">Click or drag PDF files here</p>
        <p className="text-xs text-slate-400 mt-1">Maximum file size 10MB</p>
      </div>

      <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => processFiles(e.target.files)}
          accept="application/pdf"
          multiple
          className="hidden" 
      />
    </div>
  );
};

export default PolicyUploader;
