import React from "react";
import Logo from "./Logo";


const Footer = () => {
  return (
    <footer className="bg-[#00223d] text-gray-300 pt-16 pb-6 px-6">
      <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        
        {/* BRAND */}
        <div>
          <h2 className=" text-gray-500 text-2xl font-semibold mb-4">
            <Logo  width={100} />
          </h2>
          <p className="text-sm leading-6">
            Randle & Hopkick is a domestic outsourcing service firm established to provide exceptional services that are geared at meeting our client's needs or domestic staff and related services. At Randle and Hopkick, we seek to exceed our client expectations through the provision of exceptional and timely professional services... Read more
          </p>

          <p className="text-white-500 font-extrabold mt-4 text-sm tracking-wide">
            REACHING FOR THE NEXT MILESTONE
          </p>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-white font-semibold mb-4">QUICK LINKS</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#">Home</a></li>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">Projects</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        {/* SERVICES */}
        <div>
          <h3 className="text-white font-semibold mb-4">OUR SERVICES</h3>
          <ul className="space-y-2 text-sm">
            <li>Domestic Outsourcing</li>
            <li>Corporate Outsourcing</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <h3 className="text-white font-semibold mb-4">CONTACT US</h3>
          <p className="text-sm leading-6">
            73, Ogudu road, Ojota, Lagos. Nigeria
          </p>
          <p className="mt-2 text-sm">+234 806 812 9190</p>
          <p className="mt-2 text-sm">info@randleandhopkick.com</p>

          <p className="mt-2 text-gray-300 text-sm">
            www.randleandhopkick.com
          </p>

        </div>
      </div>

      <div className="border-t border-gray-600 mt-10 pt-4 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Brand Name. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;