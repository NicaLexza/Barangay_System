import { Typography } from "@mui/material";
import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import ResidentsTable from "./ResidentsTable.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";

const Residents = () => {

  return (
    <>
    <Navbar/>
    <PageLayout>
      <ResidentsTable/>
    </PageLayout>
    <Footer/>
    </>
  );
};

export default Residents;