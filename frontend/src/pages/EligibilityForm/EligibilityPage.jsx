import { Typography } from "@mui/material";
import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import EligibilityTable from "./EligibilityTable.jsx";


function Eligibility() {

  return (
    <>
    <Navbar/>
    <EligibilityTable/>
    <Footer/>
    </>
  )
}

export default Eligibility;