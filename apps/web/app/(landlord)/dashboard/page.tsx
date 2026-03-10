import {
  House,
  Users,
  HandCoins,
  Hammer,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="mt-4">
      <h1 className="text-5xl text-secondary font-bold font-noto-serif mb-4">
        Dashboard
      </h1>
      <p>Welcome to your dashboard! Here you can manage your listings, view your bookings, and update your profile.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Total Properties */}
        <div className="bg-primary p-3 flex flex-col gap-3 rounded-xl">
          <div className="flex gap-3 items-center">
            <div className="p-1 bg-white rounded-md">
              <House className="text-primary" />
            </div>
            <h2 className="text-xl text-white font-medium font-noto-serif">
              Total Properties
            </h2>
          </div>

          <p className="text-white text-3xl font-semibold">
            5
          </p>
        </div>

        {/* Units Occupied*/}
        <div className="bg-white p-3 flex flex-col gap-3 rounded-xl border border-grey-300">
          <div className="flex gap-3 items-center">
            <div className="p-1 bg-white rounded-md border border-grey-300">
              <Users className="text-primary" />
            </div>
            <h2 className="text-xl font-medium font-noto-serif">
              Units Occupied
            </h2>
          </div>

          <p className="text-3xl font-semibold">
            3/5
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-3 flex flex-col gap-3 rounded-xl border border-grey-300">
          <div className="flex gap-3 items-center">
            <div className="p-1 bg-white rounded-md border border-grey-300">
              <HandCoins className="text-primary" />
            </div>
            <h2 className="text-xl font-medium font-noto-serif">
              Pending Payments
            </h2>
          </div>

          <p className="text-3xl font-semibold">
            1
          </p>
        </div>

        {/* Maintenance Issues */}
        <div className="bg-white p-3 flex flex-col gap-3 rounded-xl border border-grey-300">
          <div className="flex gap-3 items-center">
            <div className="p-1 bg-white rounded-md border border-grey-300">
              <Hammer className="text-primary" />
            </div>
            <h2 className="text-xl font-medium font-noto-serif">
              Maintenance Issues
            </h2>
          </div>

          <p className="text-3xl font-semibold">
            2
          </p>
        </div>
      </div>
      
      {/* Charts */}
      
    </div>
  );
}
