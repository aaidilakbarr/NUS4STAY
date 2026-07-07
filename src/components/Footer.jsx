import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-section-gap bg-surface-container-lowest border-t border-outline-variant mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="col-span-1 flex flex-col items-start gap-4 mb-8 md:mb-0">
          <div className="inline-flex items-center gap-3">
            <img
              src="/logo_nus4stay.svg"
              alt=""
              className="h-9 w-9 object-contain"
            />
            <span className="font-headline-md text-headline-md font-bold text-primary">NUS4STAY</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Curated luxury stays for the discerning traveler. Find your next premium escape.
          </p>
        </div>
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="font-label-md text-label-md text-on-surface font-bold uppercase mb-2">Company</h4>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-200" href="#">About Us</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-200" href="#">Careers</a>
        </div>
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="font-label-md text-label-md text-on-surface font-bold uppercase mb-2">Support</h4>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-200" href="#">Help Center</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-200" href="#">Contact</a>
        </div>
        <div className="col-span-1 flex flex-col gap-3">
          <h4 className="font-label-md text-label-md text-on-surface font-bold uppercase mb-2">Legal</h4>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-200" href="#">Privacy Policy</a>
          <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-opacity duration-200" href="#">Terms of Service</a>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-outline-variant/30 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          &copy; 2026 NUS4STAY Global. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
