import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import EligibilityTable from "./EligibilityTable.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";


function Eligibility() {

  return (
    <>
    <Navbar/>
    <PageLayout>
      <EligibilityTable/>
    </PageLayout>
    <Footer/>
    </>
  )
}

export default Eligibility;