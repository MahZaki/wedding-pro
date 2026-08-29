import { redirect } from "next/navigation";
import { requireWedding } from "@/lib/wedding";
import { SetupWizard } from "@/components/setup/SetupWizard";

export const metadata = { title: "Set up your wedding" };

export default async function SetupPage() {
  const { wedding } = await requireWedding();

  // Already finished setup → dashboard.
  if (wedding.setup_complete === true) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SetupWizard
          wedding={{
            id: wedding.id,
            title: wedding.title,
            wedding_date: wedding.wedding_date ?? "",
            partner1_name: wedding.partner1_name ?? "",
            partner2_name: wedding.partner2_name ?? "",
            ceremony_location: wedding.ceremony_location ?? "",
            reception_location: wedding.reception_location ?? "",
            wedding_style: (wedding.wedding_style ?? "") as
              | "classic"
              | "boho"
              | "modern"
              | "rustic"
              | "destination"
              | "",
            timezone: wedding.timezone ?? "America/New_York",
            currency: wedding.currency ?? "USD",
            target_budget: wedding.target_budget,
            guest_count_estimate: wedding.guest_count_estimate ?? 80,
            region_tier: (wedding.region_tier ??
              "suburban") as "metro" | "suburban" | "rural",
          }}
        />
      </div>
    </div>
  );
}
