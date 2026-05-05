import React from "react";
import RandleLogo from "../assets/RandleLogo.png"; 

const Logo = ({ width = 120, className = "" }) => {
  return (
    <img
      src={RandleLogo}
      alt="Randle Logo"
      style={{ width }}
      className={className}
    />
  );
};

export default Logo;
