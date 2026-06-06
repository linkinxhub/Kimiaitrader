export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark">
      <div className="brand-mark__glyph" aria-hidden="true">
        <span />
        <span />
      </div>
      {!compact && (
        <div className="brand-mark__text">
          <span>XTrendAI</span>
          <strong>Pro</strong>
        </div>
      )}
    </div>
  );
}
