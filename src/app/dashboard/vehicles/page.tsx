import { Truck } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function VehiclesPage() {
  return (
    <ComingSoon
      icon={Truck}
      title="Vehicles"
      description="Manage cars, vans, trucks, machinery and forklifts — registrations, insurance and documents. Coming in the next phase."
    />
  );
}
