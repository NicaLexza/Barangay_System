import { Typography } from "@mui/material";
import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import ResidentsTable from "./ResidentsTable.jsx";

const Residents = () => {

  return (
    <>
    <Navbar/>
    <Typography>Residents Page</Typography>
    <ResidentsTable/>
    <Footer/>
    </>
  )
}

export default Residents;