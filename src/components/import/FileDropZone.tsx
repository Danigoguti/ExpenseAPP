import { useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export default function FileDropZone({ onFileSelect, isLoading }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex flex-col items-center justify-center gap-4 p-8 min-h-[200px] rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
        dragActive
          ? 'border-sky-400 bg-sky-400/10'
          : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.pdf"
        onChange={handleChange}
        className="hidden"
      />

      {fileName ? (
        <>
          <FileText size={48} className="text-sky-400" />
          <p className="text-slate-200 font-medium">{fileName}</p>
          <p className="text-sm text-slate-400">Tap to select a different file</p>
        </>
      ) : (
        <>
          <Upload size={48} className="text-slate-400" />
          <div className="text-center">
            <p className="text-slate-200 font-medium">Upload Revolut Statement</p>
            <p className="text-sm text-slate-400 mt-1">
              PDF or CSV — tap to select or drag & drop
            </p>
          </div>
        </>
      )}
    </div>
  );
}
