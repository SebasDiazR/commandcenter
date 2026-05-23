import { useRef } from "react";

export function usePdfExport() {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  return function exportPDF(title = "HKS BD Command Center") {
    if (!styleRef.current) {
      const style = document.createElement("style");
      style.textContent = `
        @media print {
          @page { size: A3 landscape; margin: 18mm 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          aside, .no-print { display: none !important; }
          header { position: static !important; }
        }
      `;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    const prev = document.title;
    document.title = title;
    window.print();
    document.title = prev;
  };
}
