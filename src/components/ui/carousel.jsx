import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '../../lib/utils';

const CarouselContext = React.createContext(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error('useCarousel must be used within a CarouselProvider');
  return context;
}

function CarouselProvider({ children, opts, className }) {
  const [carouselRef, emblaApi] = useEmblaCarousel({ loop: true, ...opts });
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); emblaApi.off('reInit', onSelect); };
  }, [emblaApi]);

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <CarouselContext.Provider value={{ carouselRef, emblaApi, canScrollPrev, canScrollNext, scrollPrev, scrollNext }}>
      <div className={cn('relative', className)}>{children}</div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }) {
  const { carouselRef } = useCarousel();
  return (
    <div ref={carouselRef} className="overflow-hidden rounded-xl">
      <div className={cn('flex -ml-4', className)} {...props} />
    </div>
  );
}

function CarouselItem({ className, ...props }) {
  return (
    <div className="min-w-0 flex-[0_0_100%] pl-4" {...props}>
      <div className={cn('overflow-hidden', className)}>{props.children}</div>
    </div>
  );
}

function CarouselPrev({ className, ...props }) {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <button
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 border border-outline-variant text-on-surface transition-all hover:bg-surface hover:border-primary disabled:opacity-30',
        className,
      )}
      aria-label="Previous slide"
      {...props}
    >
      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
    </button>
  );
}

function CarouselNext({ className, ...props }) {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <button
      onClick={scrollNext}
      disabled={!canScrollNext}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 border border-outline-variant text-on-surface transition-all hover:bg-surface hover:border-primary disabled:opacity-30',
        className,
      )}
      aria-label="Next slide"
      {...props}
    >
      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
    </button>
  );
}

function CarouselDots({ className }) {
  const { emblaApi } = useCarousel();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [slideCount, setSlideCount] = React.useState(0);

  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setSlideCount(emblaApi.scrollSnapList().length);
    };
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); emblaApi.off('reInit', onSelect); };
  }, [emblaApi]);

  return (
    <div className={cn('flex items-center justify-center gap-1.5', className)}>
      {Array.from({ length: slideCount }).map((_, i) => (
        <button
          key={i}
          onClick={() => emblaApi?.scrollTo(i)}
          className={`h-1.5 rounded-full transition-all ${i === selectedIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'}`}
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

export { CarouselProvider, CarouselContent, CarouselItem, CarouselPrev, CarouselNext, CarouselDots };