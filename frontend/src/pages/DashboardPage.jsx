import React from "react";
import { Container, Typography, Box } from "@mui/material";
import reactDom from "react-dom";
import Navbar from "../Reusables/Navbar.jsx";
import Footer from "../Reusables/Footer.jsx";


const Dashboard = () => {
  return (
    <>
    <Navbar/>
    <Typography>Dashboard Page</Typography>
    <Footer/>

    </>
  );
};

export default Dashboard;