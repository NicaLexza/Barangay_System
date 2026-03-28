import { Typography } from "@mui/material";
import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import HouseholdsTable from "./HouseholdsTable.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";

const HouseholdsPage = () => {
  return (
    <>
    <Navbar/>
    <PageLayout>
      <HouseholdsTable/>  
    </PageLayout>
    <Footer/>
    </>
  )
}

export default HouseholdsPage;