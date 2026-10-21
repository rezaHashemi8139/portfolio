import { Download } from 'lucide-react';

interface Props {
  /** Résumé file URL. Nothing is rendered when empty. */
  href: string;
  fileName: string;
  variant?: 'primary' | 'glass';
  size?: 'md' | 'sm';
  label?: string;
}

/** Downloads the résumé PDF managed from the admin. */
export function ResumeButton({ href, fileName, variant = 'glass', size = 'md', label = 'Download résumé' }: Props) {
  if (!href) return null;
  return (
    <a
      className={`btn ${variant === 'primary' ? 'btn--primary' : ''} ${size === 'sm' ? 'btn--sm' : ''}`}
      href={href}
      download={fileName || undefined}
      target="_blank"
      rel="noopener"
      type="application/pdf"
      data-cursor="hover"
      data-magnetic
    >
      <span>{label}</span>
      <Download className="icon-drop" aria-hidden="true" />
      <span className="sr-only">(PDF)</span>
    </a>
  );
}
