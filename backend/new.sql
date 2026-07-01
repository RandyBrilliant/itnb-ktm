/*
SQLyog Ultimate v13.1.1 (32 bit)
MySQL - 10.11.14-MariaDB-0+deb12u2-log : Database - itnb_certificate
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`itnb_certificate` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `itnb_certificate`;

/*Table structure for table `certificate` */

DROP TABLE IF EXISTS `certificate`;

CREATE TABLE `certificate` (
  `Code` char(64) NOT NULL,
  `CertificateNo` varchar(30) NOT NULL,
  `No` int(10) unsigned NOT NULL,
  `CertificateName` varchar(100) NOT NULL,
  `CertificateID` varchar(20) NOT NULL,
  `CertificateInstitution` varchar(50) NOT NULL DEFAULT '',
  `CertificateEvent` varchar(150) NOT NULL,
  `CertificateRole` varchar(30) DEFAULT NULL,
  `CertificateDate` varchar(30) NOT NULL,
  `Count` int(11) DEFAULT 0,
  `ScannedOn` datetime DEFAULT NULL,
  `CertificateURL` varchar(500) NOT NULL DEFAULT '',
  PRIMARY KEY (`No`,`CertificateNo`),
  UNIQUE KEY `Code` (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
