-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 12, 2026 at 08:53 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `barangay`
--

-- --------------------------------------------------------

--
-- Table structure for table `residents`
--

CREATE TABLE `residents` (
  `resident_id` int(11) NOT NULL,
  `f_name` varchar(100) NOT NULL,
  `m_name` varchar(100) DEFAULT NULL,
  `l_name` varchar(100) NOT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `sex` enum('Male','Female','Other') NOT NULL,
  `birthdate` date NOT NULL,
  `birthplace` varchar(150) NOT NULL,
  `house_no` varchar(50) DEFAULT NULL,
  `street` varchar(150) DEFAULT NULL,
  `civil_status` enum('Single','Married','Widowed','Divorced','Separated','Annulled') NOT NULL,
  `occupation` varchar(150) DEFAULT NULL,
  `citizenship` varchar(100) DEFAULT 'Filipino',
  `is_pwd` tinyint(1) DEFAULT 0,
  `is_senior` tinyint(1) DEFAULT 0,
  `is_solop` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `residents`
--

INSERT INTO `residents` (`resident_id`, `f_name`, `m_name`, `l_name`, `suffix`, `sex`, `birthdate`, `birthplace`, `house_no`, `street`, `civil_status`, `occupation`, `citizenship`, `is_pwd`, `is_senior`, `is_solop`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(1, 'Julius', 'Mabagal', 'Caliao', NULL, 'Male', '2005-09-27', 'Manila', '15', 'Bohol', 'Married', 'Drug Dealer ', 'Filipino', 0, 1, 1, 4, '2026-01-30 16:37:11', NULL, '2026-02-09 07:51:32'),
(2, 'Maria', 'Santos', 'Cruz', NULL, 'Female', '1978-03-15', 'Opol', '42', 'Rizal', 'Married', 'Teacher', 'Filipino', 0, 0, 0, 2, '2026-02-02 13:48:27', NULL, '2026-02-09 07:52:01'),
(4, 'Ana', 'Lopez', 'Mendoza', NULL, 'Female', '1990-11-08', 'Nueva Ecija', '63', 'Bonifacio', 'Single', 'Nurse', 'Filipino', 0, 0, 0, 4, '2026-02-02 13:48:27', NULL, '2026-02-09 07:54:08'),
(6, 'Elena', 'Ramos', 'Aquino', NULL, 'Female', '1967-12-03', 'Manila', '89', 'Luna', 'Married', 'Vendor', 'Filipino', 1, 1, 1, 2, '2026-02-02 13:48:27', 4, '2026-02-09 11:10:15'),
(7, 'Jose', 'Bautista', 'Hernandez', NULL, 'Male', '1985-09-12', 'Nueva Ecija', '56', 'Aguinaldo', 'Married', 'Carpenter', 'Filipino', 0, 0, 0, 3, '2026-02-02 13:57:21', NULL, '2026-02-09 07:54:08'),
(9, 'Pedro', 'Flores', 'Castillo', 'III', 'Male', '1995-01-30', 'Opol', '78', 'Lapu-Lapu', 'Single', 'Security Guard', 'Filipino', 0, 0, 0, 5, '2026-02-02 13:57:21', NULL, '2026-02-09 07:54:08'),
(10, 'Rosa', 'Diaz', 'Morales', NULL, 'Female', '1988-06-14', 'Opol', '21', 'Magsaysay', 'Married', 'Barangay Health Worker', 'Filipino', 0, 0, 0, 2, '2026-02-02 13:57:21', NULL, '2026-02-09 07:55:32'),
(11, 'Glen', 'Jabolero', 'Pata', NULL, 'Male', '2005-02-02', 'Nueva Ecija', '67', 'Supot', 'Single', 'Loverboy ', 'Filipino', 1, 0, 0, 4, '2026-02-02 15:47:45', NULL, '2026-02-09 07:55:32'),
(13, 'Eljan', 'Kantu', 'Teru', NULL, 'Male', '2017-02-11', 'Manila', '69', 'Fitterkarma', 'Divorced', NULL, 'Filipino', 1, 0, 0, 4, '2026-02-05 18:49:38', NULL, '2026-02-09 07:55:32'),
(14, 'John ', NULL, 'Doe', 'Jr.', 'Male', '2021-02-06', 'Manila', '79', 'Boston', 'Divorced', NULL, 'Filipino', 0, 0, 1, 4, '2026-02-06 17:47:21', NULL, '2026-02-09 07:55:32'),
(15, 'Bruce', NULL, 'Caliao', NULL, 'Female', '2005-09-27', 'Manila', '21', 'Bohol', 'Single', NULL, 'Filipino', 0, 0, 0, 4, '2026-02-09 16:22:39', 4, '2026-02-09 12:10:59'),
(17, 'sample', 'sample', 'sample', NULL, 'Male', '2005-09-27', 'japan', '21', 'sample', 'Single', 'sample', 'Filipino', 1, 1, 0, 4, '2026-02-12 15:35:22', 4, '2026-02-12 07:35:36');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `User_id` int(11) NOT NULL,
  `Username` varchar(50) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Fullname` varchar(100) NOT NULL,
  `Role` enum('Admin','Staff') NOT NULL DEFAULT 'Staff',
  `Status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `Created_by` int(11) DEFAULT NULL,
  `Created_at` datetime DEFAULT current_timestamp(),
  `Updated_by` int(11) DEFAULT NULL,
  `Updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`User_id`, `Username`, `Password`, `Fullname`, `Role`, `Status`, `Created_by`, `Created_at`, `Updated_by`, `Updated_at`) VALUES
(1, 'juls', '123', 'Julius Caliao', 'Admin', 'Active', NULL, '2026-01-20 00:04:50', NULL, '2026-01-20 00:04:50'),
(2, 'eljan', '$2b$10$SEkrCAgdyuuhMk4K56PQj.JUt56k7vlEm6JG.7jP.hCJkIh/MN5iu', 'Marco Esmeli', 'Admin', 'Active', NULL, '2026-01-23 21:24:44', NULL, '2026-01-23 21:24:44'),
(3, 'glen', '$2b$10$ef00rFoJLN2ObaJllDXA.Oyvw6oQ5hS52KpW.HAkxqLSkjyeJjsGi', 'Glen Pata', 'Admin', 'Active', NULL, '2026-01-23 21:38:47', NULL, '2026-01-23 21:38:47'),
(4, 'rus ', '$2b$10$RZinA3VTVxkinV1eVA7G1ezOGz1R10snSK347c73Bhvx74KH7nOai', 'rus vill', 'Staff', 'Active', NULL, '2026-01-25 20:23:57', NULL, '2026-01-25 20:23:57'),
(5, 'rald', '$2b$10$xKwr0HBO7SHgKqlDmCNuT.HFN/HwYMRrZfcGY0uScOjEnuyuVGZke', 'Herald Nigger', 'Admin', 'Active', 2, '2026-01-26 19:02:53', NULL, '2026-01-26 19:02:53');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `residents`
--
ALTER TABLE `residents`
  ADD PRIMARY KEY (`resident_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`User_id`),
  ADD UNIQUE KEY `Username` (`Username`),
  ADD KEY `Created_by` (`Created_by`),
  ADD KEY `Updated_by` (`Updated_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `residents`
--
ALTER TABLE `residents`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `User_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `residents`
--
ALTER TABLE `residents`
  ADD CONSTRAINT `residents_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`User_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `residents_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`User_id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`Created_by`) REFERENCES `users` (`User_id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`Updated_by`) REFERENCES `users` (`User_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
