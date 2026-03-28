import { Typography } from "@mui/material";
import React from "react";
import Navbar from "../../Reusables/Navbar.jsx";
import Button from "../../Reusables/Button.jsx";
import AddAccountModal from "../../modals/AddAccountModal.jsx";
import Footer from "../../Reusables/Footer.jsx";
import AccountsTable from "./AccountsTable.jsx";
import PageLayout from "../../Reusables/PageLayout.jsx";


const Accounts = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
    <Navbar/>
    <PageLayout>
      <AccountsTable />
    </PageLayout>
    <Footer/>
    </>
  );
}

export default Accounts;