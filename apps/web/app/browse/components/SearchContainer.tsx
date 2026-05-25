"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button, InputGroup } from "@heroui/react";
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
        <InputGroup className="w-full rounded-full border border-gray-300 bg-white transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-gray-400">
          <InputGroup.Prefix>
            <Search size={20} className="text-grey-500" />
          </InputGroup.Prefix>
          <InputGroup.Input 
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </InputGroup>

        <Button
          variant="secondary"
          size="lg"
          onPress={handleSearch}
        >
          Search
        </Button>
      </div>
    </div>
  );
}
