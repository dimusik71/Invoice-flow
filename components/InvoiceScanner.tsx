
import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Check, Loader2, Sparkles } from 'lucide-react';
import { extractInvoiceDataFromImage } from '../services/geminiService';

interface InvoiceScannerProps {
  onScanComplete: (data: any) => void;
  onCancel: () => void;
  apiKeyOverride?: string;
}

const InvoiceScanner: React.FC<InvoiceScannerProps> = ({ onScanComplete, onCancel, apiKeyOverride }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleScan = async () => {
    if (!preview || !file) return;

    setIsScanning(true);
    try {
      // Remove data:image/png;base64, prefix
      const base64Data = preview.split(',')[1];
      const mimeType = file.type;
      
      const jsonString = await extractInvoiceDataFromImage(base64Data, mimeType, apiKeyOverride);
      const data = JSON.parse(jsonString || '{}');
      
      // Artificial delay to simulate processing if it's too fast, mainly for UX
      onScanComplete(data);
    } catch (error) {
      console.error("Scan failed", error);
      alert("Failed to extract data. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
               <Sparkles size={20} />
            </div>
            AI Invoice Scanner
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
            >
              <div className="p-4 bg-slate-100 rounded-full mb-4 group-hover:bg-indigo-100 transition-colors">
                <Upload size={32} className="text-slate-400 group-hover:text-indigo-500" />
              </div>
              <p className="font-medium text-lg">Click to upload invoice image</p>
              <p className="text-sm text-slate-400 mt-2">Supports JPG, PNG (Max 5MB)</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
              <img src={preview} alt="Preview" className="w-full h-64 object-contain p-4" />
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-slate-600 hover:text-red-500 shadow-sm"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-white/80 backdrop-blur px-4 py-2 text-xs text-slate-500 border-t border-slate-100">
                {file?.name}
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="flex justify-end space-x-3 pt-2">
             <button 
               onClick={onCancel}
               className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
             >
               Cancel
             </button>
             <button 
               onClick={handleScan}
               disabled={!file || isScanning}
               className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
             >
               {isScanning ? (
                 <>
                   <Loader2 size={18} className="animate-spin" />
                   Processing with Gemini...
                 </>
               ) : (
                 <>
                   <Check size={18} />
                   Extract Data
                 </>
               )}
             </button>
          </div>
          
          {isScanning && (
            <div className="text-center text-xs text-slate-400 animate-pulse">
              Using Gemini 3 Pro Vision for analysis...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceScanner;
