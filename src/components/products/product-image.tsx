import { getPlaceholderFor } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  imageUrl?: string;
  productName: string;
  size?: number;
  className?: string;
}

export function ProductImage({ 
  imageUrl, 
  productName, 
  size = 40,
  className 
}: ProductImageProps) {
  const src = imageUrl || getPlaceholderFor(productName, size);
  
  return (
    <img
      src={src}
      alt={productName}
      className={cn(
        'object-cover bg-muted',
        className
      )}
      style={{ 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    />
  );
}
