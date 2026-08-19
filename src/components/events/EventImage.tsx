import Image from 'next/image';

type EventImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  placeholderVariant?: 'light' | 'dark';
};

export default function EventImage({
  src,
  alt,
  className = '',
  sizes,
  placeholderVariant = 'light',
}: EventImageProps) {
  if (!src) {
    const placeholderClass =
      placeholderVariant === 'dark'
        ? 'bg-gradient-to-br from-[#18101d] via-[#120c16] to-[#0d0910]'
        : 'bg-gradient-to-br from-[#EDE4F5] via-[#F7F0F4] to-[#E8D5EA]';
    return (
      <div
        className={`${placeholderClass} ${className}`}
        aria-hidden={alt ? undefined : true}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
      />
    );
  }

  if (src.startsWith('/') && !src.startsWith('//')) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 768px) 100vw, 33vw'}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />
  );
}
