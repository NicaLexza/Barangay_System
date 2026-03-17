import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import EligibilityEntriesTable from "./EligibilityEntriesTable.jsx";

function EligibilityEntriesPage() {
  return (
    <>
      <Navbar />
      <EligibilityEntriesTable />
      <Footer />
    </>
  );
}

export default EligibilityEntriesPage;