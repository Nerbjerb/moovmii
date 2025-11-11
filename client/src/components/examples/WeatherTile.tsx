import WeatherTile from "../WeatherTile";

export default function WeatherTileExample() {
  return (
    <div className="p-8 bg-background flex flex-col gap-3 items-end">
      <WeatherTile icon="sun" temperature="70°F" description="Sunny" time="11:30AM" />
      <WeatherTile icon="rain" temperature="61°F" description="Showers" time="2:00PM" />
    </div>
  );
}
