"use client";

import { Button, Link } from '@heroui/react'

export default function StartBrowsingBtn() {
  return (
    <Button
      variant="solid"
      color="primary"
      radius="full"
      className="mt-6"
      as={Link}
      href="/browse"
    >
      Start Browsing
    </Button>
  )
}
