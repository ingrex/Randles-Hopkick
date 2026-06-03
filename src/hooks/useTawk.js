// src/hooks/useTawk.js
import { useEffect } from "react";
import { useAuth } from "../pages/AuthContext";

const useTawk = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (window.Tawk_API) return;

    window.Tawk_API = {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = "https://embed.tawk.to/6a202f09d0b6e01c2e34c051/1jq6rffru";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    s0.parentNode.insertBefore(s1, s0);

    s1.onload = () => {
      if (user && window.Tawk_API?.setAttributes) {
        window.Tawk_API.setAttributes(
          { name: user.name, email: user.email },
          (err) => {}
        );
      }
    };
  }, [user]);
};

export default useTawk;