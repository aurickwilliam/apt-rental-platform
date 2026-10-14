"use client";

import Link from 'next/link';

import { Button } from '@heroui/react'

import { IconSearch as SearchIcon } from "@tabler/icons-react";

export default function StartBrowsingBtn() {
  return (
    <Button 
      variant="primary"
      className="mt-6"
    >
      <SearchIcon />

      <Link href="/browse">
        Start Browsing
      </Link>
    </Button>
  )
}
