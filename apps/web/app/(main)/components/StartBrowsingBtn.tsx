"use client";

import { Button } from '@heroui/react'

export default function StartBrowsingBtn() {
  return (
    <Button
      variant="solid"
      color="primary"
      radius="full"
      className="mt-6"
      onPress={() => {
        console.log("Start Browsing button clicked");
      }}
    >
      Start Browsing
    </Button>
  )
}