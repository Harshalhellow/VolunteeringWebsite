-- MySQL dump 10.13  Distrib 8.0.33, for Linux (x86_64)
--
-- Host: localhost    Database: dabase
-- ------------------------------------------------------
-- Server version	8.0.33-0ubuntu0.22.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Group_Members`
--

DROP TABLE IF EXISTS `Group_Members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Group_Members` (
  `isAdmin` int NOT NULL DEFAULT '0',
  `Email_Preference` int NOT NULL DEFAULT '0',
  `userID` int NOT NULL,
  `groupID` int NOT NULL,
  `event` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`groupID`,`userID`),
  KEY `FK_GroupMembers_Groups` (`groupID`),
  KEY `FK_GroupMembers_Users` (`userID`),
  CONSTRAINT `FK_GroupMembers_Groups` FOREIGN KEY (`groupID`) REFERENCES `Groups` (`groupID`) ON DELETE CASCADE,
  CONSTRAINT `FK_GroupMembers_Users` FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Group_Members`
--

LOCK TABLES `Group_Members` WRITE;
/*!40000 ALTER TABLE `Group_Members` DISABLE KEYS */;
INSERT INTO `Group_Members` VALUES (0,0,2,1,0),(0,0,3,1,1),(0,1,3,2,0);
/*!40000 ALTER TABLE `Group_Members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Groups`
--

DROP TABLE IF EXISTS `Groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Groups` (
  `Description` varchar(2000) DEFAULT NULL,
  `groupID` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(255) DEFAULT NULL,
  `phoneNumber` varchar(255) DEFAULT NULL,
  `Group_Name` varchar(40) NOT NULL,
  PRIMARY KEY (`groupID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Groups`
--

LOCK TABLES `Groups` WRITE;
/*!40000 ALTER TABLE `Groups` DISABLE KEYS */;
INSERT INTO `Groups` VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit',1,'someEmail','somePhoneNumber','Whiskers Pet Sitting'),('Lorem ipsum dolor sit amet, consectetur adipiscing elit',2,'stuff@stuff.com','phoneNumber','STEM'),('Lorem ipsum dolor sit amet, consectetur adipiscing elit',3,'stuff@test.com','phoneNumer','Sports'),('consectetur adipiscing elit',4,'emailhere','phoneNumber','Book Club');
/*!40000 ALTER TABLE `Groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Posts`
--

DROP TABLE IF EXISTS `Posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Posts` (
  `PostID` int NOT NULL AUTO_INCREMENT,
  `Timestamp` char(17) DEFAULT NULL,
  `Description` varchar(2000) DEFAULT NULL,
  `Post_Category` varchar(10) DEFAULT NULL,
  `Post_Title` varchar(30) DEFAULT NULL,
  `groupID` int NOT NULL,
  PRIMARY KEY (`PostID`),
  KEY `FK_Posts_Groups` (`groupID`),
  CONSTRAINT `FK_Posts_Groups` FOREIGN KEY (`groupID`) REFERENCES `Groups` (`groupID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Posts`
--

LOCK TABLES `Posts` WRITE;
/*!40000 ALTER TABLE `Posts` DISABLE KEYS */;
INSERT INTO `Posts` VALUES (1,'0','thisisdescription','health','thisistitle',1),(2,'1230','Test Posts information here','post','Post1test',1),(3,'1230','Test Posts information here2','post','Post2test',1),(4,'1230','Test Posts information here3','post','Post3TEST',1),(5,NULL,'Include Time and Date afdass well as the event location!','Event','Event',1),(6,NULL,'Include Tfdasime and Date as well as the event location!','Event','Event',1),(7,NULL,'Enterfdafa Content:','Post','fdafa',1),(8,NULL,'Enterfdafa Content:','Post','fdafa',1),(9,NULL,'Enterfdafa Content:','Post','fdafa',1),(10,NULL,'evne to fdthsea ae event location!','Event','Bro pleas ewor ',1);
/*!40000 ALTER TABLE `Posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `Password` varchar(255) DEFAULT NULL,
  `Text_Color` char(7) DEFAULT '#000000',
  `Email` varchar(255) NOT NULL,
  `Color1` char(7) DEFAULT '#B5C0D0',
  `Color2` char(7) DEFAULT '#CCD3CA',
  `Color3` char(7) DEFAULT '#fffcf5',
  `Color4` char(7) DEFAULT '#e3e6f0',
  `Email_Toggle` int DEFAULT '1',
  `System_Admin_Toggle` int NOT NULL DEFAULT '0',
  `Username` varchar(255) NOT NULL,
  `userID` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES ('$argon2id$v=19$m=65536,t=3,p=4$jufczosAEK+hcsWVvaA7zw$d8MGQ/I823rkZ1Lmw0e3jvApOE/1/emWWLYqD6v1unQ','#000000','joe.blogs@email.com','#B5C0D0','#CCD3CA','#fffcf5','#e3e6f0',1,1,'Joe Blogs',1),('$argon2id$v=19$m=65536,t=3,p=4$lDrqeTZwUFK/TSGTyNKZIg$6fH/jsqdCSCnw18eKv/CMUn63DpFPXsWR2z8l4mCksQ','#000000','test121@gmail.com','#B5C0D0','#CCD3CA','#fffcf5','#e3e6f0',1,0,'test121',2),('$argon2id$v=19$m=65536,t=3,p=4$TH1i8ohosaaoHAXEgRKHTQ$NWd+LSSRY/UxWDcaFvo82n/9VPAoG1tV43C9cG4kRYM','#000000','stuff@email.com','#B5C0D0','#CCD3CA','#fffcf5','#e3e6f0',1,0,'powerrangers',3),(NULL,'#000000','hmishra123456789@gmail.com','#B5C0D0','#CCD3CA','#fffcf5','#e3e6f0',1,0,'Harshal Mishra',4);
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-17 13:59:09
