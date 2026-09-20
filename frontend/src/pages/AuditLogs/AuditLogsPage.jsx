import Navbar from "../../Reusables/Navbar.jsx";
import Footer from "../../Reusables/Footer.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";
import AuditLogsTable from "./AuditLogsTable.jsx";

// Same shell as ResidentsPage.jsx: PageLayout pins the content between the
// Navbar and Footer with overflow hidden, so the page itself never scrolls —
// only the audit-log list inside AuditLogsTable does.
export default function AuditLogsPage() {
  return (
    <>
      <Navbar />
      <PageLayout>
        <AuditLogsTable />
      </PageLayout>
      <Footer />
    </>
  );
}