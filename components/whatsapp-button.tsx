"use client";

import {
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

type WhatsAppButtonSize = "sm" | "md" | "lg";

type WhatsAppButtonItem = {
  label: string;
  phone?: string;
  message?: string;
};

type ValidWhatsAppButtonItem = WhatsAppButtonItem & {
  phone: string;
};

type WhatsAppButtonProps = {
  items?: WhatsAppButtonItem[];
  ariaLabel?: string;
  closedLabel?: string;
  title?: string;
  className?: string;

  /**
   * Controls the main floating button and menu size.
   * @default "md"
   */
  size?: WhatsAppButtonSize;

  /**
   * Main brand/accent color.
   * @default "#25D366"
   */
  color?: string;

  /**
   * Icon and text color used on top of the main color.
   * @default "#ffffff"
   */
  textColor?: string;

  /**
   * Enables the animated pulse rings.
   * Uses `motion-safe` classes to respect reduced-motion preferences.
   * @default true
   */
  showPulse?: boolean;

  /**
   * When true, tries `whatsapp://` first, then falls back to `wa.me`.
   * For most public web usage, the default `wa.me` behavior is more predictable.
   * @default false
   */
  preferAppLink?: boolean;

  /**
   * Shows the formatted phone number under each item label in the expanded menu.
   * @default true
   */
  showPhoneNumber?: boolean;

  /**
   * Custom formatter for displaying phone numbers in the expanded menu.
   * The default formatter is optimized for Turkish phone numbers.
   */
  phoneFormatter?: (phone: string) => string | undefined;
};

const sizeClasses: Record<
  WhatsAppButtonSize,
  {
    singleButton: string;
    wrapper: string;
    triggerClosed: string;
    triggerOpen: string;
    iconClosed: string;
    iconOpen: string;
    closeIcon: string;
    itemIcon: string;
    itemButton: string;
    itemLabel: string;
    itemPhone: string;
    menuOpen: string;
    gap: string;
  }
> = {
  sm: {
    singleButton: "h-12 w-12",
    wrapper: "h-12 w-12 sm:h-14 sm:w-14",
    triggerClosed: "h-12 w-12 sm:h-14 sm:w-14",
    triggerOpen: "h-9 w-9 sm:h-10 sm:w-10",
    iconClosed: "h-6 w-6 sm:h-7 sm:w-7",
    iconOpen: "h-4 w-4 sm:h-5 sm:w-5",
    closeIcon: "h-4 w-4 sm:h-5 sm:w-5",
    itemIcon: "h-4 w-4 sm:h-5 sm:w-5",
    itemButton: "gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2",
    itemLabel: "text-[11px] sm:text-[13px]",
    itemPhone: "text-[9px] sm:text-[11px]",
    menuOpen: "px-2 py-1 sm:px-2.5 sm:py-1.5",
    gap: "gap-3 sm:gap-4",
  },
  md: {
    singleButton: "h-16 w-16",
    wrapper: "h-14 w-14 sm:h-20 sm:w-20",
    triggerClosed: "h-14 w-14 sm:h-20 sm:w-20",
    triggerOpen: "h-10 w-10 sm:h-12 sm:w-12",
    iconClosed: "h-7 w-7 sm:h-10 sm:w-10",
    iconOpen: "h-5 w-5 sm:h-6 sm:w-6",
    closeIcon: "h-5 w-5 sm:h-6 sm:w-6",
    itemIcon: "h-4 w-4 sm:h-6 sm:w-6",
    itemButton: "gap-1.5 px-2 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5",
    itemLabel: "text-[12px] sm:text-[15px]",
    itemPhone: "text-[10px] sm:text-[12px]",
    menuOpen: "px-2 py-1.5 sm:px-3 sm:py-2",
    gap: "gap-4 sm:gap-5",
  },
  lg: {
    singleButton: "h-20 w-20",
    wrapper: "h-16 w-16 sm:h-24 sm:w-24",
    triggerClosed: "h-16 w-16 sm:h-24 sm:w-24",
    triggerOpen: "h-11 w-11 sm:h-14 sm:w-14",
    iconClosed: "h-8 w-8 sm:h-12 sm:w-12",
    iconOpen: "h-6 w-6 sm:h-7 sm:w-7",
    closeIcon: "h-6 w-6 sm:h-7 sm:w-7",
    itemIcon: "h-5 w-5 sm:h-7 sm:w-7",
    itemButton: "gap-2 px-2.5 py-2.5 sm:gap-3 sm:px-5 sm:py-3",
    itemLabel: "text-[13px] sm:text-[16px]",
    itemPhone: "text-[11px] sm:text-[13px]",
    menuOpen: "px-2.5 py-2 sm:px-3.5 sm:py-2.5",
    gap: "gap-4 sm:gap-6",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getCleanPhone(phone?: string) {
  return phone?.replace(/[^\d]/g, "") ?? "";
}

function isValidItem(item: WhatsAppButtonItem): item is ValidWhatsAppButtonItem {
  return getCleanPhone(item.phone).length > 0;
}

function getWhatsAppWebHref(phone: string, message?: string) {
  const cleanPhone = getCleanPhone(phone);
  if (!cleanPhone) return undefined;

  const encodedMessage = message?.trim()
    ? encodeURIComponent(message.trim())
    : undefined;

  return encodedMessage
    ? `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    : `https://wa.me/${cleanPhone}`;
}

function getWhatsAppAppHref(phone: string, message?: string) {
  const cleanPhone = getCleanPhone(phone);
  if (!cleanPhone) return undefined;

  const encodedMessage = message?.trim()
    ? encodeURIComponent(message.trim())
    : undefined;

  return encodedMessage
    ? `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`
    : `whatsapp://send?phone=${cleanPhone}`;
}

function openWhatsApp(phone: string, message?: string, preferAppLink = false) {
  if (typeof window === "undefined") return;

  const webHref = getWhatsAppWebHref(phone, message);
  if (!webHref) return;

  if (!preferAppLink) {
    window.open(webHref, "_blank", "noopener,noreferrer");
    return;
  }

  const appHref = getWhatsAppAppHref(phone, message);
  if (!appHref) return;

  window.location.href = appHref;

  window.setTimeout(() => {
    window.open(webHref, "_blank", "noopener,noreferrer");
  }, 1200);
}

function defaultPhoneFormatter(phone: string) {
  const digits = getCleanPhone(phone);
  if (!digits) return undefined;

  const withoutCountryCode =
    digits.startsWith("90") && digits.length > 10 ? digits.slice(2) : digits;

  const nationalNumber = withoutCountryCode.startsWith("0")
    ? withoutCountryCode
    : `0${withoutCountryCode}`;

  if (nationalNumber.length !== 11) return nationalNumber;

  return nationalNumber.replace(
    /^(\d{4})(\d{3})(\d{2})(\d{2})$/,
    "$1 $2 $3 $4",
  );
}

function WhatsAppIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.11 17.24c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.62.14-.18.27-.71.88-.87 1.06-.16.18-.32.2-.6.07-.27-.13-1.14-.42-2.17-1.35-.8-.71-1.34-1.58-1.5-1.85-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.13-.16.18-.27.27-.46.09-.18.04-.34-.02-.48-.07-.13-.62-1.5-.84-2.05-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.93-.96 2.27 0 1.34.98 2.64 1.11 2.82.13.18 1.92 2.93 4.65 4.11.65.28 1.16.45 1.55.57.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.82-1.28.23-.63.23-1.18.16-1.28-.07-.11-.25-.18-.52-.32Z" />
      <path d="M16.03 3C8.85 3 3 8.74 3 15.81c0 2.26.6 4.47 1.74 6.42L3 29l6.98-1.82a13.13 13.13 0 0 0 6.05 1.46h.01c7.18 0 13.03-5.74 13.03-12.81C29.07 8.74 23.21 3 16.03 3Zm0 23.43h-.01a10.9 10.9 0 0 1-5.55-1.52l-.4-.24-4.14 1.08 1.11-4.01-.26-.41a10.56 10.56 0 0 1-1.64-5.53c0-5.84 4.85-10.6 10.89-10.6 2.91 0 5.64 1.11 7.69 3.13a10.38 10.38 0 0 1 3.19 7.47c0 5.85-4.86 10.61-10.88 10.61Z" />
    </svg>
  );
}

function CloseIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function PulseEffect({ show = true }: { show?: boolean }) {
  if (!show) return null;

  return (
    <>
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full border-2 border-[color:var(--whatsapp-button-color)] bg-[color:var(--whatsapp-button-color)] opacity-45 motion-safe:animate-ping motion-safe:[animation-duration:4s]" />
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full border-2 border-[color:var(--whatsapp-button-color)] bg-[color:var(--whatsapp-button-color)] opacity-35 motion-safe:animate-ping motion-safe:[animation-delay:1.35s] motion-safe:[animation-duration:4s]" />
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full border-2 border-[color:var(--whatsapp-button-color)] bg-[color:var(--whatsapp-button-color)] opacity-25 motion-safe:animate-ping motion-safe:[animation-delay:2.7s] motion-safe:[animation-duration:4s]" />
    </>
  );
}

export function WhatsAppButton({
  items = [],
  ariaLabel = "WhatsApp üzerinden iletişime geç",
  closedLabel = "WhatsApp",
  title = "WhatsApp üzerinden iletişime geç",
  className = "",
  size = "md",
  color = "#25D366",
  textColor = "#ffffff",
  showPulse = true,
  preferAppLink = false,
  showPhoneNumber = true,
  phoneFormatter = defaultPhoneFormatter,
}: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const styles = {
    "--whatsapp-button-color": color,
    "--whatsapp-button-text-color": textColor,
  } as CSSProperties;

  const classes = sizeClasses[size];

  const validItems = useMemo(() => items.filter(isValidItem).slice(0, 2), [items]);
  const hasMenu = validItems.length > 1;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target || containerRef.current?.contains(target)) return;

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (validItems.length === 0) return null;

  if (!hasMenu) {
    const item = validItems[0];

    return (
      <button
        type="button"
        onClick={() => openWhatsApp(item.phone, item.message, preferAppLink)}
        aria-label={ariaLabel}
        title={title}
        style={styles}
        className={cx(
          "fixed bottom-6 right-6 z-50 inline-flex items-center justify-center rounded-full bg-[color:var(--whatsapp-button-color)] text-[color:var(--whatsapp-button-text-color)] shadow-lg transition-transform duration-200 hover:scale-105 focus:outline-none",
          classes.singleButton,
          className,
        )}
      >
        <PulseEffect show={showPulse} />
        <WhatsAppIcon className={classes.iconClosed} />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      style={styles}
      className={cx(
        "fixed bottom-4 left-4 right-4 z-50 flex items-center justify-end sm:bottom-6 sm:left-auto sm:right-6",
        classes.gap,
        className,
      )}
    >
      <span
        className={cx(
          "pointer-events-none select-none whitespace-nowrap text-lg font-medium leading-none tracking-tight text-[color:var(--whatsapp-button-color)] drop-shadow-sm transition-opacity sm:text-base",
          isOpen ? "opacity-0 duration-100" : "opacity-75 duration-300 delay-150",
        )}
        aria-hidden={isOpen}
      >
        {closedLabel}
      </span>

      <div
        id={menuId}
        role="menu"
        aria-hidden={!isOpen}
        className={cx(
          "flex w-fit flex-none items-center justify-center gap-1.5 overflow-hidden rounded-full bg-[color:var(--whatsapp-button-color)] text-[color:var(--whatsapp-button-text-color)] shadow-lg transition-all duration-300 ease-out backdrop-blur-md sm:gap-2",
          isOpen
            ? cx("max-w-[95%] opacity-100 sm:max-w-[420px]", classes.menuOpen)
            : "max-w-0 px-0 py-1.5 opacity-0 sm:py-2",
        )}
      >
        {validItems.map((item, index) => {
          const displayPhone = showPhoneNumber
            ? phoneFormatter(item.phone)
            : undefined;

          return (
            <button
              key={`${item.label}-${item.phone}-${index}`}
              type="button"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => {
                openWhatsApp(item.phone, item.message, preferAppLink);
                setIsOpen(false);
              }}
              className={cx(
                "inline-flex min-w-0 items-center justify-center whitespace-nowrap rounded-full text-left drop-shadow-sm transition-colors duration-200 hover:bg-white/15 focus:outline-none",
                classes.itemButton,
              )}
            >
              <WhatsAppIcon className={cx("shrink-0", classes.itemIcon)} />
              <span className="flex flex-col items-start gap-0.5 leading-none">
                <span className={cx("font-medium tracking-tight", classes.itemLabel)}>
                  {item.label}
                </span>
                {displayPhone && (
                  <span
                    className={cx(
                      "font-normal leading-none opacity-85",
                      classes.itemPhone,
                    )}
                  >
                    {displayPhone}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cx("flex shrink-0 items-center justify-center", classes.wrapper)}>
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-controls={menuId}
          title={title}
          className={cx(
            "relative inline-flex origin-center items-center justify-center rounded-full bg-[color:var(--whatsapp-button-color)] text-[color:var(--whatsapp-button-text-color)] shadow-lg transition-all duration-300 ease-out hover:scale-105 focus:outline-none active:outline-none",
            isOpen ? classes.triggerOpen : classes.triggerClosed,
          )}
        >
          <PulseEffect show={!isOpen && showPulse} />

          <span
            className={cx(
              "absolute inset-0 flex items-center justify-center transition-all duration-300",
              isOpen
                ? "scale-50 rotate-90 opacity-0"
                : "scale-100 rotate-0 opacity-100",
            )}
          >
            <WhatsAppIcon className={classes.iconClosed} />
          </span>

          <span
            className={cx(
              "absolute inset-0 flex items-center justify-center transition-all duration-300",
              isOpen
                ? "scale-100 rotate-0 opacity-100"
                : "scale-50 -rotate-90 opacity-0",
            )}
          >
            <CloseIcon className={classes.closeIcon} />
          </span>
        </button>
      </div>
    </div>
  );
}

export type { WhatsAppButtonItem, WhatsAppButtonProps, WhatsAppButtonSize };