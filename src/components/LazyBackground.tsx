import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";

export type LazyBackgroundProps = {
  src: string;
  className?: string;
  /** Load immediately (above-the-fold / LCP). Default false. */
  eager?: boolean;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
  children?: ReactNode;
};

/**
 * CSS background that loads when near the viewport (or immediately if eager).
 * Uses a soft placeholder until the image is ready.
 */
const LazyBackground: FC<LazyBackgroundProps> = ({
  src,
  className,
  eager = false,
  style,
  children,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [activeSrc, setActiveSrc] = useState(eager && src ? src : "");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;
    if (eager) {
      setActiveSrc(src);
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setActiveSrc(src);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActiveSrc(src);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [src, eager]);

  useEffect(() => {
    if (!activeSrc) {
      setLoaded(false);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!cancelled) setLoaded(true);
    };
    img.onerror = () => {
      if (!cancelled) setLoaded(true);
    };
    img.src = activeSrc;
    return () => {
      cancelled = true;
    };
  }, [activeSrc]);

  const backgroundImage = loaded && activeSrc
    ? `linear-gradient(45deg, rgba(44, 82, 130, 0.5), rgba(66, 153, 225, 0.2)), url("${activeSrc}")`
    : `linear-gradient(45deg, rgba(44, 82, 130, 0.35), rgba(66, 153, 225, 0.15))`;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 0.25s ease",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

export default LazyBackground;
