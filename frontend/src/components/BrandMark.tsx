import { Link } from "react-router-dom";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-mark" to={compact ? "/dashboard" : "/"}>
      <span className="brand-mark__glyph" aria-hidden="true">
        <span />
        <span />
      </span>
      <span className="brand-mark__text">
        <span>XTrendAI</span>
        <strong>Pro</strong>
      </span>
    </Link>
  );
}
