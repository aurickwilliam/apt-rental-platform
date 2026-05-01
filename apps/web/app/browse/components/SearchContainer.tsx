"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button } from "@heroui/react";
import { Search } from "lucide-react";

export default function SearchContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const handleSearch = () => {
    const current = new URLSearchParams(searchParams.toString());
    if (search) current.set("search", search);
    else current.delete("search");
    current.delete("page");
    router.push(`/browse?${current.toString()}`);
  };

  return (
    <div className="w-full h-52 bg-primary rounded-xl flex items-center justify-center flex-col gap-3">
      <h2 className="text-4xl font-medium font-dm-serif text-white">
        Find your Perfect Apartment!
      </h2>
      <p className="text-white/80 text-sm">
        Browse verified listings across Caloocan, Malabon, Navotas, and Valenzuela
      </p>

      {/* Search bar */}
      <div className="flex items-center gap-2 w-full max-w-lg mt-2">
        <Input
          placeholder="Search by name or location..."
          radius="full"
          size="lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          startContent={<Search size={20} className="text-grey-500" />}
          classNames={{
            inputWrapper: "bg-white shadow-sm",
          }}
        />
        <Button
          color="secondary"
          radius="full"
          size="lg"
          onPress={handleSearch}
        >
          Search
        </Button>
      </div>
    </div>
  );
}
