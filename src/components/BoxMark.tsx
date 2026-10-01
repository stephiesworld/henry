/** HENRY's logo: a taped shipping box. Colors come from currentColor plus the
 *  --box-line / --box-tape custom properties on an ancestor. */
export default function BoxMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="box-mark">
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" fill="currentColor" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" fill="none" stroke="var(--box-line)" strokeWidth="1.4" />
      <path d="m7.5 5.25 9 4.5v3" fill="none" stroke="var(--box-tape)" strokeWidth="2" />
    </svg>
  );
}
