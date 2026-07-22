"use client";

import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

const PAD_HEIGHT = 160;

type Props = {
  sigRef: React.RefObject<SignatureCanvas | null>;
};

/**
 * Canvas com largura real do container — evita assinatura
 * só funcionar no canto esquerdo no mobile.
 */
export function SignaturePad({ sigRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const next = Math.floor(el.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
    >
      {width > 0 ? (
        <SignatureCanvas
          key={width}
          ref={sigRef}
          penColor="#0b1220"
          minWidth={1.5}
          maxWidth={2.8}
          canvasProps={{
            width,
            height: PAD_HEIGHT,
            className: "touch-none block",
            style: {
              width: `${width}px`,
              height: `${PAD_HEIGHT}px`,
              display: "block",
              touchAction: "none",
            },
          }}
        />
      ) : (
        <div style={{ height: PAD_HEIGHT }} className="w-full bg-white" />
      )}
    </div>
  );
}
