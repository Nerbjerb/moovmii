import TrackCard from "../TrackCard";

export default function TrackCardExample() {
  return (
    <div className="space-y-[18px] p-8 bg-background">
      <TrackCard
        direction="Uptown"
        line="N"
        destination="Queens"
        subtitle="Astoria-Ditmars Blvd"
        arrivalMinutes={[12, 15, 20]}
      />
      <TrackCard
        direction="Downtown"
        line="W"
        destination="Manhattan"
        subtitle="Coney Island-Stillwell Ave"
        arrivalMinutes={[2, 8, 14]}
      />
    </div>
  );
}
