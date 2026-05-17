"use client";

import Link from 'next/link';

import { Button } from '@heroui/react'

import { SearchIcon } from 'lucide-react';

export default function StartBrowsingBtn() {
  return (
    <Button 
      variant="primary"
      className="mt-6 bg-primary text-white"
    >
      <SearchIcon />

      <Link href="/browse">
        Start Browsing
      </Link>
    </Button>
  )
}
