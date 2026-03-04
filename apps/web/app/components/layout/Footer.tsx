"use client";

import {Accordion, AccordionItem, Button, Link} from "@heroui/react";

import { 
  IconBrandX,
  IconBrandFacebook,
  IconBrandInstagram,
} from "@tabler/icons-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-white p-5">
      <Accordion showDivider={false}>
        <AccordionItem 
          key={1} 
          aria-label="Who we are" 
          title="Who we are" 
          classNames={{ 
            title: "font-semibold font-poppins text-white", 
            indicator: "text-white",
            base: "border-b border-white/40"
          }}
        >
          <div className="flex flex-col gap-2">
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Company
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Community
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Careers
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              About Us
            </Link>
          </div>
        </AccordionItem>

        <AccordionItem 
          key={2} 
          aria-label="Support" 
          title="Support" 
          classNames={{ 
            title: "font-semibold font-poppins text-white", 
            indicator: "text-white",
            base: "border-b border-white/40"
          }}
        >
          <div className="flex flex-col gap-2">
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Help Center
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Contact Us
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Safety & Security
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              FAQ
            </Link>
          </div>
        </AccordionItem>

        <AccordionItem 
          key={3} 
          aria-label="Quick Links" 
          title="Quick Links" 
          classNames={{ 
            title: "font-semibold font-poppins text-white", 
            indicator: "text-white",
            base: "border-b border-white/40"
          }}
        >
          <div className="flex flex-col gap-2">
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Search Rentals
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              List Your Property
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Online Application
            </Link>
            <Link href="#" className="text-base font-medium text-white/80 hover:text-white">
              Tenant Login
            </Link>
          </div>
        </AccordionItem>
      </Accordion>
      
      {/* Copyrights */}
      <div className="mt-5 text-center">
        {/* Socials */}
        <div className="mb-5">
          <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
            <IconBrandX className="text-white" size={26} />
          </Button>
          <Button size="lg" variant="flat" isIconOnly radius="full" className="mx-1 bg-white/20 hover:bg-white/30">
            <IconBrandFacebook className="text-white" size={26} />
          </Button>
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
    </footer>
  );
}