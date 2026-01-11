import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Kiosk from "@/pages/Kiosk";
import Settings from "@/pages/Settings";
import AdvancedSettings from "@/pages/AdvancedSettings";
import ClockSettings from "@/pages/ClockSettings";
import WeatherSettings from "@/pages/WeatherSettings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Kiosk} />
      <Route path="/settings" component={Settings} />
      <Route path="/advanced-settings" component={AdvancedSettings} />
      <Route path="/clock-settings" component={ClockSettings} />
      <Route path="/weather-settings" component={WeatherSettings} />
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
