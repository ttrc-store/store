import * as React from 'react';

export function WhatsAppIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.301-.776.978-.952 1.179-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.3-.502.101-.2.05-.376-.025-.526-.075-.151-.677-1.631-.927-2.233-.244-.587-.492-.507-.677-.517-.175-.01-.376-.01-.577-.01-.201 0-.527.075-.802.376-.276.301-1.053 1.029-1.053 2.509s1.079 2.91 1.229 3.111c.151.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.379.197 1.898.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.352z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.892.527 3.663 1.442 5.178L2 22l4.981-1.399A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167a8.123 8.123 0 01-4.243-1.189l-.304-.18-2.96.831.846-2.885-.198-.316A8.136 8.136 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function UpiLogo({ className = 'h-4 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="UPI">
      <path d="M4 14.5V4h3.5v6.8c0 1.2.7 1.8 1.8 1.8s1.8-.6 1.8-1.8V4h3.5v6.6c0 3.2-1.9 4.8-5.3 4.8-3.4 0-5.3-1.6-5.3-4.9z" fill="#097939"/>
      <path d="M17 15V4h5.2c2.8 0 4.6 1.6 4.6 4s-1.8 4-4.6 4h-2.1v3H17zm3.1-5.5h2c1 0 1.7-.5 1.7-1.4s-.7-1.4-1.7-1.4h-2v2.8z" fill="#097939"/>
      <path d="M29 15V4h3.5v11H29z" fill="#097939"/>
      <path d="M42 3.5l-4.5 6.5 4.5 6.5h4.5l-4.5-6.5 4.5-6.5H42z" fill="#097939"/>
      <path d="M48 3.5l-4.5 6.5 4.5 6.5h4.5l-4.5-6.5 4.5-6.5H48z" fill="#F48220"/>
    </svg>
  );
}

export function RupayLogo({ className = 'h-4 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 68 20" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="RuPay">
      <text x="0" y="15" fill="#0B2341" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontStyle="italic" fontSize="15" letterSpacing="-0.5">RuPay</text>
      <path d="M51 3.5l-4.5 6.5 4.5 6.5h4.5l-4.5-6.5 4.5-6.5H51z" fill="#F48220"/>
      <path d="M57 3.5l-4.5 6.5 4.5 6.5h4.5l-4.5-6.5 4.5-6.5H57z" fill="#097939"/>
    </svg>
  );
}

export function VisaLogo({ className = 'h-4 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 14" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <path d="M17.5 0.5L11.5 13.5H7.7L4.7 3.2C4.5 2.5 4.3 2.2 3.7 1.9C2.8 1.5 1.3 1 0 0.8L0.1 0.5H6.9C7.8 0.5 8.6 1.1 8.8 2.1L10.5 9.7L14.4 0.5H17.5zm5.5 8.7c0-3.6-5-3.8-5-5.4 0-.5.5-1 1.6-1.2.6-.1 2.1-.1 3.7.5l.6-2.5C23.1.3 22 0 20.6 0c-4.2 0-7.1 2.2-7.1 5.3 0 2.3 2.1 3.6 3.7 4.3 1.6.8 2.2 1.3 2.2 2 0 1.1-1.3 1.5-2.6 1.5-1.9 0-3-.3-3.9-.7l-.6 2.6c.9.4 2.5.8 4.3.8 4.4 0 7.2-2.1 7.2-5.3zm9.8 4.3H36L33 0.5h-2.9c-.7 0-1.3.4-1.6 1L24.3 13.5h3.6l.7-2h4.5l-.3 2zm-3.5-4.2l1.9-4.8 1.1 4.8h-3zm-6-8.8l-2.9 13H17l2.9-13h3.4z" fill="#1434CB"/>
    </svg>
  );
}

export function MastercardLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 22" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <circle cx="11" cy="11" r="9" fill="#EB001B"/>
      <circle cx="23" cy="11" r="9" fill="#F79E1B"/>
      <path d="M17 4.7a8.96 8.96 0 00-3 6.3 8.96 8.96 0 003 6.3 8.96 8.96 0 003-6.3 8.96 8.96 0 00-3-6.3z" fill="#FF5F00"/>
    </svg>
  );
}

export function NetBankingIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="NetBanking">
      <polygon points="12 2 2 7 22 7 12 2" fill="currentColor" fillOpacity="0.1" />
      <rect x="4" y="10" width="3" height="7" fill="currentColor" fillOpacity="0.2" />
      <rect x="10.5" y="10" width="3" height="7" fill="currentColor" fillOpacity="0.2" />
      <rect x="17" y="10" width="3" height="7" fill="currentColor" fillOpacity="0.2" />
      <rect x="2" y="17" width="20" height="3" rx="1" fill="currentColor" fillOpacity="0.1" />
    </svg>
  );
}

export function CodBadgeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label="Cash on Delivery">
      <rect x="2" y="5" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.08" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <circle cx="12" cy="14.5" r="2" fill="currentColor" fillOpacity="0.2" />
      <path d="M6 14.5h.01M18 14.5h.01" strokeWidth="2.5" />
    </svg>
  );
}
