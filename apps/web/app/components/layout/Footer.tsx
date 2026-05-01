"use client";

import {Accordion, AccordionItem, Button, Divider, Link} from "@heroui/react";
import { IconBrandX, IconBrandFacebook, IconBrandInstagram } from "@tabler/icons-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto p-5 md:py-10">

      {/* Mobile: Accordion */}
      <Accordion showDivider={false} className="md:hidden">
        <AccordionItem key={1} aria-label="Who we are" title="Who we are"
          classNames={{ title: "font-semibold font-poppins text-white", indicator: "text-white", base: "border-b border-white/40" }}>
          <div className="flex flex-col gap-2">
            <Link href="/company" className="text-base font-medium text-white/80 hover:text-white">Company</Link>
            <Link href="/community" className="text-base font-medium text-white/80 hover:text-white">Community</Link>
            <Link href="/careers" className="text-base font-medium text-white/80 hover:text-white">Careers</Link>
            <Link href="/about" className="text-base font-medium text-white/80 hover:text-white">About Us</Link>
          </div>
        </AccordionItem>
        <AccordionItem key={2} aria-label="Support" title="Support"
          classNames={{ title: "font-semibold font-poppins text-white", indicator: "text-white", base: "border-b border-white/40" }}>
          <div className="flex flex-col gap-2">
            <Link href="/help" className="text-base font-medium text-white/80 hover:text-white">Help Center</Link>
            <Link href="/contact" className="text-base font-medium text-white/80 hover:text-white">Contact Us</Link>
            <Link href="/safety" className="text-base font-medium text-white/80 hover:text-white">Safety & Security</Link>
            <Link href="/faq" className="text-base font-medium text-white/80 hover:text-white">FAQ</Link>
          </div>
        </AccordionItem>
        <AccordionItem key={3} aria-label="Quick Links" title="Quick Links"
          classNames={{ title: "font-semibold font-poppins text-white", indicator: "text-white", base: "border-b border-white/40" }}>
          <div className="flex flex-col gap-2">
            <Link href="/browse" className="text-base font-medium text-white/80 hover:text-white">Search Rentals</Link>
            <Link href="/list-property" className="text-base font-medium text-white/80 hover:text-white">List Your Property</Link>
            <Link href="/apply" className="text-base font-medium text-white/80 hover:text-white">Online Application</Link>
            <Link href="/sign-in" className="text-base font-medium text-white/80 hover:text-white">Tenant Login</Link>
          </div>
        </AccordionItem>
      </Accordion>

      {/* Desktop: Columns */}
      <div className="hidden md:flex justify-between gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold font-poppins text-white">Who we are</h3>
          <Link href="/company" className="text-base font-medium text-white/80 hover:text-white">Company</Link>
          <Link href="/community" className="text-base font-medium text-white/80 hover:text-white">Community</Link>
          <Link href="/careers" className="text-base font-medium text-white/80 hover:text-white">Careers</Link>
          <Link href="/about" className="text-base font-medium text-white/80 hover:text-white">About Us</Link>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold font-poppins text-white">Support</h3>
          <Link href="/help" className="text-base font-medium text-white/80 hover:text-white">Help Center</Link>
          <Link href="/contact" className="text-base font-medium text-white/80 hover:text-white">Contact Us</Link>
          <Link href="/safety" className="text-base font-medium text-white/80 hover:text-white">Safety & Security</Link>
          <Link href="/faq" className="text-base font-medium text-white/80 hover:text-white">FAQ</Link>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold font-poppins text-white">Quick Links</h3>
          <Link href="/browse" className="text-base font-medium text-white/80 hover:text-white">Search Rentals</Link>
          <Link href="/list-property" className="text-base font-medium text-white/80 hover:text-white">List Your Property</Link>
          <Link href="/apply" className="text-base font-medium text-white/80 hover:text-white">Online Application</Link>
          <Link href="/sign-in" className="text-base font-medium text-white/80 hover:text-white">Tenant Login</Link>
        </div>
      </div>

      {/* Copyrights */}
      <div className="mt-5 text-center md:hidden">
        {/* Socials */}
        <div className="mb-5">
          <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
            <IconBrandX className="text-white" size={26} />
          </Button>
           <a href="https://www.facebook.com/profile.php?id=61583486606822" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
             <IconBrandFacebook className="text-white" size={26} />
            </Button>
           </a>
          <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
            <IconBrandInstagram className="text-white" size={26} />
          </Button>
        </div>

        <div>
          <p className="text-sm text-white/80">
            109 Samson Road corner Caimito Road, Caloocan, Philippines
          </p>
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} APT Rental Platform. All rights reserved.
          </p>
        </div>

        <div className="flex items-center justify-center mt-5">
          <Link href="#" className="text-sm text-white/80 hover:text-white mx-2">
            Terms of Service
          </Link>
          <Link href="#" className="text-sm text-white/80 hover:text-white mx-2">
            Privacy Policy
          </Link>
          <Link href="#" className="text-sm text-white/80 hover:text-white mx-2">
            Cookie Policy
          </Link>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block mt-20">
        <div className="flex justify-between items-center">
          <p className="text-sm text-white/80">
            109 Samson Road corner Caimito Road, Caloocan, Philippines
          </p>
          <div>
            <p className="text-sm text-white/80">
              © {new Date().getFullYear()} APT Rental Platform. All rights reserved.
            </p>
            <div className="flex items-center justify-center">
              <Link href="#" className="text-sm text-white/80 hover:text-white mx-2">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-white/80 hover:text-white mx-2">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-white/80 hover:text-white mx-2">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        <Divider className="my-5 h-0.5 rounded-full bg-white" />

        <div className="flex items-center justify-between">
          <Image
            src="/logo/logo-name.svg"
            alt="APT Rental Platform Logo"
            width={120}
            height={40}
          />

          <div>
            <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
              <IconBrandX className="text-white" size={26} />
            </Button>
            <a href="https://www.facebook.com/profile.php?id=61583486606822" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
                <IconBrandFacebook className="text-white" size={26} />
              </Button>
            </a>
            <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
              <IconBrandInstagram className="text-white" size={26} />
            </Button>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
