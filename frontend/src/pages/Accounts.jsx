import { Typography } from "@mui/material";
import React from "react";
import Navbar from "../Reusables/Navbar.jsx";
import Button from "../Reusables/Button.jsx";
import AddAccountModal from "../modals/AddAccountModal.jsx";


const Accounts = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
    <Navbar/>
    <Typography>Accounts Page</Typography>
    <Button onClick={() => setOpen(true)}>Add Account</Button>
    <AddAccountModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default Accounts;