import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function RouteLoadingBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timers = [];

    const start = () => {
      setActive(true);
      setProgress(0);

      // Smooth ramp-up but never instantly hit 100
      timers.push(setTimeout(() => setProgress(30), 100));
      timers.push(setTimeout(() => setProgress(60), 300));
      timers.push(setTimeout(() => setProgress(80), 700));

      // Fallback: force completion on very slow/stuck transitions
      timers.push(setTimeout(() => finish(true), 8000));
    };

    const finish = (fromFallback = false) => {
      setProgress(100);
      timers.push(
        setTimeout(() => {
          setActive(false);
          setProgress(0);
        }, fromFallback ? 400 : 250)
      );
    };

    start();
    timers.push(setTimeout(() => finish(false), 800));

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] pointer-events-none">
      <div
        className="h-1 bg-indigo-500 rounded-b shadow-[0_0_8px_rgba(79,70,229,0.6)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
