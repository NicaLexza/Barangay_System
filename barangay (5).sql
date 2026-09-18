-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 18, 2026 at 12:24 PM
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
  `details` text DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `performed_at` datetime DEFAULT current_timestamp(),
  `changes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`log_id`, `entity_type`, `entity_id`, `entity_name`, `details`, `action_type`, `performed_by`, `performed_at`, `changes`) VALUES
(1, 'Eligibility Form', 6, 'eacakes', NULL, 'restored', 5, '2026-06-14 14:47:57', NULL),
(7, 'Resident', 23, 'bry son', NULL, 'updated', 5, '2026-06-17 20:49:16', NULL),
(8, 'Eligibility Form', 10, 'dasdasd', NULL, 'archived', 5, '2026-06-19 19:43:04', NULL),
(9, 'Eligibility Form', 10, 'dasdasd', NULL, 'deleted', 5, '2026-06-19 19:43:19', NULL),
(10, 'Account', 17, 'mong yaw', NULL, 'created', 5, '2026-06-22 16:15:42', NULL),
(11, 'Account', 18, 'potchi', NULL, 'created', 5, '2026-06-22 16:30:25', NULL),
(12, 'Database', NULL, 'barangay_backup_2026-06-24_194647.sql', NULL, 'backup_created', 5, '2026-06-24 19:46:48', NULL),
(13, 'Database', NULL, 'barangay_backup_2026-06-24_232800.sql', NULL, 'backup_created', 5, '2026-06-24 23:28:01', NULL),
(14, 'Database', NULL, 'barangay_backup_2026-06-28_201259.sql', NULL, 'restored', 5, '2026-06-29 21:13:32', NULL),
(15, 'Account', 19, 'cosme ', NULL, 'created', 5, '2026-07-02 15:39:15', NULL),
(16, 'Eligibility Form', 7, 'dasdasd', NULL, 'archived', 5, '2026-07-03 19:49:32', NULL),
(17, 'Eligibility Form', 6, 'eacakes', NULL, 'archived', 5, '2026-07-03 19:49:34', NULL),
(18, 'Eligibility Form', 5, 'fuel subsidy ', NULL, 'archived', 5, '2026-07-03 19:49:39', NULL),
(19, 'Eligibility Form', 4, 'unemployed shytes', NULL, 'archived', 5, '2026-07-03 19:49:47', NULL),
(20, 'Eligibility Form', 7, 'dasdasd', NULL, 'restored', 5, '2026-07-03 19:50:17', NULL),
(21, 'Eligibility Form', 6, 'eacakes', NULL, 'restored', 5, '2026-07-03 19:50:22', NULL),
(22, 'Eligibility Form', 5, 'fuel subsidy ', NULL, 'restored', 5, '2026-07-03 19:50:26', NULL),
(23, 'Eligibility Form', 6, 'eacakes', NULL, 'archived', 5, '2026-07-03 19:51:00', NULL),
(24, 'Eligibility Form', 7, 'dasdasd', NULL, 'archived', 5, '2026-07-03 19:55:56', NULL),
(25, 'Eligibility Form', 7, 'dasdasd', NULL, 'restored', 5, '2026-07-04 13:54:26', NULL),
(26, 'Eligibility Form', 6, 'eacakes', NULL, 'restored', 5, '2026-07-04 13:54:30', NULL),
(27, 'Eligibility Form', 6, 'eacakes', NULL, 'archived', 5, '2026-07-04 13:54:37', NULL),
(28, 'Eligibility Form', 13, 'sa', NULL, 'archived', 5, '2026-07-05 01:46:17', NULL),
(29, 'Eligibility Form', 13, 'sa', NULL, 'deleted', 5, '2026-07-05 01:46:25', NULL),
(30, 'Eligibility Form', 15, 'sa', NULL, 'created', 5, '2026-07-05 01:52:15', NULL),
(31, 'Eligibility Form', 11, 'household', NULL, 'archived', 5, '2026-07-05 02:08:14', NULL),
(32, 'Eligibility Form', 12, 'd', NULL, 'archived', 5, '2026-07-05 02:08:26', NULL),
(33, 'Resident', 24, 'Julius Cesar Caliao', NULL, 'imported', 5, '2026-07-06 11:04:07', NULL),
(34, 'Resident', 25, 'Leo Nidas', NULL, 'imported', 5, '2026-07-06 11:04:07', NULL),
(35, 'Eligibility Form', 15, 'sa', NULL, 'archived', 5, '2026-07-08 00:30:56', NULL),
(36, 'Resident', 26, 'dasdasd dasdasd', NULL, 'added', 5, '2026-07-08 00:54:00', NULL),
(37, 'Resident', 27, 'sadsaasda sdasd', NULL, 'added', 5, '2026-07-08 01:00:50', NULL),
(38, 'Database', NULL, 'barangay_backup_2026-07-18_162607.sql', NULL, 'restored', 5, '2026-07-18 16:48:13', NULL),
(40, 'Database', NULL, 'barangay_backup_2026-07-18_165423.sql', NULL, 'backup_created', 5, '2026-07-18 16:54:23', NULL),
(41, 'Database', NULL, 'barangay_backup_2026-07-18_165442.sql', NULL, 'backup_created', 5, '2026-07-18 16:54:42', NULL),
(42, 'Database', NULL, 'barangay_backup_2026-07-18_165526.sql', NULL, 'restored', 5, '2026-07-18 17:02:47', NULL),
(43, 'Database', NULL, 'barangay_backup_2026-08-20_140333.sql', NULL, 'restored', 5, '2026-08-20 14:04:16', NULL),
(44, 'Database', NULL, 'barangay_backup_2026-08-20_141603.sql', NULL, 'backup_created', 5, '2026-08-20 14:16:03', NULL),
(45, 'Resident', 29, 'lala lulu', NULL, 'added', 5, '2026-08-20 14:19:52', NULL),
(46, 'Resident', 6, 'Elena Chino', NULL, 'updated', 5, '2026-08-21 18:16:22', NULL),
(47, 'Resident', 19, 'sample Bautista', NULL, 'updated', 5, '2026-08-21 19:32:29', '[{\"field\":\"Last Name\",\"from\":\"Asis\",\"to\":\"Bautista\"},{\"field\":\"Birthdate\",\"from\":\"2026-03-03\",\"to\":\"2026-03-04\"}]'),
(48, 'Resident', 19, 'sample Bautista', NULL, 'deleted', 5, '2026-08-21 19:32:48', NULL),
(49, 'Account', 16, 'bro', NULL, 'updated', 5, '2026-08-21 19:33:15', NULL),
(50, 'Account', 16, 'bro', NULL, 'updated', 5, '2026-08-21 19:35:16', NULL),
(51, 'Eligibility Form', 14, 'heads', NULL, 'updated', 5, '2026-08-21 19:35:51', NULL),
(52, 'Eligibility Form', 14, 'heads', NULL, 'updated', 5, '2026-08-21 19:39:02', NULL),
(53, 'Eligibility Form', 14, 'heads', NULL, 'archived', 5, '2026-08-21 19:39:10', NULL),
(54, 'Eligibility Form', 15, 'sa', NULL, 'restored', 5, '2026-08-21 19:41:01', NULL),
(55, 'Eligibility Form', 15, 'sa', NULL, 'enabled', 5, '2026-08-21 19:41:09', NULL),
(56, 'Eligibility Form', 15, 'sa', NULL, 'disabled', 5, '2026-08-21 19:41:17', NULL),
(57, 'Resident', 22, 'James Bondo', NULL, 'updated', 5, '2026-08-21 19:41:47', '[{\"field\":\"Last Name\",\"from\":\"Bond\",\"to\":\"Bondo\"},{\"field\":\"Birthdate\",\"from\":\"2026-04-14\",\"to\":\"2026-04-15\"},{\"field\":\"Civil Status\",\"from\":\"Divorced\",\"to\":\"Married\"},{\"field\":\"PWD\",\"from\":\"No\",\"to\":\"Yes\"}]'),
(58, 'Eligibility Form', 15, 'sa', NULL, 'enabled', 5, '2026-08-21 19:45:21', NULL),
(59, 'Eligibility Form', 15, 'sa', NULL, 'disabled', 5, '2026-08-21 19:45:25', NULL),
(60, 'Resident', 22, 'James Bondo', NULL, 'deleted', 5, '2026-08-21 19:46:23', NULL),
(61, 'Account', 16, 'bro', NULL, 'updated', 5, '2026-09-04 16:51:00', '[{\"field\":\"Role\",\"from\":\"Staff\",\"to\":\"Admin\"}]'),
(62, 'Account', 16, 'bro', NULL, 'updated', 5, '2026-09-04 16:51:12', '[{\"field\":\"Status\",\"from\":\"Active\",\"to\":\"Inactive\"}]'),
(63, 'Account', 16, 'brod', NULL, 'updated', 5, '2026-09-04 16:51:23', '[{\"field\":\"Username\",\"from\":\"bro\",\"to\":\"brod\"}]'),
(64, 'Account', 16, 'brod', NULL, 'updated', 5, '2026-09-04 16:51:44', NULL),
(65, 'Account', 16, 'brod', NULL, 'updated', 5, '2026-09-04 16:55:46', NULL),
(66, 'Account', 16, 'brod', NULL, 'Password Changed', 5, '2026-09-04 16:57:24', NULL),
(67, 'Eligibility Form', 15, 'sa', NULL, 'enabled', 5, '2026-09-04 16:58:34', NULL),
(68, 'Database', NULL, 'barangay_backup_2026-09-04_174022.sql', NULL, 'restored', 5, '2026-09-04 17:41:33', NULL),
(69, 'Account', 16, 'brod', NULL, 'Password Reset', 5, '2026-09-04 18:00:27', NULL),
(70, 'Account', 16, 'brod', NULL, 'Password Reset', 5, '2026-09-04 18:00:42', NULL),
(71, 'Account', 20, 'kiw', NULL, 'created', 5, '2026-09-04 18:04:47', NULL),
(72, 'Account', 16, 'brod', NULL, 'Password Reset', 5, '2026-09-04 18:07:36', NULL),
(73, 'Account', 16, 'brod', NULL, 'updated', 5, '2026-09-04 18:07:47', '[{\"field\":\"Status\",\"from\":\"Inactive\",\"to\":\"Active\"}]'),
(74, 'Eligibility Form', 12, 'd', NULL, 'restored', 5, '2026-09-07 22:38:36', NULL),
(75, 'Account', 19, 'cos', NULL, 'Password Reset', 5, '2026-09-07 22:39:37', NULL),
(76, 'Database', NULL, 'barangay_backup_2026-09-07_230550.sql', NULL, 'restored', 5, '2026-09-07 23:21:58', '{\"status\":\"success\",\"tables\":[{\"table\":\"Residents\",\"expected\":19,\"actual\":19},{\"table\":\"Accounts\",\"expected\":13,\"actual\":13},{\"table\":\"Eligibility Forms\",\"expected\":8,\"actual\":8},{\"table\":\"Eligibility Entries\",\"expected\":35,\"actual\":35}],\"mismatches\":[]}'),
(77, 'Database', NULL, 'barangay_backup_2026-09-07_232259.sql.enc', NULL, 'backup_created', 5, '2026-09-07 23:22:59', '{\"status\":\"success\",\"tables\":[{\"table\":\"Residents\",\"count\":19},{\"table\":\"Accounts\",\"count\":13},{\"table\":\"Eligibility Forms\",\"count\":8},{\"table\":\"Eligibility Entries\",\"count\":35}]}'),
(78, 'Database', NULL, 'barangay_backup_2026-09-07_232308.sql', NULL, 'restored', 5, '2026-09-07 23:23:17', '{\"status\":\"success\",\"tables\":[{\"table\":\"Residents\",\"expected\":19,\"actual\":19},{\"table\":\"Accounts\",\"expected\":13,\"actual\":13},{\"table\":\"Eligibility Forms\",\"expected\":8,\"actual\":8},{\"table\":\"Eligibility Entries\",\"expected\":35,\"actual\":35}],\"mismatches\":[]}'),
(79, 'Resident', 15, 'bruce caliao', NULL, 'deleted', 5, '2026-09-07 23:24:07', NULL),
(80, 'Database', NULL, 'barangay_backup_2026-09-09_155718.sql.enc', '{\"status\":\"success\",\"expected\":{\"eligibility_entries\":32,\"residents\":18,\"accounts\":13,\"eligibility_forms\":8},\"actual\":{\"eligibility_entries\":32,\"residents\":18,\"accounts\":13,\"eligibility_forms\":8},\"missing\":{}}', 'backup_created', 5, '2026-09-09 15:57:18', NULL),
(82, 'Database', NULL, 'barangay_backup_test.sql.enc', '{\"status\":\"warning\",\"expected\":{\"residents\":15,\"accounts\":13,\"eligibility_forms\":7,\"eligibility_entries\":32},\"actual\":{\"residents\":14,\"accounts\":13,\"eligibility_forms\":7,\"eligibility_entries\":32},\"missing\":{\"residents\":[{\"id\":1,\"name\":\"Julius Mabagal Caliao\"}]}}', 'restored', 5, '2026-09-09 21:25:49', NULL),
(83, 'Resident', 30, 'Voldermort Vol', NULL, 'imported', 5, '2026-09-10 18:02:40', NULL),
(84, 'Eligibility Form', 15, 'sa', NULL, 'disabled', 5, '2026-09-10 18:05:41', NULL),
(85, 'Eligibility Form', 15, 'sa', NULL, 'enabled', 5, '2026-09-10 18:05:43', NULL),
(86, 'Eligibility Form', 15, 'sa', NULL, 'disabled', 5, '2026-09-10 18:05:44', NULL),
(87, 'Eligibility Form', 15, 'sa', NULL, 'enabled', 5, '2026-09-10 18:05:45', NULL),
(88, 'Database', NULL, 'barangay_backup_2026-09-10_182301.sql.enc', '{\"status\":\"success\",\"expected\":{\"eligibility_forms\":7,\"accounts\":13,\"residents\":15,\"eligibility_entries\":32},\"actual\":{\"eligibility_forms\":7,\"accounts\":13,\"residents\":15,\"eligibility_entries\":32},\"missing\":{}}', 'backup_created', 5, '2026-09-10 18:23:01', NULL),
(89, 'Resident', 11, 'Glen Pata', NULL, 'deleted', 5, '2026-09-10 18:24:42', NULL),
(90, 'Resident', 20, 'Julius Cesar Caliao', NULL, 'updated', 5, '2026-09-10 18:40:06', '[{\"field\":\"Birthdate\",\"from\":\"2005-09-26\",\"to\":\"1900-09-27\"},{\"field\":\"Senior Citizen\",\"from\":\"No\",\"to\":\"Yes\"}]'),
(91, 'Database', NULL, 'barangay_backup_2026-09-10_184059.sql.enc', '{\"status\":\"success\",\"expected\":{\"residents\":14,\"accounts\":13,\"eligibility_forms\":7,\"eligibility_entries\":30},\"actual\":{\"residents\":14,\"accounts\":13,\"eligibility_forms\":7,\"eligibility_entries\":30},\"missing\":{}}', 'restored', 5, '2026-09-10 18:41:10', NULL),
(92, 'Resident', 20, 'Julius Cesar Caliao', NULL, 'updated', 5, '2026-09-10 18:46:30', '[{\"field\":\"Birthdate\",\"from\":\"1900-09-26\",\"to\":\"1900-09-27\"},{\"field\":\"Citizenship\",\"from\":\"Bisaya\",\"to\":\"Bisakol\"}]'),
(93, 'Resident', 30, 'Voldermort Vol', NULL, 'updated', 5, '2026-09-10 19:02:45', NULL),
(94, 'Resident', 31, 'Carl Mangie', NULL, 'imported', 5, '2026-09-10 19:02:45', NULL),
(95, 'Resident', 20, 'Julius Cesar Caliao', NULL, 'updated', 5, '2026-09-10 19:03:23', '[{\"field\":\"Birthdate\",\"from\":\"1900-09-26\",\"to\":\"1900-09-27\"},{\"field\":\"Solo Parent\",\"from\":\"Yes\",\"to\":\"No\"}]'),
(96, 'Resident', 32, 'James Cruz', NULL, 'imported', 5, '2026-09-10 19:13:57', NULL),
(97, 'Resident', 32, 'James Cruz', NULL, 'updated', 5, '2026-09-10 19:14:03', '[{\"field\":\"House No.\",\"from\":\"75\",\"to\":\"76\"}]'),
(98, 'Eligibility Form', 15, 'sa', NULL, 'archived', 5, '2026-09-10 21:45:52', NULL),
(99, 'Eligibility Form', 12, 'd', NULL, 'archived', 5, '2026-09-10 21:45:54', NULL),
(100, 'Eligibility Form', 7, 'dasdasd', NULL, 'archived', 5, '2026-09-10 21:45:57', NULL),
(101, 'Resident', 31, 'Carl Mangie', NULL, 'updated', 5, '2026-09-10 21:46:19', '[{\"field\":\"Birthdate\",\"from\":\"1940-12-26\",\"to\":\"1940-12-27\"}]'),
(102, 'Resident', 20, 'Julius Cesar Caliao', NULL, 'updated', 5, '2026-09-10 21:46:51', '[{\"field\":\"Birthdate\",\"from\":\"1900-09-26\",\"to\":\"1900-09-27\"}]'),
(103, 'Resident', 20, 'Julius Cesar Caliao', NULL, 'updated', 5, '2026-09-10 21:48:42', '[{\"field\":\"Birthdate\",\"from\":\"1900-09-26\",\"to\":\"1900-09-27\"}]'),
(104, 'Resident', 20, 'Julius Cesar Caliao', NULL, 'updated', 5, '2026-09-10 21:48:57', '[{\"field\":\"Birthdate\",\"from\":\"1900-09-26\",\"to\":\"1900-09-27\"}]'),
(105, 'Resident', 6, 'Elena Chino', NULL, 'updated', 5, '2026-09-10 21:49:12', '[{\"field\":\"Birthdate\",\"from\":\"1967-12-02\",\"to\":\"1967-12-03\"}]'),
(106, 'Resident', 6, 'Elen Chino', NULL, 'updated', 5, '2026-09-10 21:49:27', '[{\"field\":\"First Name\",\"from\":\"Elena\",\"to\":\"Elen\"},{\"field\":\"Birthdate\",\"from\":\"1967-12-02\",\"to\":\"1967-12-03\"}]'),
(107, 'Resident', 26, 'dasdasd dasdasd', NULL, 'updated', 5, '2026-09-10 21:49:48', '[{\"field\":\"Birthdate\",\"from\":\"2005-09-26\",\"to\":\"2005-09-27\"}]'),
(108, 'Account', 16, 'brod', NULL, 'updated', 5, '2026-09-10 21:54:52', NULL),
(109, 'Resident', 20, 'Julius Cesar Caliao', NULL, 'updated', 5, '2026-09-10 22:04:21', NULL),
(110, 'Resident', 33, 'Johnlee Paulino', NULL, 'added', 5, '2026-09-10 22:06:02', NULL),
(111, 'Resident', 33, 'Johnlee Paulino', NULL, 'updated', 5, '2026-09-10 22:06:19', NULL),
(112, 'Eligibility Form', 16, 'Seniors', NULL, 'created', 5, '2026-09-10 22:08:26', NULL),
(113, 'Account', 3, 'glen', NULL, 'Password Reset', 5, '2026-09-10 22:08:53', NULL),
(114, 'Resident', 34, 'Mark Adrian Dela Cruz', NULL, 'imported', 3, '2026-09-10 22:10:57', NULL),
(115, 'Resident', 38, 'Librong James', NULL, 'imported', 3, '2026-09-10 22:10:57', NULL),
(116, 'Resident', 37, 'Julius Cesar Caliao', NULL, 'imported', 3, '2026-09-10 22:10:57', NULL),
(117, 'Resident', 36, 'Kimi Yawa', NULL, 'imported', 3, '2026-09-10 22:10:57', NULL),
(118, 'Resident', 35, 'Travis Scott', NULL, 'imported', 3, '2026-09-10 22:10:57', NULL),
(119, 'Resident', 39, 'Elijah Miller Esmeli', NULL, 'imported', 5, '2026-09-10 22:20:48', NULL),
(120, 'Resident', 35, 'Travis Scott', NULL, 'updated', 5, '2026-09-10 22:20:48', '[{\"field\":\"House No.\",\"from\":\"143 \",\"to\":\"148 G\"}]'),
(121, 'Eligibility Form', 17, 'Unemployed', NULL, 'created', 5, '2026-09-10 22:21:38', NULL),
(122, 'Eligibility Form', 18, 'PWDs', NULL, 'created', 5, '2026-09-10 22:23:10', NULL),
(123, 'Resident', 41, 'Callie Caliao', NULL, 'imported', 5, '2026-09-11 11:27:14', NULL),
(124, 'Resident', 40, 'Callie Caliao', NULL, 'imported', 5, '2026-09-11 11:27:14', NULL),
(125, 'Resident', 40, 'Callie Caliao', NULL, 'deleted', 5, '2026-09-11 11:36:03', NULL),
(126, 'Resident', 41, 'Callie Caliao', NULL, 'deleted', 5, '2026-09-11 11:36:06', NULL),
(127, 'Account', 3, 'glen', NULL, 'updated', 5, '2026-09-11 12:47:50', '[{\"field\":\"Full Name\",\"from\":\"Glen Pata\",\"to\":\"Glen Pat\"}]'),
(128, 'Database', NULL, 'barangay_backup_2026-09-11_125043.sql.enc', '{\"status\":\"success\",\"expected\":{\"accounts\":13,\"eligibility_entries\":41,\"residents\":23,\"eligibility_forms\":10},\"actual\":{\"accounts\":13,\"eligibility_entries\":41,\"residents\":23,\"eligibility_forms\":10},\"missing\":{}}', 'backup_created', 5, '2026-09-11 12:50:43', NULL),
(129, 'Resident', 42, 'Alexandra Jelaica Mae Alagao', NULL, 'imported', 5, '2026-09-11 13:17:50', NULL),
(130, 'Resident', 44, 'Sean Paul Macasinag', NULL, 'imported', 5, '2026-09-11 13:17:50', NULL),
(131, 'Resident', 43, 'John Carlo Ferriols', NULL, 'imported', 5, '2026-09-11 13:17:50', NULL),
(132, 'Resident', 34, 'Mark Adrian Dela Cruz', NULL, 'updated', 5, '2026-09-11 13:17:50', '[{\"field\":\"House No.\",\"from\":\"123\",\"to\":\"178\"}]'),
(133, 'Eligibility Form', 19, 'Single', NULL, 'created', 5, '2026-09-11 13:19:54', NULL),
(134, 'Resident', 45, 'Callie Caliao', NULL, 'imported', 3, '2026-09-11 13:25:00', NULL),
(135, 'Eligibility Form', 18, 'PWDs', NULL, 'disabled', 5, '2026-09-11 13:45:54', NULL),
(136, 'Eligibility Form', 18, 'PWDs', NULL, 'enabled', 5, '2026-09-11 13:45:58', NULL),
(137, 'Database', NULL, 'barangay_backup_2026-09-11_134936.sql.enc', '{\"status\":\"success\",\"expected\":{\"residents\":27,\"accounts\":13,\"eligibility_forms\":11,\"eligibility_entries\":49},\"actual\":{\"residents\":27,\"accounts\":13,\"eligibility_forms\":11,\"eligibility_entries\":49},\"missing\":{}}', 'backup_created', 5, '2026-09-11 13:49:36', NULL),
(138, 'Database', NULL, 'barangay_backup_2026-09-12_185829.sql.enc', '{\"status\":\"success\",\"expected\":{\"eligibility_forms\":11,\"accounts\":13,\"residents\":27,\"eligibility_entries\":49},\"actual\":{\"eligibility_forms\":11,\"accounts\":13,\"residents\":27,\"eligibility_entries\":49},\"missing\":{}}', 'backup_created', 5, '2026-09-12 18:58:29', NULL),
(139, 'Resident', 45, 'Callie Caliao', NULL, 'deleted', 5, '2026-09-12 18:58:52', NULL),
(140, 'Resident', 46, 'Callie Caliao', NULL, 'imported', 5, '2026-09-11 11:25:55', NULL),
(141, 'Resident', 46, 'Callie Caliao', NULL, 'deleted', 5, '2026-09-12 19:12:51', NULL),
(142, 'Resident', 47, 'Callie Caliao', NULL, 'imported', 5, '2026-09-11 11:25:55', NULL),
(143, 'Resident', NULL, '1 added, 1 updated', '{\"added\":[{\"resident_id\":48,\"name\":\"Spot Caliao\"}],\"updated\":[{\"resident_id\":47,\"name\":\"Callie Caliao\",\"changes\":[{\"field\":\"House No.\",\"from\":\"750\",\"to\":\"700\"}]}]}', 'imported', 5, '2026-09-13 11:32:52', NULL),
(144, 'Resident', 42, 'Alexandra Jelaica Mae Alagao', NULL, 'archived', 5, '2026-09-13 17:42:07', NULL),
(145, 'Resident', 42, 'Alexandra Jelaica Mae Alagao', NULL, 'restored', 5, '2026-09-13 17:42:22', NULL),
(146, 'Resident', 42, 'Alexandra Jelaica Mae Alagao', NULL, 'archived', 3, '2026-09-13 17:42:43', NULL),
(147, 'Resident', 42, 'Alexandra Jelaica Mae Alagao', NULL, 'restored', 5, '2026-09-13 17:43:08', NULL),
(148, 'Resident', 42, 'Alexandra Jelaica Mae Alagao', NULL, 'archived', 5, '2026-09-15 09:56:41', NULL),
(149, 'Resident', 47, 'Callie Caliao', NULL, 'archived', 5, '2026-09-15 09:56:50', NULL),
(150, 'Resident', 47, 'Callie Caliao', NULL, 'restored', 5, '2026-09-15 10:08:47', NULL),
(151, 'Eligibility Form', 20, 'Divorce ', NULL, 'created', 5, '2026-09-17 22:10:53', NULL),
(152, 'Eligibility Entry', 106, 'Mark Adrian Madlangawa Dela Cruz Jr', NULL, 'marked_received', 5, '2026-09-17 22:11:09', NULL),
(153, 'Eligibility Entry', 107, 'Kimi No Yawa', NULL, 'marked_received', 5, '2026-09-17 22:11:13', NULL),
(154, 'Eligibility Form', 21, 'sample', NULL, 'created', 5, '2026-09-17 22:13:00', NULL),
(155, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:02', NULL),
(156, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-17 22:13:05', NULL),
(157, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:05', NULL),
(158, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-17 22:13:10', NULL),
(159, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:10', NULL),
(160, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-17 22:13:12', NULL),
(161, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:12', NULL),
(162, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-17 22:13:22', NULL),
(163, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:22', NULL),
(164, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-17 22:13:35', NULL),
(165, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:35', NULL),
(166, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-17 22:13:36', NULL),
(167, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:36', NULL),
(168, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-17 22:13:43', NULL),
(169, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-17 22:13:43', NULL),
(170, 'Eligibility Form', 21, 'sample', NULL, 'enabled', 5, '2026-09-18 14:34:28', NULL),
(171, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-18 14:34:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `eligibility_forms`
--

CREATE TABLE `eligibility_forms` (
  `form_id` int(11) NOT NULL,
  `form_name` varchar(150) NOT NULL,
  `source_details` text DEFAULT NULL,
  `distribution_details` text DEFAULT NULL,
  `target_quantity` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Enabled','Disabled','Archived') NOT NULL DEFAULT 'Enabled',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `eligibility_forms`
--

INSERT INTO `eligibility_forms` (`form_id`, `form_name`, `source_details`, `distribution_details`, `target_quantity`, `start_date`, `end_date`, `status`, `created_by`, `created_at`) VALUES
(4, 'unemployed shytes', NULL, NULL, NULL, NULL, NULL, 'Archived', 4, '2026-03-16 15:45:39'),
(6, 'eacakes', NULL, NULL, NULL, NULL, NULL, 'Archived', 4, '2026-03-17 18:32:35'),
(7, 'dasdasd', NULL, NULL, NULL, NULL, NULL, 'Archived', 4, '2026-03-17 19:47:55'),
(11, 'household', NULL, NULL, NULL, NULL, NULL, 'Archived', 5, '2026-07-05 01:39:43'),
(12, 'd', NULL, NULL, NULL, NULL, NULL, 'Archived', 5, '2026-07-05 01:40:05'),
(14, 'heads', NULL, NULL, NULL, NULL, NULL, 'Archived', 5, '2026-07-05 01:45:12'),
(15, 'sa', NULL, NULL, NULL, NULL, NULL, 'Archived', 5, '2026-07-05 01:52:15'),
(16, 'Seniors', NULL, NULL, NULL, NULL, NULL, 'Enabled', 5, '2026-09-10 22:08:26'),
(17, 'Unemployed', NULL, NULL, NULL, NULL, NULL, 'Enabled', 5, '2026-09-10 22:21:38'),
(18, 'PWDs', NULL, NULL, NULL, NULL, NULL, 'Enabled', 5, '2026-09-10 22:23:10'),
(19, 'Single', NULL, NULL, NULL, NULL, NULL, 'Enabled', 5, '2026-09-11 13:19:54'),
(20, 'Divorce ', 'Vincent', '50k cash assistance', 10, '2026-09-17', '2026-09-18', 'Enabled', 5, '2026-09-17 22:10:53'),
(21, 'sample', 'sample', 'sample', 10, '2026-09-01', '2026-09-16', 'Disabled', 5, '2026-09-17 22:13:00');

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
(26, 5, 1, 0, NULL, '2026-03-16 15:53:34'),
(27, 5, 9, 0, NULL, '2026-03-16 15:53:34'),
(28, 5, 2, 0, NULL, '2026-03-16 15:53:34'),
(29, 5, 14, 1, 18, '2026-06-22 16:31:08'),
(30, 5, 7, 0, NULL, '2026-03-16 15:53:34'),
(31, 5, 4, 0, NULL, '2026-03-16 15:53:34'),
(32, 5, 10, 0, NULL, '2026-03-16 15:53:34'),
(34, 5, 17, 0, NULL, '2026-03-16 15:53:34'),
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
(75, 15, 1, 0, NULL, NULL),
(76, 15, 20, 0, NULL, NULL),
(77, 15, 9, 0, NULL, NULL),
(78, 15, 2, 0, NULL, NULL),
(79, 15, 14, 0, NULL, NULL),
(80, 15, 21, 0, NULL, NULL),
(81, 15, 7, 0, NULL, NULL),
(82, 15, 4, 0, NULL, NULL),
(83, 15, 10, 0, NULL, NULL),
(85, 15, 17, 0, NULL, NULL),
(87, 16, 20, 0, 5, '2026-09-11 13:41:27'),
(88, 16, 24, 0, NULL, NULL),
(89, 16, 32, 0, NULL, NULL),
(90, 16, 31, 0, NULL, NULL),
(91, 17, 26, 0, NULL, NULL),
(92, 17, 14, 0, NULL, NULL),
(93, 17, 29, 0, NULL, NULL),
(94, 18, 37, 1, 5, '2026-09-11 11:10:19'),
(95, 18, 6, 1, 5, '2026-09-11 11:10:21'),
(96, 18, 31, 0, NULL, NULL),
(97, 18, 17, 0, NULL, NULL),
(98, 19, 37, 0, NULL, NULL),
(99, 19, 9, 0, NULL, NULL),
(100, 19, 32, 0, NULL, NULL),
(101, 19, 26, 0, NULL, NULL),
(102, 19, 39, 0, NULL, NULL),
(103, 19, 44, 0, NULL, NULL),
(104, 19, 33, 0, NULL, NULL),
(105, 19, 17, 0, NULL, NULL),
(106, 20, 34, 1, 5, '2026-09-17 22:11:09'),
(107, 20, 36, 1, 5, '2026-09-17 22:11:13'),
(108, 21, 47, 0, NULL, NULL),
(109, 21, 20, 0, NULL, NULL),
(110, 21, 24, 0, NULL, NULL),
(111, 21, 37, 0, NULL, NULL),
(112, 21, 48, 0, NULL, NULL),
(113, 21, 9, 0, NULL, NULL),
(114, 21, 6, 0, NULL, NULL),
(115, 21, 32, 0, NULL, NULL),
(116, 21, 26, 0, NULL, NULL),
(117, 21, 34, 0, NULL, NULL),
(118, 21, 14, 0, NULL, NULL),
(119, 21, 39, 0, NULL, NULL),
(120, 21, 21, 0, NULL, NULL),
(121, 21, 43, 0, NULL, NULL),
(122, 21, 7, 0, NULL, NULL),
(123, 21, 38, 0, NULL, NULL),
(124, 21, 29, 0, NULL, NULL),
(125, 21, 44, 0, NULL, NULL),
(126, 21, 31, 0, NULL, NULL),
(127, 21, 10, 0, NULL, NULL),
(128, 21, 25, 0, NULL, NULL),
(129, 21, 33, 0, NULL, NULL),
(130, 21, 17, 0, NULL, NULL),
(131, 21, 35, 0, NULL, NULL),
(132, 21, 23, 0, NULL, NULL),
(133, 21, 30, 0, NULL, NULL),
(134, 21, 36, 0, NULL, NULL);

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
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `archived_by` int(11) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `residents`
--

INSERT INTO `residents` (`resident_id`, `f_name`, `m_name`, `l_name`, `suffix`, `sex`, `birthdate`, `birthplace`, `house_no`, `street`, `civil_status`, `occupation`, `citizenship`, `is_pwd`, `is_senior`, `is_solop`, `is_household_head`, `household_member_count`, `is_archived`, `archived_by`, `archived_at`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(6, 'Elen', 'Ramos', 'Chino', NULL, 'Female', '1967-12-03', 'Manila', '89', 'bohol', 'Divorced', 'Vendor', 'Filipino', 1, 0, 1, 0, NULL, 0, NULL, NULL, 2, '2026-02-02 13:48:27', 5, '2026-09-10 13:49:27'),
(7, 'Jose', 'Bautista', 'Hernandez', NULL, 'Male', '1985-09-12', 'Nueva Ecija', '56', 'Aguinaldo', 'Married', 'Carpenter', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 3, '2026-02-02 13:57:21', NULL, '2026-02-09 07:54:08'),
(9, 'Pedro', 'Flores', 'Castillo', 'III', 'Male', '1995-01-30', 'Opol', '78', 'Lapu-Lapu', 'Single', 'Security Guard', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-02-02 13:57:21', NULL, '2026-02-09 07:54:08'),
(10, 'Rosa', 'Diaz', 'Morales', NULL, 'Female', '1988-06-14', 'Opol', '21', 'Magsaysay', 'Married', 'Barangay Health Worker', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 2, '2026-02-02 13:57:21', NULL, '2026-02-09 07:55:32'),
(14, 'John ', NULL, 'Doe', 'Jr.', 'Male', '2021-02-06', 'Manila', '79', 'Boston', 'Divorced', NULL, 'Filipino', 0, 0, 1, 0, NULL, 0, NULL, NULL, 4, '2026-02-06 17:47:21', NULL, '2026-02-09 07:55:32'),
(17, 'sample', 'sample', 'sample', NULL, 'Male', '2005-09-27', 'japan', '21', 'sample', 'Single', 'sample', 'Filipino', 1, 0, 0, 0, NULL, 0, NULL, NULL, 4, '2026-02-12 15:35:22', 4, '2026-09-10 10:36:57'),
(20, 'Julius Cesar', 'Mabagal', 'Caliao', 'Jr', 'Male', '1900-09-27', 'Leyte', '750', 'Bohol', 'Married', 'Network Gingineer', 'Bisakol', 0, 1, 0, 0, NULL, 0, NULL, NULL, 4, '2026-04-21 18:11:53', 5, '2026-09-10 11:03:23'),
(21, 'Jheric', NULL, 'Esmeli', 'Sr', 'Male', '2026-04-15', 'Toronto', '67', 'york', 'Divorced', 'assassin', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 4, '2026-04-22 20:45:36', NULL, NULL),
(23, 'bry', NULL, 'son', NULL, 'Male', '2026-06-10', 'Manila', '89', 'kopal', 'Married', 'crew', 'Filipino', 0, 0, 1, 1, 5, 0, NULL, NULL, 5, '2026-06-16 10:10:15', 5, '2026-06-17 12:49:16'),
(24, 'Julius Cesar', 'Mabagal', 'Caliao', 'II', 'Male', '1960-07-05', 'New York, Makati', '15A', 'Madrid', 'Divorced', 'Yearner', 'Bisaya', 0, 1, 1, 0, NULL, 0, NULL, NULL, 5, '2026-07-06 11:04:07', NULL, NULL),
(25, 'Leo', NULL, 'Nidas', NULL, 'Male', '2005-09-27', 'Greece', '300', 'BC', 'Married', 'Spartan', 'Bisaya', 0, 0, 0, 1, 5, 0, NULL, NULL, 5, '2026-07-06 11:04:07', NULL, NULL),
(26, 'dasdasd', 'sqdasda', 'dasdasd', NULL, 'Male', '2005-09-27', 'asdsa', '123', 'sad', 'Single', NULL, 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-07-08 00:54:00', 5, '2026-09-10 13:49:48'),
(29, 'lala', 'lele', 'lulu', NULL, 'Male', '2005-09-27', 'Luzon', '750-6A', 'Bohol', 'Divorced', NULL, 'Filipino', 0, 0, 1, 1, 5, 0, NULL, NULL, 5, '2026-08-20 14:19:52', NULL, NULL),
(30, 'Voldermort', NULL, 'Vol', 'Sr', 'Male', '2005-05-10', 'Manila', '750-6A', 'Bohol', 'Annulled', 'Wizard', 'Bisaya', 0, 0, 0, 1, 3, 0, NULL, NULL, 5, '2026-09-10 18:02:40', 5, '2026-09-10 11:02:45'),
(31, 'Carl', NULL, 'Mangie', NULL, 'Male', '1940-12-27', 'Calamba', '1556', 'Ibarra', 'Separated', 'Astronaut', 'Bisaya', 1, 1, 1, 0, NULL, 0, NULL, NULL, 5, '2026-09-10 19:02:45', 5, '2026-09-10 13:46:19'),
(32, 'James', NULL, 'Cruz', NULL, 'Male', '1933-02-07', 'Calabarzon', '76', 'Solis', 'Single', 'Plumber', 'Filipino', 0, 1, 0, 0, NULL, 0, NULL, NULL, 5, '2026-09-10 19:13:57', 5, '2026-09-10 11:14:03'),
(33, 'Johnlee', NULL, 'Paulino', NULL, 'Male', '2005-09-27', 'Manila', '1556', 'Ibarra', 'Single', 'Pirate', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-09-10 22:06:02', 5, '2026-09-10 14:06:19'),
(34, 'Mark Adrian', 'Madlangawa', 'Dela Cruz', 'Jr', 'Male', '1999-09-11', 'Maynila', '178', 'DanDan', 'Widowed', 'Driver', 'Filipino', 0, 0, 1, 1, 3, 0, NULL, NULL, 3, '2026-09-10 22:10:57', 5, '2026-09-11 05:17:50'),
(35, 'Travis', NULL, 'Scott', 'Jr', 'Male', '2000-12-25', 'Arizona', '148 G', 'California', 'Divorced', 'Actor, Singer, and Rapper', 'Bisaya', 0, 0, 1, 1, 5, 0, NULL, NULL, 3, '2026-09-10 22:10:57', 5, '2026-09-10 14:20:48'),
(36, 'Kimi', 'No', 'Yawa', NULL, 'Female', '2000-09-27', 'Wano', '123', 'Marie', 'Widowed', 'Dimon sliyer', 'Bisaya', 0, 0, 1, 1, 2, 0, NULL, NULL, 3, '2026-09-10 22:10:57', NULL, NULL),
(37, 'Julius Cesar', NULL, 'Caliao', NULL, 'Male', '2005-09-27', 'Etivac', '1975', 'Solis', 'Single', 'Writer', 'Bisaya', 1, 0, 0, 0, NULL, 0, NULL, NULL, 3, '2026-09-10 22:10:57', NULL, NULL),
(38, 'Librong', NULL, 'James', 'Sr', 'Male', '1995-09-26', 'Amoranto', '1738', 'Bohol', 'Divorced', 'Baskitbolista', 'Filipino', 0, 0, 1, 1, 5, 0, NULL, NULL, 3, '2026-09-10 22:10:57', NULL, NULL),
(39, 'Elijah Miller', 'Mariposa', 'Esmeli', NULL, 'Male', '2006-06-06', 'Dyan Lang', '26', 'F Angeles', 'Single', 'Pickleball Pro', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-09-10 22:20:48', NULL, NULL),
(42, 'Alexandra Jelaica Mae', 'Orbita', 'Alagao', NULL, 'Female', '2005-05-16', 'Ewan ko', '1995', 'Di magiging sayo yung para sa streets', 'Separated', 'Call Center', 'Bisaya', 1, 0, 1, 0, NULL, 1, 5, '2026-09-15 09:56:41', 5, '2026-09-11 13:17:50', NULL, '2026-09-15 01:56:41'),
(43, 'John Carlo', 'Fajardo', 'Ferriols', 'Jr', 'Male', '2004-09-10', 'Tondo', '304', 'Gerona', 'Married', 'Freelancer', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-09-11 13:17:50', NULL, NULL),
(44, 'Sean Paul', 'Santino', 'Macasinag', NULL, 'Male', '2004-05-09', 'Manila', '531', 'Francisco', 'Single', 'Student', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-09-11 13:17:50', NULL, NULL),
(47, 'Callie', NULL, 'Caliao', NULL, 'Female', '2005-09-27', 'Manila', '700', 'Bohol', 'Single', 'Cat', 'Filipino', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-09-11 11:25:55', 5, '2026-09-15 02:08:47'),
(48, 'Spot', NULL, 'Caliao', NULL, 'Female', '2025-11-13', 'Manila', '750', 'Bohol', 'Single', 'Dog', 'Bisaya', 0, 0, 0, 0, NULL, 0, NULL, NULL, 5, '2026-09-13 11:32:19', NULL, NULL);

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
(3, 'glen', '$2b$10$Qtk5cxJCAfBxitRN2NtjDu6sTgEvwg/KKjoFJQWlZwqfD8ZUnw5ue', 'Glen Pat', 'Staff', 'Active', NULL, '2026-01-23 21:38:47', 5, '2026-09-11 12:47:50', 0),
(4, 'rus ', '$2b$10$RZinA3VTVxkinV1eVA7G1ezOGz1R10snSK347c73Bhvx74KH7nOai', 'rus vill', 'Staff', 'Active', NULL, '2026-01-25 20:23:57', NULL, '2026-04-12 18:04:54', 0),
(5, 'rald', '$2b$10$xKwr0HBO7SHgKqlDmCNuT.HFN/HwYMRrZfcGY0uScOjEnuyuVGZke', 'Herald Nigger', 'Admin', 'Active', 2, '2026-01-26 19:02:53', NULL, '2026-04-12 18:04:54', 0),
(6, 'James', '$2b$10$A8MCfaYXN4rPfwutc.jxK.OTZUqOPOniLQXEoQkJ9f.qU5cN6Nt.e', 'James Smith', 'Staff', 'Active', 4, '2026-03-07 18:12:30', NULL, '2026-04-12 18:04:54', 0),
(10, 'reid', '$2b$10$Q2aZiIn0uKvRu8lLzuyUO.c7HAeGmjnxMK5CCUkHk0MQlqLpVOCjW', 'James Reid', 'Admin', 'Inactive', 4, '2026-03-07 22:46:30', 4, '2026-04-12 18:04:54', 0),
(15, 'sample', '$2b$10$p/imSAnE72uXhYb7/wHDGers80g0Zisqw0sJFdcVx3ra2ZLBjGQte', 'sample', 'Staff', 'Active', 4, '2026-04-12 18:32:23', 15, '2026-04-12 18:48:50', 0),
(16, 'brod', '$2b$10$.q.vqBRjSJWVDpAF6UjWMuDMrPGFDY5Z52TVDWwcp3zdLfqjc/Tly', 'bru', 'Admin', 'Active', 4, '2026-04-28 00:44:16', 5, '2026-09-10 21:54:52', 0),
(17, 'mong', '$2b$10$5BSfOvozi1tVG1gQsJtaAOJodSou7hghdFHA1NM53ka1cuwuS.prq', 'mong yaw', 'Staff', 'Active', 5, '2026-06-22 16:15:42', 17, '2026-06-22 16:16:15', 0),
(18, 'potchi', '$2b$10$k0t4gDpgX..s.5J4OhvddeSI25kOEImcTU4JsY1VZUhu7tSPPXBH.', 'potchi', 'Staff', 'Active', 5, '2026-06-22 16:30:25', 18, '2026-06-22 16:30:39', 0),
(19, 'cos', '$2b$10$0/FJQuchNDYGFk1/UWfzke2gQG45uj1OFuDJvMKFnXMAgVLQsKZLa', 'cosme ', 'Admin', 'Active', 5, '2026-07-02 15:39:15', 19, '2026-09-07 22:39:54', 0),
(20, 'kiw', '$2b$10$O9yx7PnAtvYR9DRusqCnr.Pwvzx01qh3oDivi8eIXXgCRgOGRjBf6', 'kiw', 'Staff', 'Active', 5, '2026-09-04 18:04:47', 20, '2026-09-04 18:05:48', 0);

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
  ADD KEY `eligibility_forms_ibfk_1` (`created_by`),
  ADD KEY `idx_status_end_date` (`status`,`end_date`);

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
  ADD KEY `residents_ibfk_2` (`updated_by`),
  ADD KEY `residents_ibfk_3` (`archived_by`),
  ADD KEY `idx_is_archived` (`is_archived`);

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
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=172;

--
-- AUTO_INCREMENT for table `eligibility_forms`
--
ALTER TABLE `eligibility_forms`
  MODIFY `form_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `eligibility_forms_entries`
--
ALTER TABLE `eligibility_forms_entries`
  MODIFY `entry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT for table `residents`
--
ALTER TABLE `residents`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

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
  ADD CONSTRAINT `residents_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `residents_ibfk_3` FOREIGN KEY (`archived_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

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
