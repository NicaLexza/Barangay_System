-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 22, 2026 at 02:13 PM
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
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `log_id` int(11) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `entity_name` varchar(255) DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `performed_at` datetime DEFAULT current_timestamp(),
  `changes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`log_id`, `entity_type`, `entity_id`, `entity_name`, `action_type`, `performed_by`, `performed_at`, `changes`) VALUES
(1, 'Eligibility Form', 6, 'eacakes', 'restored', 5, '2026-06-14 14:47:57', NULL),
(2, 'Household', 5, 'Juls Caliao', 'updated', 5, '2026-06-14 14:48:22', NULL),
(3, 'Eligibility Form', 9, 'households', 'deleted', 5, '2026-06-14 15:39:56', NULL),
(4, 'Resident', 22, 'James Bond', 'imported', 5, '2026-06-14 15:44:39', NULL),
(5, 'Resident', 15, 'bruce caliao', 'updated', 5, '2026-06-14 15:44:39', NULL),
(6, 'Resident', 23, 'bry son', 'added', 5, '2026-06-16 10:10:15', NULL),
(7, 'Resident', 23, 'bry son', 'updated', 5, '2026-06-17 20:49:16', NULL),
(8, 'Eligibility Form', 10, 'dasdasd', 'archived', 5, '2026-06-19 19:43:04', NULL),
(9, 'Eligibility Form', 10, 'dasdasd', 'deleted', 5, '2026-06-19 19:43:19', NULL),
(10, 'Account', 17, 'mong yaw', 'created', 5, '2026-06-22 16:15:42', NULL),
(11, 'Account', 18, 'potchi', 'created', 5, '2026-06-22 16:30:25', NULL),
(12, 'Database', NULL, 'barangay_backup_2026-06-24_194647.sql', 'backup_created', 5, '2026-06-24 19:46:48', NULL),
(13, 'Database', NULL, 'barangay_backup_2026-06-24_232800.sql', 'backup_created', 5, '2026-06-24 23:28:01', NULL),
(14, 'Database', NULL, 'barangay_backup_2026-06-28_201259.sql', 'restored', 5, '2026-06-29 21:13:32', NULL),
(15, 'Account', 19, 'cosme ', 'created', 5, '2026-07-02 15:39:15', NULL),
(16, 'Eligibility Form', 7, 'dasdasd', 'archived', 5, '2026-07-03 19:49:32', NULL),
(17, 'Eligibility Form', 6, 'eacakes', 'archived', 5, '2026-07-03 19:49:34', NULL),
(18, 'Eligibility Form', 5, 'fuel subsidy ', 'archived', 5, '2026-07-03 19:49:39', NULL),
(19, 'Eligibility Form', 4, 'unemployed shytes', 'archived', 5, '2026-07-03 19:49:47', NULL),
(20, 'Eligibility Form', 7, 'dasdasd', 'restored', 5, '2026-07-03 19:50:17', NULL),
(21, 'Eligibility Form', 6, 'eacakes', 'restored', 5, '2026-07-03 19:50:22', NULL),
(22, 'Eligibility Form', 5, 'fuel subsidy ', 'restored', 5, '2026-07-03 19:50:26', NULL),
(23, 'Eligibility Form', 6, 'eacakes', 'archived', 5, '2026-07-03 19:51:00', NULL),
(24, 'Eligibility Form', 7, 'dasdasd', 'archived', 5, '2026-07-03 19:55:56', NULL),
(25, 'Eligibility Form', 7, 'dasdasd', 'restored', 5, '2026-07-04 13:54:26', NULL),
(26, 'Eligibility Form', 6, 'eacakes', 'restored', 5, '2026-07-04 13:54:30', NULL),
(27, 'Eligibility Form', 6, 'eacakes', 'archived', 5, '2026-07-04 13:54:37', NULL),
(28, 'Eligibility Form', 13, 'sa', 'archived', 5, '2026-07-05 01:46:17', NULL),
(29, 'Eligibility Form', 13, 'sa', 'deleted', 5, '2026-07-05 01:46:25', NULL),
(30, 'Eligibility Form', 15, 'sa', 'created', 5, '2026-07-05 01:52:15', NULL),
(31, 'Eligibility Form', 11, 'household', 'archived', 5, '2026-07-05 02:08:14', NULL),
(32, 'Eligibility Form', 12, 'd', 'archived', 5, '2026-07-05 02:08:26', NULL),
(33, 'Resident', 24, 'Julius Cesar Caliao', 'imported', 5, '2026-07-06 11:04:07', NULL),
(34, 'Resident', 25, 'Leo Nidas', 'imported', 5, '2026-07-06 11:04:07', NULL),
(35, 'Eligibility Form', 15, 'sa', 'archived', 5, '2026-07-08 00:30:56', NULL),
(36, 'Resident', 26, 'dasdasd dasdasd', 'added', 5, '2026-07-08 00:54:00', NULL),
(37, 'Resident', 27, 'sadsaasda sdasd', 'added', 5, '2026-07-08 01:00:50', NULL),
(38, 'Database', NULL, 'barangay_backup_2026-07-18_162607.sql', 'restored', 5, '2026-07-18 16:48:13', NULL),
(39, 'Resident', 28, 'Julius Cesar Kamilan', 'imported', 5, '2026-07-18 16:48:58', NULL),
(40, 'Database', NULL, 'barangay_backup_2026-07-18_165423.sql', 'backup_created', 5, '2026-07-18 16:54:23', NULL),
(41, 'Database', NULL, 'barangay_backup_2026-07-18_165442.sql', 'backup_created', 5, '2026-07-18 16:54:42', NULL),
(42, 'Database', NULL, 'barangay_backup_2026-07-18_165526.sql', 'restored', 5, '2026-07-18 17:02:47', NULL),
(43, 'Database', NULL, 'barangay_backup_2026-08-20_140333.sql', 'restored', 5, '2026-08-20 14:04:16', NULL),
(44, 'Database', NULL, 'barangay_backup_2026-08-20_141603.sql', 'backup_created', 5, '2026-08-20 14:16:03', NULL),
(45, 'Resident', 29, 'lala lulu', 'added', 5, '2026-08-20 14:19:52', NULL),
(46, 'Resident', 6, 'Elena Chino', 'updated', 5, '2026-08-21 18:16:22', NULL),
(47, 'Resident', 19, 'sample Bautista', 'updated', 5, '2026-08-21 19:32:29', '[{\"field\":\"Last Name\",\"from\":\"Asis\",\"to\":\"Bautista\"},{\"field\":\"Birthdate\",\"from\":\"2026-03-03\",\"to\":\"2026-03-04\"}]'),
(48, 'Resident', 19, 'sample Bautista', 'deleted', 5, '2026-08-21 19:32:48', NULL),
(49, 'Account', 16, 'bro', 'updated', 5, '2026-08-21 19:33:15', NULL),
(50, 'Account', 16, 'bro', 'updated', 5, '2026-08-21 19:35:16', NULL),
(51, 'Eligibility Form', 14, 'heads', 'updated', 5, '2026-08-21 19:35:51', NULL),
(52, 'Eligibility Form', 14, 'heads', 'updated', 5, '2026-08-21 19:39:02', NULL),
(53, 'Eligibility Form', 14, 'heads', 'archived', 5, '2026-08-21 19:39:10', NULL),
(54, 'Eligibility Form', 15, 'sa', 'restored', 5, '2026-08-21 19:41:01', NULL),
(55, 'Eligibility Form', 15, 'sa', 'enabled', 5, '2026-08-21 19:41:09', NULL),
(56, 'Eligibility Form', 15, 'sa', 'disabled', 5, '2026-08-21 19:41:17', NULL),
(57, 'Resident', 22, 'James Bondo', 'updated', 5, '2026-08-21 19:41:47', '[{\"field\":\"Last Name\",\"from\":\"Bond\",\"to\":\"Bondo\"},{\"field\":\"Birthdate\",\"from\":\"2026-04-14\",\"to\":\"2026-04-15\"},{\"field\":\"Civil Status\",\"from\":\"Divorced\",\"to\":\"Married\"},{\"field\":\"PWD\",\"from\":\"No\",\"to\":\"Yes\"}]'),
(58, 'Eligibility Form', 15, 'sa', 'enabled', 5, '2026-08-21 19:45:21', NULL),
(59, 'Eligibility Form', 15, 'sa', 'disabled', 5, '2026-08-21 19:45:25', NULL),
(60, 'Resident', 22, 'James Bondo', 'deleted', 5, '2026-08-21 19:46:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `eligibility_forms`
--

CREATE TABLE `eligibility_forms` (
  `form_id` int(11) NOT NULL,
  `form_name` varchar(150) NOT NULL,
  `status` enum('Enabled','Disabled','Archived') NOT NULL DEFAULT 'Enabled',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `eligibility_forms`
--

INSERT INTO `eligibility_forms` (`form_id`, `form_name`, `status`, `created_by`, `created_at`) VALUES
(4, 'unemployed shytes', 'Archived', 4, '2026-03-16 15:45:39'),
(5, 'fuel subsidy ', 'Disabled', 4, '2026-03-16 15:53:34'),
(6, 'eacakes', 'Archived', 4, '2026-03-17 18:32:35'),
(7, 'dasdasd', 'Disabled', 4, '2026-03-17 19:47:55'),
(11, 'household', 'Archived', 5, '2026-07-05 01:39:43'),
(12, 'd', 'Archived', 5, '2026-07-05 01:40:05'),
(14, 'heads', 'Archived', 5, '2026-07-05 01:45:12'),
(15, 'sa', 'Disabled', 5, '2026-07-05 01:52:15');

-- --------------------------------------------------------

--
-- Table structure for table `eligibility_forms_entries`
--

CREATE TABLE `eligibility_forms_entries` (
  `entry_id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `resident_id` int(11) DEFAULT NULL,
  `is_rewarded` tinyint(1) NOT NULL DEFAULT 0,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `eligibility_forms_entries`
--

INSERT INTO `eligibility_forms_entries` (`entry_id`, `form_id`, `resident_id`, `is_rewarded`, `processed_by`, `processed_at`) VALUES
(21, 4, 14, 0, NULL, '2026-03-16 15:45:39'),
(23, 5, 6, 1, 4, '2026-03-17 18:18:37'),
(25, 5, 15, 0, NULL, '2026-03-16 15:53:34'),
(26, 5, 1, 0, NULL, '2026-03-16 15:53:34'),
(27, 5, 9, 0, NULL, '2026-03-16 15:53:34'),
(28, 5, 2, 0, NULL, '2026-03-16 15:53:34'),
(29, 5, 14, 1, 18, '2026-06-22 16:31:08'),
(30, 5, 7, 0, NULL, '2026-03-16 15:53:34'),
(31, 5, 4, 0, NULL, '2026-03-16 15:53:34'),
(32, 5, 10, 0, NULL, '2026-03-16 15:53:34'),
(33, 5, 11, 0, NULL, '2026-03-16 15:53:34'),
(34, 5, 17, 0, NULL, '2026-03-16 15:53:34'),
(37, 6, 15, 0, 4, '2026-03-23 11:55:53'),
(38, 6, 2, 1, 4, '2026-03-28 18:49:23'),
(39, 6, 4, 1, 4, '2026-03-17 19:47:13'),
(40, 6, 10, 0, NULL, NULL),
(41, 7, 6, 1, 4, '2026-03-17 19:58:16'),
(42, 7, 1, 0, NULL, NULL),
(43, 7, 2, 0, NULL, NULL),
(44, 7, 7, 0, NULL, NULL),
(45, 7, 10, 0, NULL, NULL),
(70, 14, 23, 1, 5, '2026-07-05 01:45:43'),
(71, 15, 6, 1, 5, '2026-07-05 02:05:27'),
(74, 15, 15, 0, NULL, NULL),
(75, 15, 1, 0, NULL, NULL),
(76, 15, 20, 0, NULL, NULL),
(77, 15, 9, 0, NULL, NULL),
(78, 15, 2, 0, NULL, NULL),
(79, 15, 14, 0, NULL, NULL),
(80, 15, 21, 0, NULL, NULL),
(81, 15, 7, 0, NULL, NULL),
(82, 15, 4, 0, NULL, NULL),
(83, 15, 10, 0, NULL, NULL),
(84, 15, 11, 0, NULL, NULL),
(85, 15, 17, 0, NULL, NULL),
(86, 15, 23, 0, NULL, NULL);

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
  `is_household_head` tinyint(1) NOT NULL DEFAULT 0,
  `household_member_count` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `residents`
--

INSERT INTO `residents` (`resident_id`, `f_name`, `m_name`, `l_name`, `suffix`, `sex`, `birthdate`, `birthplace`, `house_no`, `street`, `civil_status`, `occupation`, `citizenship`, `is_pwd`, `is_senior`, `is_solop`, `is_household_head`, `household_member_count`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(1, 'Julius', 'Mabagal', 'Caliao', NULL, 'Male', '2005-09-27', 'Manila', '15', 'Bohol', 'Married', 'Drug Dealer ', 'Filipino', 0, 1, 1, 0, NULL, 4, '2026-01-30 16:37:11', NULL, '2026-02-09 07:51:32'),
(2, 'Maria', 'Santos', 'Cruz', NULL, 'Female', '1978-03-15', 'Opol', '42', 'Rizal', 'Married', 'Teacher', 'Filipino', 0, 0, 0, 0, NULL, 2, '2026-02-02 13:48:27', NULL, '2026-02-09 07:52:01'),
(4, 'Ana', 'Lopez', 'Mendoza', NULL, 'Female', '1990-11-08', 'Nueva Ecija', '63', 'Bonifacio', 'Single', 'Nurse', 'Filipino', 0, 0, 0, 0, NULL, 4, '2026-02-02 13:48:27', NULL, '2026-02-09 07:54:08'),
(6, 'Elena', 'Ramos', 'Chino', NULL, 'Female', '1967-12-03', 'Manila', '89', 'bohol', 'Divorced', 'Vendor', 'Filipino', 1, 1, 1, 0, NULL, 2, '2026-02-02 13:48:27', 5, '2026-08-21 10:16:22'),
(7, 'Jose', 'Bautista', 'Hernandez', NULL, 'Male', '1985-09-12', 'Nueva Ecija', '56', 'Aguinaldo', 'Married', 'Carpenter', 'Filipino', 0, 0, 0, 0, NULL, 3, '2026-02-02 13:57:21', NULL, '2026-02-09 07:54:08'),
(9, 'Pedro', 'Flores', 'Castillo', 'III', 'Male', '1995-01-30', 'Opol', '78', 'Lapu-Lapu', 'Single', 'Security Guard', 'Filipino', 0, 0, 0, 0, NULL, 5, '2026-02-02 13:57:21', NULL, '2026-02-09 07:54:08'),
(10, 'Rosa', 'Diaz', 'Morales', NULL, 'Female', '1988-06-14', 'Opol', '21', 'Magsaysay', 'Married', 'Barangay Health Worker', 'Filipino', 0, 0, 0, 0, NULL, 2, '2026-02-02 13:57:21', NULL, '2026-02-09 07:55:32'),
(11, 'Glen', 'Jabolero', 'Pata', NULL, 'Male', '2005-02-02', 'Nueva Ecija', '67', 'Supot', 'Single', 'Loverboy ', 'Filipino', 1, 0, 0, 0, NULL, 4, '2026-02-02 15:47:45', NULL, '2026-02-09 07:55:32'),
(14, 'John ', NULL, 'Doe', 'Jr.', 'Male', '2021-02-06', 'Manila', '79', 'Boston', 'Divorced', NULL, 'Filipino', 0, 0, 1, 0, NULL, 4, '2026-02-06 17:47:21', NULL, '2026-02-09 07:55:32'),
(15, 'bruce', NULL, 'caliao', NULL, 'Female', '2005-09-27', 'Manila', '21', 'Bohol', 'Married', 'Criminal', 'Filipino', 1, 0, 0, 0, NULL, 4, '2026-02-09 16:22:39', 5, '2026-06-14 07:44:39'),
(17, 'sample', 'sample', 'sample', NULL, 'Male', '2005-09-27', 'japan', '21', 'sample', 'Single', 'sample', 'Filipino', 1, 1, 0, 0, NULL, 4, '2026-02-12 15:35:22', 4, '2026-02-12 07:35:36'),
(20, 'Julius Cesar', 'Mabagal', 'Caliao', 'Jr', 'Male', '2005-09-27', 'Leyte', '750', 'Bohol', 'Married', 'Network Gingineer', 'Bisaya', 0, 0, 1, 0, NULL, 4, '2026-04-21 18:11:53', NULL, NULL),
(21, 'Jheric', NULL, 'Esmeli', 'Sr', 'Male', '2026-04-15', 'Toronto', '67', 'york', 'Divorced', 'assassin', 'Filipino', 0, 0, 0, 0, NULL, 4, '2026-04-22 20:45:36', NULL, NULL),
(23, 'bry', NULL, 'son', NULL, 'Male', '2026-06-10', 'Manila', '89', 'kopal', 'Married', 'crew', 'Filipino', 0, 0, 1, 1, 5, 5, '2026-06-16 10:10:15', 5, '2026-06-17 12:49:16'),
(24, 'Julius Cesar', 'Mabagal', 'Caliao', 'II', 'Male', '1960-07-05', 'New York, Makati', '15A', 'Madrid', 'Divorced', 'Yearner', 'Bisaya', 0, 1, 1, 0, NULL, 5, '2026-07-06 11:04:07', NULL, NULL),
(25, 'Leo', NULL, 'Nidas', NULL, 'Male', '2005-09-27', 'Greece', '300', 'BC', 'Married', 'Spartan', 'Bisaya', 0, 0, 0, 1, 5, 5, '2026-07-06 11:04:07', NULL, NULL),
(26, 'dasdasd', 'sqdasda', 'dasdasd', NULL, 'Male', '2005-09-27', 'asdsa', '123', 'sad', 'Single', NULL, 'Filipino', 0, 0, 0, 0, NULL, 5, '2026-07-08 00:54:00', NULL, NULL),
(28, 'Julius Cesar', 'C.', 'Kamilan', 'II', 'Male', '1960-07-05', 'New York, Makati', '15A', 'Madrid', 'Married', 'Yearner', 'Bisaya', 0, 1, 1, 0, NULL, 5, '2026-07-18 16:48:58', NULL, NULL),
(29, 'lala', 'lele', 'lulu', NULL, 'Male', '2005-09-27', 'Luzon', '750-6A', 'Bohol', 'Divorced', NULL, 'Filipino', 0, 0, 1, 1, 5, 5, '2026-08-20 14:19:52', NULL, NULL);

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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `must_change_password` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `fullname`, `role`, `status`, `created_by`, `created_at`, `updated_by`, `updated_at`, `must_change_password`) VALUES
(1, 'juls', '123', 'Julius Caliao', 'Admin', 'Active', NULL, '2026-01-20 00:04:50', NULL, '2026-04-12 18:04:54', 0),
(2, 'eljan', '$2b$10$SEkrCAgdyuuhMk4K56PQj.JUt56k7vlEm6JG.7jP.hCJkIh/MN5iu', 'Marco Esmeli', 'Admin', 'Active', NULL, '2026-01-23 21:24:44', NULL, '2026-04-12 18:04:54', 0),
(3, 'glen', '$2b$10$9/sJn80GjMTu7Gv6yVyrUOGD1Hh4wdXE1k2fv889hlZ7n6p5ijqA6', 'Glen Pata', 'Staff', 'Active', NULL, '2026-01-23 21:38:47', 4, '2026-04-12 18:04:54', 0),
(4, 'rus ', '$2b$10$RZinA3VTVxkinV1eVA7G1ezOGz1R10snSK347c73Bhvx74KH7nOai', 'rus vill', 'Staff', 'Active', NULL, '2026-01-25 20:23:57', NULL, '2026-04-12 18:04:54', 0),
(5, 'rald', '$2b$10$xKwr0HBO7SHgKqlDmCNuT.HFN/HwYMRrZfcGY0uScOjEnuyuVGZke', 'Herald Nigger', 'Admin', 'Active', 2, '2026-01-26 19:02:53', NULL, '2026-04-12 18:04:54', 0),
(6, 'James', '$2b$10$A8MCfaYXN4rPfwutc.jxK.OTZUqOPOniLQXEoQkJ9f.qU5cN6Nt.e', 'James Smith', 'Staff', 'Active', 4, '2026-03-07 18:12:30', NULL, '2026-04-12 18:04:54', 0),
(10, 'reid', '$2b$10$Q2aZiIn0uKvRu8lLzuyUO.c7HAeGmjnxMK5CCUkHk0MQlqLpVOCjW', 'James Reid', 'Admin', 'Inactive', 4, '2026-03-07 22:46:30', 4, '2026-04-12 18:04:54', 0),
(15, 'sample', '$2b$10$p/imSAnE72uXhYb7/wHDGers80g0Zisqw0sJFdcVx3ra2ZLBjGQte', 'sample', 'Staff', 'Active', 4, '2026-04-12 18:32:23', 15, '2026-04-12 18:48:50', 0),
(16, 'bro', '$2b$10$6.uAsYlW6wfTVMVtnhnuwe6nAPHeXohyHI3nrNXoFAhalcW6JKNhu', 'bru', 'Staff', 'Active', 4, '2026-04-28 00:44:16', 5, '2026-08-21 19:35:16', 0),
(17, 'mong', '$2b$10$5BSfOvozi1tVG1gQsJtaAOJodSou7hghdFHA1NM53ka1cuwuS.prq', 'mong yaw', 'Staff', 'Active', 5, '2026-06-22 16:15:42', 17, '2026-06-22 16:16:15', 0),
(18, 'potchi', '$2b$10$k0t4gDpgX..s.5J4OhvddeSI25kOEImcTU4JsY1VZUhu7tSPPXBH.', 'potchi', 'Staff', 'Active', 5, '2026-06-22 16:30:25', 18, '2026-06-22 16:30:39', 0),
(19, 'cos', '$2b$10$2yY2Kf.z0m1KfL9.lqx6me5ma1ai2vB86vvFqYSXTP4LzaifIfSUS', 'cosme ', 'Admin', 'Active', 5, '2026-07-02 15:39:15', 19, '2026-07-02 15:39:39', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_performed_at` (`performed_at`),
  ADD KEY `idx_performed_by` (`performed_by`);

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
  ADD KEY `eligibility_forms_entries_ibfk_3` (`processed_by`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `eligibility_forms_entries_ibfk_2` (`resident_id`);

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
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `eligibility_forms`
--
ALTER TABLE `eligibility_forms`
  MODIFY `form_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `eligibility_forms_entries`
--
ALTER TABLE `eligibility_forms_entries`
  MODIFY `entry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `residents`
--
ALTER TABLE `residents`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `eligibility_forms_entries_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
