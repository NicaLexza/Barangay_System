import { Typography } from "@mui/material";
import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import HouseholdsTable from "./HouseholdsTable.jsx";

const HouseholdsPage = () => {
  return (
    <>
    <Navbar/>
    <Typography>Households Page</Typography>
    <HouseholdsTable/>
    <Footer/>
    </>
  )
}

export default HouseholdsPage;