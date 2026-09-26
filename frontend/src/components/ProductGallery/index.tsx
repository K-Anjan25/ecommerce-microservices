import React from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInMapIcon from "@mui/icons-material/ZoomInMap";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

export interface GalleryImage {
  url: string;
  thumbUrl?: string | null;
  altText?: string | null;
  angle?: string | null;
}

const PLACEHOLDER = "/images/store/product-placeholder.svg";

/** Full-resolution lightbox with keyboard + buttons (fast: only the full URL). */
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  alt,
}: {
  images: GalleryImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  alt: string;
}) {
  const count = images.length;
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onIndexChange((index - 1 + count) % count);
      if (event.key === "ArrowRight") onIndexChange((index + 1) % count);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, count, onIndexChange, onClose]);

  const touchX = React.useRef<number | null>(null);
  const [zoomed, setZoomed] = React.useState(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-ink/95"
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
    >
      <div className="flex items-center justify-between px-4 py-3 text-oncontrast">
        <span className="text-xs font-bold tracking-widest">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomed((z) => !z)}
            aria-label="Toggle zoom"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
          >
            {zoomed ? <ZoomInMapIcon sx={{ fontSize: 19 }} /> : <FullscreenIcon sx={{ fontSize: 18 }} />}
          </button>
          <button
            onClick={onClose}
            aria-label="Close image viewer"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const delta = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(delta) > 48) {
            onIndexChange(delta > 0 ? (index - 1 + count) % count : (index + 1) % count);
            setZoomed(false);
          }
          touchX.current = null;
        }}
      >
        <img
          key={images[index]?.url}
          src={images[index]?.url || PLACEHOLDER}
          alt={images[index]?.altText || alt}
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
          className={`max-h-full max-w-full object-contain transition-transform ${
            zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
          }`}
          onClick={() => setZoomed((z) => !z)}
        />
        {count > 1 && (
          <>
            <button
              aria-label="Previous image"
              onClick={() => {
                onIndexChange((index - 1 + count) % count);
                setZoomed(false);
              }}
              className="absolute left-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-oncontrast transition hover:bg-white/20 sm:left-4"
            >
              <ChevronLeftIcon />
            </button>
            <button
              aria-label="Next image"
              onClick={() => {
                onIndexChange((index + 1) % count);
                setZoomed(false);
              }}
              className="absolute right-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-oncontrast transition hover:bg-white/20 sm:right-4"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * PDP gallery: swipeable/arrow carousel (scroll-snap), thumb strip, dots and
 * full-res lightbox. Images use object-contain on a tinted stage so studio
 * shots always fit without cropping (the "images not fitting" fix), thumbs
 * load lazily while the current slide loads eagerly for instant paint.
 */
function ProductGallery({
  images,
  name,
  overlays,
}: {
  images: GalleryImage[];
  name: string;
  overlays?: React.ReactNode;
}) {
  const [index, setIndex] = React.useState(0);
  const [lightbox, setLightbox] = React.useState(false);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const touchX = React.useRef<number | null>(null);
  const count = images.length;
  const safeIndex = Math.min(index, Math.max(0, count - 1));

  const go = React.useCallback(
    (next: number) => {
      const clamped = ((next % count) + count) % count;
      setIndex(clamped);
      const el = scrollerRef.current;
      if (el) {
        const slide = el.children[clamped] as HTMLElement | undefined;
        slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    },
    [count]
  );

  if (count === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center bg-sunken text-ink-faint">
        <ImageOutlinedIcon sx={{ fontSize: 64 }} />
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[5rem_minmax(0,1fr)]">
      {/* thumb strip — vertical rail on desktop, horizontal scroller on mobile */}
      {count > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
          {images.map((img, idx) => (
            <button
              key={img.url + idx}
              onClick={() => go(idx)}
              title={img.angle ?? undefined}
              aria-label={`View ${img.angle ?? `image ${idx + 1}`}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-sm border transition md:h-[4.5rem] md:w-full ${
                idx === safeIndex
                  ? "border-ink ring-2 ring-ink/10"
                  : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img.thumbUrl ?? img.url}
                alt={img.altText ?? ""}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER;
                }}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* stage */}
      <div className="relative order-1 md:order-2">
        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          style={{ scrollBehavior: "smooth" }}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const delta = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(delta) > 48) go(safeIndex + (delta > 0 ? -1 : 1));
            touchX.current = null;
          }}
        >
          {images.map((img, idx) => (
            <button
              key={img.url + idx}
              onClick={() => setLightbox(true)}
              aria-label={`Open ${img.angle ?? `image ${idx + 1}`} full screen`}
              className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-sunken/60 sm:aspect-square"
            >
              <img
                src={img.url}
                srcSet={
                  img.thumbUrl && img.thumbUrl !== img.url
                    ? `${img.thumbUrl} 600w, ${img.url} 2000w`
                    : undefined
                }
                sizes="(max-width: 768px) 100vw, 55vw"
                alt={img.altText ?? name}
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : undefined}
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER;
                }}
                className="h-full w-full object-contain p-2"
              />
            </button>
          ))}
        </div>

        {/* overlays (discount / flash badges) */}
        {overlays && <div className="pointer-events-none absolute left-4 top-4 flex gap-2">{overlays}</div>}

        {count > 1 && (
          <>
            <button
              aria-label="Previous image"
              onClick={() => go(safeIndex - 1)}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper/90 text-ink shadow-sm transition hover:bg-paper"
            >
              <ChevronLeftIcon sx={{ fontSize: 20 }} />
            </button>
            <button
              aria-label="Next image"
              onClick={() => go(safeIndex + 1)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper/90 text-ink shadow-sm transition hover:bg-paper"
            >
              <ChevronRightIcon sx={{ fontSize: 20 }} />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to image ${idx + 1}`}
                  onClick={() => go(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === safeIndex ? "w-5 bg-ink" : "w-1.5 bg-ink/25 hover:bg-ink/45"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <ImageLightbox
          images={images}
          index={safeIndex}
          onIndexChange={setIndex}
          onClose={() => setLightbox(false)}
          alt={name}
        />
      )}
    </div>
  );
}

export default ProductGallery;
