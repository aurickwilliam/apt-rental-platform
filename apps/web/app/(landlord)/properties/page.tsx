import { createClient } from "@repo/supabase/server";
import { House, DoorOpen, DoorClosed, PhilippinePeso } from "lucide-react";
import PropertiesTable from "./components/PropertiesTable";

export default async function Properties() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated.</div>;
  
  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();
  
  const { data: apartments } = profile?.id
    ? await supabase
        .from("apartments")
        .select(`
          id, name, city, barangay, monthly_rent, status,
          type, average_rating, no_bedrooms, no_bathrooms,
          apartment_images(url, is_cover)
        `)
        .eq("landlord_id", profile.id)
        .is("deleted_at", null)
    : { data: [] };

  const mapped = (apartments ?? []).map((apt) => ({
    id:            apt.id,
    name:          apt.name,
    city:          apt.city,
    barangay:      apt.barangay,
    price:         apt.monthly_rent,
    status:        apt.status,
    type:          apt.type,
    rating:        apt.average_rating ?? 0,
    no_bedrooms:   apt.no_bedrooms,
    no_bathrooms:  apt.no_bathrooms,
    thumbnail:     apt.apartment_images?.find((img) => img.is_cover)?.url
                   ?? "/default/default-thumbnail.jpeg",
  }));

  // Stats
  const total    = mapped.length;
  const occupied = mapped.filter((a) => a.status === "occupied").length;
  const vacant   = total - occupied;
  const revenue  = mapped.reduce((sum, a) => sum + (a.price ?? 0), 0);

  const STATS = [
    { label: "Total Properties",          value: total,                              icon: House,            primary: true  },
    { label: "Occupied Units",            value: occupied,                           icon: DoorClosed,       primary: false },
    { label: "Vacant Units",              value: vacant,                             icon: DoorOpen,         primary: false },
    { label: "Monthly Revenue",           value: `₱${revenue.toLocaleString()}`,     icon: PhilippinePeso,   primary: false },
  ];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-5xl text-secondary font-bold font-noto-serif">
          My Properties
        </h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Manage your listings, track occupancy, and monitor revenue.
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, primary }) => (
          <div
            key={label}
            className={`p-4 flex flex-col gap-3 rounded-xl ${
              primary ? "bg-primary text-white" : "bg-white border border-grey-300"
            }`}
          >
            <div className="flex gap-3 items-center">
              <div className={`p-1.5 rounded-md ${primary ? "bg-white/20" : "bg-white border border-grey-300"}`}>
                <Icon className={primary ? "text-white" : "text-primary"} size={18} />
              </div>
              <h2 className={`text-base font-medium font-noto-serif ${primary ? "text-white" : ""}`}>
                {label}
              </h2>
            </div>
            <p className={`text-3xl font-semibold ${primary ? "text-white" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Properties Table */}
      <div className="mt-6 bg-white border border-grey-300 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium font-noto-serif">All Properties</h3>
        </div>
        <PropertiesTable properties={mapped} />
      </div>
    </div>
  );
}