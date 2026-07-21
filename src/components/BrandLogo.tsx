import './BrandLogo.css'

interface BrandLogoProps {
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function BrandLogo({ iconOnly = false, size = 'md', className = '' }: BrandLogoProps) {
  return (
    <span className={`brand-logo brand-logo--${size} ${className}`.trim()}>
      <svg className="brand-logo__symbol" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path className="brand-logo__route" d="M10 36V24c0-7.7 6.3-14 14-14h12" />
        <path className="brand-logo__branch" d="M24 10v28M10 24h13c7.2 0 13 5.8 13 13" />
        <path className="brand-logo__heading" d="m32 6 5 4-5 4" />
        <circle className="brand-logo__node" cx="24" cy="24" r="3.25" />
      </svg>
      {!iconOnly && <strong className="brand-logo__wordmark"><span>MarketPilot</span> <small>AI</small></strong>}
    </span>
  )
}
