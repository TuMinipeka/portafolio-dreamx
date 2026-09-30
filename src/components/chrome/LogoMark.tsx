/**
 * The DREAMX "D" mark, redrawn as three vector shapes from the original PNG
 * so each piece can be animated on its own (bowl, blade, peak).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="400 345 452 345"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
    >
      <path
        data-part="bowl"
        d="M412 350 L705 350 C790 350 848 420 848 515 C848 575 822 615 787 640 L735 590 C760 572 773 545 773 515 C773 462 738 425 690 425 L522 425 Z"
      />
      <path data-part="blade" d="M573 465 L630 450 L600 492 L405 645 Z" />
      <path data-part="peak" d="M428 683 L628 522 L795 683 L705 685 L630 588 L535 685 Z" />
    </svg>
  );
}
