// EligibilityArchivedPage.jsx
import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import EligibilityArchivedTable from "./EligibilityArchivedTable.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";

function EligibilityArchivedPage() {
  return (
    <>
      <Navbar />
      <PageLayout>
        <EligibilityArchivedTable />
      </PageLayout>
      <Footer />
    </>
  );
}

export default EligibilityArchivedPage;