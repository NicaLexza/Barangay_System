import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import EligibilityEntriesTable from "./EligibilityEntriesTable.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";

function EligibilityEntriesPage() {
  return (
    <>
      <Navbar />
      <PageLayout>
        <EligibilityEntriesTable />
      </PageLayout>
      <Footer />
    </>
  );
}

export default EligibilityEntriesPage;