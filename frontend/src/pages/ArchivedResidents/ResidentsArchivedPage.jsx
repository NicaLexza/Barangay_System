import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import ResidentsArchivedTable from "./ResidentsArchivedTable.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";

function ResidentsArchivedPage() {
  return (
    <>
      <Navbar />
      <PageLayout>
        <ResidentsArchivedTable />
      </PageLayout>
      <Footer />
    </>
  );
}

export default ResidentsArchivedPage;