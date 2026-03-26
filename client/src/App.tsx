import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Kiosk from "@/pages/Kiosk";
import Settings from "@/pages/Settings";
import ClockSettings from "@/pages/ClockSettings";
import WeatherSettings from "@/pages/WeatherSettings";
import OtherSettings from "@/pages/OtherSettings";
import SettingsMenu from "@/pages/SettingsMenu";
import WiFiSetup from "@/pages/WiFiSetup";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Kiosk} />
      <Route path="/settings" component={Settings} />
      <Route path="/clock-settings" component={ClockSettings} />
      <Route path="/weather-settings" component={WeatherSettings} />
      <Route path="/other-settings" component={OtherSettings} />
      <Route path="/settings-menu" component={SettingsMenu} />
      <Route path="/wifi" component={WiFiSetup} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
