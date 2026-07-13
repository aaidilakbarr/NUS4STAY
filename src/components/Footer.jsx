import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-outline-variant bg-surface-container-lowest py-12 md:py-16">
      <div className="page-shell grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-gutter">
        <div className="col-span-2 flex max-w-sm flex-col items-start gap-4 md:col-span-1">
          <div className="inline-flex items-center gap-3">
            <img
              src="/logo_nus4stay.svg"
              alt=""
              className="h-12 w-12 object-contain"
            />
            <span className="font-headline-md text-headline-md font-bold text-primary">NUS4STAY</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Curated stays and simple booking for your next getaway.
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
      <div className="page-shell mt-10 border-t border-outline-variant/50 pt-6 text-center md:mt-12">
        <p className="font-body-md text-body-md text-on-surface-variant">
          &copy; 2026 NUS4STAY Global. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
