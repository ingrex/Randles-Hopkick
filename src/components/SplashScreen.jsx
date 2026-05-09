// src/components/SplashScreen.jsx
import { useEffect, useState } from "react";
import "./splash.css";

export function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Hold for 2.2s, then trigger curtain exit, then unmount after 1.1s
    const show  = setTimeout(() => setExiting(true), 2200);
    const clear = setTimeout(onDone, 2200 + 1100);
    return () => { clearTimeout(show); clearTimeout(clear); };
  }, [onDone]);

  return (
    <div className={`sl-splash${exiting ? " sl-splash--exit" : ""}`}>
      <div className="sl-curtain sl-curtain--left" />
      <div className="sl-curtain sl-curtain--right" />
      <div className="sl-splash__content">
        <p className="sl-splash__eyebrow">Welcome To</p>
        <h1 className="sl-splash__logo">RANDLES</h1>
        <h1 className="sl-splash__logo">&</h1>
        <h1 className="sl-splash__logo">HOPKICK</h1>
        <div className="sl-splash__line" />
      </div>
    </div>
  );
}
export default SplashScreen;