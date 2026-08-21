/*
 * Style reminder: Laboratorio de Movimiento — editorial-athletic, asymmetric layouts,
 * graphite + bone + electric cobalt, concise motion, tactile interactions.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "@/pages/Admin";
import Inauguracion from "@/pages/Inauguracion";
import NotFound from "@/pages/NotFound";
import Planes from "@/pages/Planes";
import { MotionConfig } from "framer-motion";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inauguracion" component={Inauguracion} />
      <Route path="/planes" component={Planes} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <MotionConfig reducedMotion="user">
            <Toaster />
            <Router />
          </MotionConfig>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
