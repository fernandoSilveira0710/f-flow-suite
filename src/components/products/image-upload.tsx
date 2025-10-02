import { useState, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  validateImageFile,
  fileToBase64,
  compressImage,
  captureFromCamera,
  getPlaceholderFor,
} from '@/lib/image-utils';

interface ImageUploadProps {
  value?: string;
  onChange: (base64: string | undefined) => void;
  productName?: string;
}

export function ImageUpload({ value, onChange, productName = 'Produto' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Validate
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
      
      if (validation.error) {
        toast.warning(validation.error);
      }
      
      // Convert to base64
      let base64 = await fileToBase64(file);
      
      // Compress
      base64 = await compressImage(base64);
      
      onChange(base64);
      toast.success('Imagem carregada com sucesso');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Erro ao processar imagem');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleCapture = async () => {
    setIsProcessing(true);
    try {
      const base64 = await captureFromCamera();
      const compressed = await compressImage(base64);
      onChange(compressed);
      toast.success('Foto capturada com sucesso');
    } catch (error) {
      console.error('Error capturing from camera:', error);
      toast.error('Erro ao acessar câmera');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentImage = value || getPlaceholderFor(productName, 240);

  return (
    <div className="space-y-3">
      <Label>Imagem do Produto</Label>
      
      {/* Preview */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border">
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-contain"
          />
        </div>
        
        {value && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={() => onChange(undefined)}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          isProcessing && 'opacity-50 pointer-events-none'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isProcessing ? 'Processando...' : 'Arraste uma imagem ou clique para selecionar'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou WEBP • Máx 2MB • Recomendado: 256x256px
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCapture}
              disabled={isProcessing}
            >
              <Camera className="h-4 w-4 mr-2" />
              Capturar Foto
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <p className="text-xs text-muted-foreground text-center">
        💡 Imagens nítidas aumentam a conversão no PDV
      </p>
    </div>
  );
}
