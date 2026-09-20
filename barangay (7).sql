-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 20, 2026 at 09:21 PM
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
(171, 'Eligibility Form', 21, 'sample (auto-locked)', NULL, 'disabled', NULL, '2026-09-18 14:34:28', NULL),
(172, 'Resident', 49, 'glendardo Pata', NULL, 'added', 5, '2026-09-18 20:16:44', NULL),
(173, 'Resident', 3, 'Julius Caliao', NULL, 'added', 5, '2026-09-18 20:43:33', NULL),
(174, 'Resident', 4, 'Callie Caliao', NULL, 'member_added', 5, '2026-09-18 20:44:28', NULL),
(175, 'Resident', 1, 'Test User', NULL, 'archived', 5, '2026-09-18 20:46:03', NULL),
(176, 'Resident', 5, 'Fred Caliao', NULL, 'member_added', 5, '2026-09-18 20:51:02', NULL),
(177, 'Resident', 3, 'Julius Caliao', NULL, 'archived', 5, '2026-09-18 20:51:23', NULL),
(178, 'Resident', 5, 'Fred Caliao', '\"Auto-promoted to household head when Julius Caliao was archived\"', 'head_transferred', 5, '2026-09-18 20:51:23', NULL),
(179, 'Resident', 6, 'Leon Caliao', NULL, 'member_added', 5, '2026-09-18 20:59:52', NULL),
(180, 'Resident', 6, 'Leon Caliao', NULL, 'removed_from_household', 5, '2026-09-18 21:12:28', NULL),
(181, 'Resident', 6, 'Leon Caliao', NULL, 'archived', 5, '2026-09-18 21:13:18', NULL),
(182, 'Resident', 6, 'Leon Caliao', NULL, 'restored', 5, '2026-09-18 21:15:42', NULL),
(183, 'Resident', 4, 'Callie Caliao', NULL, 'archived', 5, '2026-09-18 21:16:01', NULL),
(184, 'Resident', 4, 'Callie Caliao', NULL, 'restored', 5, '2026-09-18 21:16:12', NULL),
(185, 'Resident', 4, 'Callie Caliao', NULL, 'archived', 5, '2026-09-18 21:21:05', NULL),
(186, 'Resident', 7, 'Voldemort Caliao', NULL, 'member_added', 5, '2026-09-18 21:21:44', NULL),
(187, 'Resident', 7, 'Voldemort Caliao', NULL, 'archived', 5, '2026-09-18 21:21:49', NULL),
(188, 'Resident', 7, 'Voldemort Caliao', NULL, 'restored', 5, '2026-09-18 21:22:00', NULL),
(189, 'Resident', NULL, '1 added', '{\"added\":[{\"resident_id\":8,\"name\":\"Marco Eljan\"}],\"updated\":[]}', 'imported', 5, '2026-09-19 01:05:27', NULL),
(190, 'Resident', NULL, '1 added', '{\"added\":[{\"resident_id\":9,\"name\":\"Christian Cosme\",\"head_name\":\"Marco Eljan\"}],\"updated\":[]}', 'imported', 5, '2026-09-19 01:05:58', NULL),
(191, 'Resident', NULL, '1 updated', '{\"added\":[],\"updated\":[{\"resident_id\":9,\"name\":\"Christian Cosme\",\"changes\":[{\"field\":\"House No.\",\"from\":\"\",\"to\":\"14\"},{\"field\":\"Street\",\"from\":\"\",\"to\":\"Angeles\"}]}]}', 'imported', 5, '2026-09-19 01:06:59', NULL),
(192, 'Resident', NULL, '1 updated', '{\"added\":[],\"updated\":[{\"resident_id\":8,\"name\":\"Marco Eljan\",\"changes\":[]}]}', 'imported', 5, '2026-09-19 01:07:35', NULL),
(193, 'Eligibility Form', 1, 'Caliao Fam', NULL, 'created', 5, '2026-09-19 01:25:16', NULL),
(194, 'Resident', 10, 'Ginger Caliao', NULL, 'member_added', 5, '2026-09-19 01:52:20', NULL),
(195, 'Resident', 11, 'Callie Caliao', NULL, 'member_added', 5, '2026-09-19 01:53:00', NULL),
(196, 'Eligibility Form', 2, 'School Supplies', NULL, 'created', 5, '2026-09-19 01:54:06', NULL),
(197, 'Resident', 9, 'Christian Cosme', NULL, 'archived', 5, '2026-09-19 01:59:45', NULL),
(198, 'Resident', 9, 'Christian Cosme', NULL, 'restored', 5, '2026-09-19 01:59:53', NULL),
(199, 'Eligibility Entry', 1, 'Fred Caliao', NULL, 'marked_received', 5, '2026-09-19 02:02:54', NULL),
(200, 'Resident', 5, 'Fred Caliao', NULL, 'updated', 5, '2026-09-20 19:26:00', '[{\"field\":\"Sex\",\"from\":\"Male\",\"to\":\"Female\"}]'),
(201, 'Account', 16, 'brodie', NULL, 'updated', 5, '2026-09-20 19:26:55', '[{\"field\":\"Username\",\"from\":\"brod\",\"to\":\"brodie\"}]'),
(202, 'Account', 16, 'brodie', NULL, 'Password Reset', 5, '2026-09-20 19:27:08', NULL),
(203, 'Eligibility Form', 1, 'Caliao Fam (auto-locked)', NULL, 'disabled', NULL, '2026-09-21 02:05:00', NULL),
(204, 'Eligibility Form', 2, 'School Supplies (auto-locked)', NULL, 'disabled', NULL, '2026-09-21 02:05:00', NULL),
(205, 'Database', NULL, 'barangay_backup_2026-09-21_022151.sql.enc', '{\"status\":\"success\",\"expected\":{\"residents\":11,\"accounts\":13,\"eligibility_forms\":2,\"eligibility_entries\":5},\"actual\":{\"residents\":11,\"accounts\":13,\"eligibility_forms\":2,\"eligibility_entries\":5},\"missing\":{}}', 'restored', 5, '2026-09-21 02:22:21', NULL),
(206, 'Eligibility Form', 3, 'Ayuda', NULL, 'created', 5, '2026-09-21 02:29:02', NULL);

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
(1, 'Caliao Fam', 'Riot', '3000 VP', 3, '2026-09-19', '2026-09-20', 'Disabled', 5, '2026-09-19 01:25:16'),
(2, 'School Supplies', 'Deped', 'School Supplies', 100, '2026-09-19', '2026-09-20', 'Disabled', 5, '2026-09-19 01:54:06'),
(3, 'Ayuda', 'Never Grow Old', '10k', 5, '2026-09-21', '2026-09-22', 'Enabled', 5, '2026-09-21 02:29:02');

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
(1, 1, 5, 1, 5, '2026-09-19 02:02:54'),
(2, 1, 6, 0, NULL, NULL),
(3, 1, 7, 0, NULL, NULL),
(4, 2, 11, 0, NULL, NULL),
(5, 2, 10, 0, NULL, NULL),
(6, 3, 11, 0, NULL, NULL),
(7, 3, 5, 0, NULL, NULL),
(8, 3, 10, 0, NULL, NULL),
(9, 3, 6, 0, NULL, NULL),
(10, 3, 7, 0, NULL, NULL),
(11, 3, 9, 0, NULL, NULL),
(12, 3, 8, 0, NULL, NULL),
(13, 3, 2, 0, NULL, NULL);

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
  `head_resident_id` int(11) DEFAULT NULL,
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

INSERT INTO `residents` (`resident_id`, `f_name`, `m_name`, `l_name`, `suffix`, `sex`, `birthdate`, `birthplace`, `house_no`, `street`, `civil_status`, `occupation`, `citizenship`, `is_pwd`, `is_senior`, `is_solop`, `is_household_head`, `head_resident_id`, `is_archived`, `archived_by`, `archived_at`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(1, 'Test', NULL, 'User', NULL, 'Male', '1990-01-01', 'Manila', '123', 'Main St', 'Single', NULL, 'Filipino', 0, 0, 0, 0, NULL, 1, 5, '2026-09-18 20:46:03', 1, '2026-09-18 20:32:39', NULL, '2026-09-18 12:46:03'),
(2, 'Test2', NULL, 'User2', NULL, 'Male', '1990-01-01', 'Manila', NULL, '123 Main St', 'Single', NULL, 'Filipino', 0, 0, 0, 1, NULL, 0, NULL, NULL, 1, '2026-09-18 20:34:48', NULL, NULL),
(3, 'Julius', NULL, 'Caliao', NULL, 'Male', '2005-09-27', 'Biliran', '750', 'Bohol', 'Single', 'Student', 'Filipino', 0, 0, 0, 0, NULL, 1, 5, '2026-09-18 20:51:23', 5, '2026-09-18 20:43:33', NULL, '2026-09-18 12:51:23'),
(4, 'Callie', NULL, 'Caliao', NULL, 'Male', '2015-09-27', 'Manila', NULL, NULL, 'Single', 'Driver', 'Filipino', 0, 0, 0, 1, NULL, 1, 5, '2026-09-18 21:21:05', 5, '2026-09-18 20:44:28', NULL, '2026-09-18 13:21:05'),
(5, 'Fred', NULL, 'Caliao', NULL, 'Female', '2012-09-27', 'Manila', '750', 'Bohol', 'Single', NULL, 'Filipino', 0, 0, 0, 1, NULL, 0, NULL, NULL, 5, '2026-09-18 20:51:02', 5, '2026-09-20 11:26:00'),
(6, 'Leon', NULL, 'Caliao', NULL, 'Male', '2015-09-27', 'Manila', '123', 'Solis', 'Single', NULL, 'Filipino', 0, 0, 0, 1, NULL, 0, NULL, NULL, 5, '2026-09-18 20:59:52', 5, '2026-09-18 13:15:42'),
(7, 'Voldemort', NULL, 'Caliao', NULL, 'Male', '2020-09-27', 'Manila', NULL, NULL, 'Single', NULL, 'Filipino', 0, 0, 0, 0, 6, 0, NULL, NULL, 5, '2026-09-18 21:21:44', NULL, '2026-09-18 13:22:00'),
(8, 'Marco', NULL, 'Eljan', 'Sr', 'Male', '2004-09-03', 'Nueva Ecija', '14', 'Angeles', 'Divorced', 'Gingineer', 'Bisaya', 0, 0, 1, 1, NULL, 0, NULL, NULL, 5, '2026-09-18 22:16:27', 5, '2026-09-18 17:07:35'),
(9, 'Christian', NULL, 'Cosme', NULL, 'Male', '2005-08-15', 'Quezon City', NULL, NULL, 'Single', 'Pro Pliyer', 'Bisaya', 0, 0, 0, 0, 8, 0, NULL, NULL, 5, '2026-09-18 22:26:37', 5, '2026-09-18 17:59:53'),
(10, 'Ginger', NULL, 'Caliao', NULL, 'Male', '2010-09-22', 'Manila', NULL, NULL, 'Single', 'Student', 'Filipino', 0, 0, 0, 0, 5, 0, NULL, NULL, 5, '2026-09-19 01:52:20', NULL, NULL),
(11, 'Callie', NULL, 'Caliao', NULL, 'Female', '2011-09-27', 'Manila', NULL, NULL, 'Single', 'Student', 'Filipino', 0, 0, 0, 0, 5, 0, NULL, NULL, 5, '2026-09-19 01:53:00', NULL, NULL);

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
(16, 'brodie', '$2b$10$J9zRJgKJCWWEM/4kTDaALuR4BQEHet6YV4Tgm6/jne903FV0TqSnG', 'bru', 'Admin', 'Active', 4, '2026-04-28 00:44:16', 5, '2026-09-20 19:27:08', 1),
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
  ADD KEY `idx_is_archived` (`is_archived`),
  ADD KEY `idx_head_resident` (`head_resident_id`);

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
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=207;

--
-- AUTO_INCREMENT for table `eligibility_forms`
--
ALTER TABLE `eligibility_forms`
  MODIFY `form_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `eligibility_forms_entries`
--
ALTER TABLE `eligibility_forms_entries`
  MODIFY `entry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `residents`
--
ALTER TABLE `residents`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
  ADD CONSTRAINT `fk_head_resident` FOREIGN KEY (`head_resident_id`) REFERENCES `residents` (`resident_id`) ON DELETE SET NULL ON UPDATE CASCADE,
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
