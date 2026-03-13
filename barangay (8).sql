-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 13, 2026 at 02:44 PM
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
-- Table structure for table `eligibility_forms`
--

CREATE TABLE `eligibility_forms` (
  `form_id` int(11) NOT NULL,
  `form_name` varchar(150) NOT NULL,
  `status` enum('Enabled','Disabled') NOT NULL DEFAULT 'Enabled',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `eligibility_forms_entries`
--

CREATE TABLE `eligibility_forms_entries` (
  `entry_id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `resident_id` int(11) DEFAULT NULL,
  `household_id` int(11) DEFAULT NULL,
  `is_rewarded` tinyint(1) NOT NULL DEFAULT 0,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `submitted_at` datetime DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `households`
--

CREATE TABLE `households` (
  `household_id` int(11) NOT NULL,
  `f_name` varchar(100) NOT NULL,
  `m_name` varchar(100) DEFAULT NULL,
  `l_name` varchar(100) NOT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `house_no` varchar(50) DEFAULT NULL,
  `street` varchar(150) NOT NULL,
  `head_count` int(11) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `households`
--

INSERT INTO `households` (`household_id`, `f_name`, `m_name`, `l_name`, `suffix`, `house_no`, `street`, `head_count`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(1, 'Jake', 'Corazon', 'Cruz', 'Sr.', '12', 'Florida', 3, 4, '2026-02-16 20:08:18', 4, '2026-02-24 21:39:14'),
(2, 'Jelo', NULL, 'Cruz', NULL, '21', 'Bottom', 3, 4, '2026-02-18 18:34:44', 4, '2026-02-24 21:39:35'),
(4, 'Taylor', NULL, 'Morgan', NULL, '13', 'Singapore', 5, 4, '2026-02-24 21:49:55', NULL, '2026-02-24 21:49:55');

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
(15, 'Bruce', NULL, 'Caliao', NULL, 'Female', '2005-09-27', 'Manila', '21', 'Bohol', 'Single', 'Criminal', 'Filipino', 0, 0, 0, 4, '2026-02-09 16:22:39', 4, '2026-02-24 13:40:35'),
(17, 'sample', 'sample', 'sample', NULL, 'Male', '2005-09-27', 'japan', '21', 'sample', 'Single', 'sample', 'Filipino', 1, 1, 0, 4, '2026-02-12 15:35:22', 4, '2026-02-12 07:35:36'),
(19, 'sample', NULL, 'Asis', NULL, 'Male', '2026-03-04', 'Batangas', '750', 'Bohol St', 'Single', NULL, 'Filipino', 0, 0, 1, 4, '2026-03-07 20:21:56', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `role` enum('Admin','Staff') NOT NULL DEFAULT 'Staff',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `fullname`, `role`, `status`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(1, 'juls', '123', 'Julius Caliao', 'Admin', 'Active', NULL, '2026-01-20 00:04:50', NULL, '2026-01-20 00:04:50'),
(2, 'eljan', '$2b$10$SEkrCAgdyuuhMk4K56PQj.JUt56k7vlEm6JG.7jP.hCJkIh/MN5iu', 'Marco Esmeli', 'Admin', 'Active', NULL, '2026-01-23 21:24:44', NULL, '2026-01-23 21:24:44'),
(3, 'glen', '$2b$10$9/sJn80GjMTu7Gv6yVyrUOGD1Hh4wdXE1k2fv889hlZ7n6p5ijqA6', 'Glen Pata', 'Staff', 'Active', NULL, '2026-01-23 21:38:47', 4, '2026-03-13 21:43:37'),
(4, 'rus ', '$2b$10$RZinA3VTVxkinV1eVA7G1ezOGz1R10snSK347c73Bhvx74KH7nOai', 'rus vill', 'Staff', 'Active', NULL, '2026-01-25 20:23:57', NULL, '2026-01-25 20:23:57'),
(5, 'rald', '$2b$10$xKwr0HBO7SHgKqlDmCNuT.HFN/HwYMRrZfcGY0uScOjEnuyuVGZke', 'Herald Nigger', 'Admin', 'Active', 2, '2026-01-26 19:02:53', NULL, '2026-01-26 19:02:53'),
(6, 'James', '$2b$10$A8MCfaYXN4rPfwutc.jxK.OTZUqOPOniLQXEoQkJ9f.qU5cN6Nt.e', 'James Smith', 'Staff', 'Active', 4, '2026-03-07 18:12:30', NULL, '2026-03-07 18:12:30'),
(10, 'reid', '$2b$10$Q2aZiIn0uKvRu8lLzuyUO.c7HAeGmjnxMK5CCUkHk0MQlqLpVOCjW', 'James Reid', 'Admin', 'Inactive', 4, '2026-03-07 22:46:30', 4, '2026-03-07 22:46:41');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `eligibility_forms`
--
ALTER TABLE `eligibility_forms`
  ADD PRIMARY KEY (`form_id`),
  ADD KEY `eligibility_forms_ibfk_1` (`created_by`);

--
-- Indexes for table `eligibility_forms_entries`
--
ALTER TABLE `eligibility_forms_entries`
  ADD PRIMARY KEY (`entry_id`),
  ADD UNIQUE KEY `unique_form_resident` (`form_id`,`resident_id`),
  ADD UNIQUE KEY `unique_form_household` (`form_id`,`household_id`),
  ADD KEY `eligibility_forms_entries_ibfk_3` (`processed_by`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `eligibility_forms_entries_ibfk_2` (`resident_id`),
  ADD KEY `eligibility_forms_entries_ibfk_4` (`household_id`);

--
-- Indexes for table `households`
--
ALTER TABLE `households`
  ADD PRIMARY KEY (`household_id`),
  ADD KEY `households_ibfk_1` (`created_by`),
  ADD KEY `households_ibfk_2` (`updated_by`);

--
-- Indexes for table `residents`
--
ALTER TABLE `residents`
  ADD PRIMARY KEY (`resident_id`),
  ADD KEY `residents_ibfk_1` (`created_by`),
  ADD KEY `residents_ibfk_2` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `Username` (`username`),
  ADD KEY `users_ibfk_1` (`created_by`),
  ADD KEY `users_ibfk_2` (`updated_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `eligibility_forms`
--
ALTER TABLE `eligibility_forms`
  MODIFY `form_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eligibility_forms_entries`
--
ALTER TABLE `eligibility_forms_entries`
  MODIFY `entry_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `households`
--
ALTER TABLE `households`
  MODIFY `household_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `residents`
--
ALTER TABLE `residents`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `eligibility_forms`
--
ALTER TABLE `eligibility_forms`
  ADD CONSTRAINT `eligibility_forms_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `eligibility_forms_entries`
--
ALTER TABLE `eligibility_forms_entries`
  ADD CONSTRAINT `eligibility_forms_entries_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `eligibility_forms` (`form_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `eligibility_forms_entries_ibfk_2` FOREIGN KEY (`resident_id`) REFERENCES `residents` (`resident_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `eligibility_forms_entries_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `eligibility_forms_entries_ibfk_4` FOREIGN KEY (`household_id`) REFERENCES `households` (`household_id`) ON DELETE CASCADE;

--
-- Constraints for table `households`
--
ALTER TABLE `households`
  ADD CONSTRAINT `households_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `households_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `residents`
--
ALTER TABLE `residents`
  ADD CONSTRAINT `residents_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `residents_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`User_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`User_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
