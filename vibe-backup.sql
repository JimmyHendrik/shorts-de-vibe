-- MySQL dump 10.13  Distrib 8.4.11, for Linux (x86_64)
--
-- Host: localhost    Database: vibe
-- ------------------------------------------------------
-- Server version	8.4.11

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
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `video_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `body` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comments_user_id_foreign` (`user_id`),
  KEY `comments_parent_id_foreign` (`parent_id`),
  KEY `comments_video_id_created_at_index` (`video_id`,`created_at`),
  CONSTRAINT `comments_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,2,2,NULL,'teste','2026-09-16 02:28:33','2026-09-16 02:28:33'),(2,2,3,NULL,'estamos em processo','2026-09-16 21:34:05','2026-09-16 21:34:05'),(3,3,3,NULL,'tamo progredindo','2026-09-17 01:24:21','2026-09-17 01:24:21');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `video_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_video_id_user_id_unique` (`video_id`,`user_id`),
  KEY `favorites_user_id_foreign` (`user_id`),
  CONSTRAINT `favorites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (1,2,3,'2026-09-16 21:33:52','2026-09-16 21:33:52');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `follower_id` bigint unsigned NOT NULL,
  `following_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `follows_follower_id_following_id_unique` (`follower_id`,`following_id`),
  KEY `follows_following_id_foreign` (`following_id`),
  CONSTRAINT `follows_follower_id_foreign` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_following_id_foreign` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
INSERT INTO `follows` VALUES (1,3,1,'2026-09-19 18:14:04','2026-09-19 18:14:04');
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hidden_users`
--

DROP TABLE IF EXISTS `hidden_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hidden_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `hidden_user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hidden_users_user_id_hidden_user_id_unique` (`user_id`,`hidden_user_id`),
  KEY `hidden_users_hidden_user_id_foreign` (`hidden_user_id`),
  CONSTRAINT `hidden_users_hidden_user_id_foreign` FOREIGN KEY (`hidden_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hidden_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hidden_users`
--

LOCK TABLES `hidden_users` WRITE;
/*!40000 ALTER TABLE `hidden_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `hidden_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hidden_videos`
--

DROP TABLE IF EXISTS `hidden_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hidden_videos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `video_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hidden_videos_user_id_video_id_unique` (`user_id`,`video_id`),
  KEY `hidden_videos_video_id_foreign` (`video_id`),
  CONSTRAINT `hidden_videos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hidden_videos_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hidden_videos`
--

LOCK TABLES `hidden_videos` WRITE;
/*!40000 ALTER TABLE `hidden_videos` DISABLE KEYS */;
/*!40000 ALTER TABLE `hidden_videos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_08_04_023156_create_personal_access_tokens_table',2),(5,'2026_08_04_023312_add_profile_fields_to_users_table',3),(6,'2026_08_04_023313_create_videos_table',3),(7,'2026_08_04_023314_create_comments_table',3),(8,'2026_08_04_023316_create_video_likes_table',3),(9,'2026_08_04_023317_create_favorites_table',3),(10,'2026_08_04_023318_create_follows_table',3),(11,'2026_09_15_000001_add_google_id_to_users_table',4),(12,'2026_09_16_000002_add_profile_controls',5),(13,'2026_09_16_000003_create_playlists_tables',5),(14,'2026_09_16_000004_add_interests_to_users_table',6),(15,'2026_09_16_000005_add_location_to_videos_table',7),(16,'2026_09_16_000006_add_publish_options_to_videos_table',8),(17,'2026_09_19_000007_add_shares_count_to_videos_table',9),(18,'2026_09_19_000008_create_notifications_table',9),(19,'2026_09_22_000009_remove_google_login_data',10),(20,'2026_09_23_000010_create_feed_safety_tables',10),(21,'2026_09_23_000011_create_video_views_table',11);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `actor_id` bigint unsigned DEFAULT NULL,
  `video_id` bigint unsigned DEFAULT NULL,
  `type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_actor_id_foreign` (`actor_id`),
  KEY `notifications_video_id_foreign` (`video_id`),
  KEY `notifications_user_id_read_at_index` (`user_id`,`read_at`),
  CONSTRAINT `notifications_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,3,NULL,'follow',NULL,NULL,'2026-09-19 18:14:04','2026-09-19 18:14:04');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES ('hendriksouza97@gmail.com','$2y$12$hwjlXKPxESr1nINZm7Q.oOM.OpNYj4byqLGG2ZpU2StIJOCTTSn.u','2026-09-23 13:43:59');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',1,'vibe-web','8e9dbd51e442a733886ba33ac76abb7f6fd6e871c9717a968f48176b550d05f1','[\"*\"]',NULL,NULL,'2026-08-04 02:51:05','2026-08-04 02:51:05'),(2,'App\\Models\\User',1,'vibe-web','91ca3fb92576f7ef089b9935e313aac440867028a67b4013f6c362e8b13fe001','[\"*\"]','2026-08-04 02:58:08',NULL,'2026-08-04 02:58:07','2026-08-04 02:58:08'),(3,'App\\Models\\User',1,'vibe-web','63141967ff720084b86167e3278bc42ef90ccbbb9d9d291654e2108a8eb59120','[\"*\"]','2026-08-04 03:09:10',NULL,'2026-08-04 03:04:25','2026-08-04 03:09:10'),(4,'App\\Models\\User',1,'vibe-web','3f1e8bd395fa57aca8477c98c978985f41726d093fe9c9999920c7b2cd545183','[\"*\"]',NULL,NULL,'2026-08-04 03:32:06','2026-08-04 03:32:06'),(5,'App\\Models\\User',1,'vibe-web','90e5b58395ca05ffad70aecc74a076fa56e4105d8d8e3c7a2c8ca2768df46958','[\"*\"]',NULL,NULL,'2026-08-04 03:32:18','2026-08-04 03:32:18'),(6,'App\\Models\\User',1,'vibe-web','1c12fdfaaa59e84abec7ab9dde280fcffd9ac39b7c8073f30ed15f15b5c5183f','[\"*\"]',NULL,NULL,'2026-08-04 03:32:37','2026-08-04 03:32:37'),(7,'App\\Models\\User',1,'vibe-web','3187e43a8675fb4a7bbc2cc5c72220793abc32bbdefacd5e39eb9f8c4f038c71','[\"*\"]',NULL,NULL,'2026-08-04 03:41:12','2026-08-04 03:41:12'),(8,'App\\Models\\User',1,'vibe-web','a3434e078b29a8e9a7847afd8dbba6dcfb0a1288d8257cd057fb49ef235cc3ab','[\"*\"]',NULL,NULL,'2026-08-04 03:46:39','2026-08-04 03:46:39'),(9,'App\\Models\\User',1,'vibe-web','55d00f1ffd062ac8bd9ed479fea9e80f1d48a3a3ecaa12f1fd3c2c35bbbc2e44','[\"*\"]','2026-08-04 03:55:32',NULL,'2026-08-04 03:55:27','2026-08-04 03:55:32'),(10,'App\\Models\\User',1,'vibe-web','7092657b7c5b36df946c2c0c31a8928ad6f37ef487a3cd7bd671739641999591','[\"*\"]','2026-08-04 04:02:52',NULL,'2026-08-04 04:01:59','2026-08-04 04:02:52'),(11,'App\\Models\\User',2,'vibe-web','faa78116e75b736643a1a9164441e6155780b7b5116163d6855d529b3b96e725','[\"*\"]','2026-09-16 02:39:33',NULL,'2026-09-16 02:28:22','2026-09-16 02:39:33'),(14,'App\\Models\\User',3,'vibe-google','abb383cea7925615f45c2c28abdc642bce14c1002cbda0642534ba58e39872a8','[\"*\"]','2026-09-16 13:53:26',NULL,'2026-09-16 13:26:19','2026-09-16 13:53:26'),(15,'App\\Models\\User',3,'vibe-google','f9f8cede4090e9ce9a47cea192b5e84e93d75d8e7912d9fa1ec72805db0b7b83','[\"*\"]','2026-09-16 20:44:05',NULL,'2026-09-16 13:59:49','2026-09-16 20:44:05'),(16,'App\\Models\\User',3,'vibe-google','161d954e2b4206815449c39ade68dddda3e57ad1507284e36aaa83b2213c9e4e','[\"*\"]','2026-09-16 21:24:59',NULL,'2026-09-16 20:46:14','2026-09-16 21:24:59'),(17,'App\\Models\\User',3,'vibe-google','6718a2804a405e414d24c0e2feeb7fe8d3e20b720b9136ea46ce60a2e4884ef6','[\"*\"]','2026-09-16 21:27:38',NULL,'2026-09-16 21:27:37','2026-09-16 21:27:38'),(18,'App\\Models\\User',3,'vibe-google','e5e5c7413badccb04609ea37edec9f8265898feeab1e39e7a09a407a8323fa12','[\"*\"]','2026-09-16 21:37:53',NULL,'2026-09-16 21:30:29','2026-09-16 21:37:53'),(19,'App\\Models\\User',3,'vibe-google','a2a02ff72f72692f36db4a8b502ba9683701a27e0b7b547a29b64ab26c95b666','[\"*\"]','2026-09-16 21:53:33',NULL,'2026-09-16 21:44:36','2026-09-16 21:53:33'),(20,'App\\Models\\User',3,'vibe-google','18ef925b2c57b6033a043efd676644376c32e77dc85eac92013b3c8729232ce8','[\"*\"]','2026-09-17 01:24:45',NULL,'2026-09-16 23:19:51','2026-09-17 01:24:45'),(21,'App\\Models\\User',3,'vibe-google','13f0435e1e01d359fcec904cffd8dc1237829b349fefb3ef70500943b1b8a6f9','[\"*\"]','2026-09-17 12:31:14',NULL,'2026-09-17 11:50:36','2026-09-17 12:31:14'),(22,'App\\Models\\User',3,'vibe-google','6cf412feb78734cb923a9ccec6f9492c6e2ce72e45d80254bb05abf7cb2b0aa0','[\"*\"]','2026-09-18 13:22:53',NULL,'2026-09-18 11:56:52','2026-09-18 13:22:53'),(23,'App\\Models\\User',3,'vibe-google','bb3250beadef3a9955fcbc23f36e66599f7b717d2b44d6a17156e45a96904b01','[\"*\"]','2026-09-19 15:45:32',NULL,'2026-09-19 14:56:54','2026-09-19 15:45:32'),(25,'App\\Models\\User',3,'vibe-google','ebdd0961738c68c92c595451b5b13fbfde23087a1c8086eae9b5dbf701e31834','[\"*\"]',NULL,NULL,'2026-09-19 15:51:15','2026-09-19 15:51:15'),(26,'App\\Models\\User',3,'vibe-google','70c7e69c585e9fd5940e6653c36e17e30e997ac6b77033c55d90ffe8bd03162a','[\"*\"]',NULL,NULL,'2026-09-19 15:51:52','2026-09-19 15:51:52'),(29,'App\\Models\\User',3,'vibe-google','914b9c743ae9a207ac08fcb6c3e84195b9abd7eb2e6ba27fde16a3401dd0528f','[\"*\"]','2026-09-20 00:38:40',NULL,'2026-09-19 17:50:55','2026-09-20 00:38:40'),(30,'App\\Models\\User',3,'vibe-google','2eebe399228bf4ad06e44de2051f81ff87d63d4b6d1f3b6a746f71193e577cb3','[\"*\"]','2026-09-22 15:29:22',NULL,'2026-09-22 15:29:20','2026-09-22 15:29:22'),(31,'App\\Models\\User',4,'vibe-web','125f37b83df7137a75c4294cfb2586122947278625a0db14c932ee579b1dbf51','[\"*\"]',NULL,NULL,'2026-09-23 13:28:08','2026-09-23 13:28:08'),(32,'App\\Models\\User',5,'vibe-web','2887c3dfe241ff84b5f77f42c03a91a253d9519f7894e80f5ce96c28da69d98f','[\"*\"]','2026-09-23 14:14:20',NULL,'2026-09-23 13:30:20','2026-09-23 14:14:20'),(33,'App\\Models\\User',6,'vibe-web','7ed968868cf3401addf97867f7ddef4b87e35f212b6aa85372db43764fd07f26','[\"*\"]','2026-09-23 13:57:19',NULL,'2026-09-23 13:57:19','2026-09-23 13:57:19'),(34,'App\\Models\\User',7,'vibe-web','9affd849468892b8d06eea9ab6131e106703a9179705ce1339e66844dc77971a','[\"*\"]',NULL,NULL,'2026-09-23 14:01:04','2026-09-23 14:01:04'),(35,'App\\Models\\User',7,'vibe-web','255868da3b05c92b308c22017af898448417c365b5c8d2602413d80fdb02de80','[\"*\"]','2026-09-23 14:01:05',NULL,'2026-09-23 14:01:05','2026-09-23 14:01:05'),(36,'App\\Models\\User',8,'vibe-web','c82946ed2bfc8c98175a595aa722b57d59091e07c57ac37af4b7d227489173ce','[\"*\"]',NULL,NULL,'2026-09-23 14:01:38','2026-09-23 14:01:38'),(37,'App\\Models\\User',8,'vibe-web','593b05b06d548d376ee0ea6dd0ffde544b947a987d24ebc4c5f557d2566d6330','[\"*\"]','2026-09-23 14:01:38',NULL,'2026-09-23 14:01:38','2026-09-23 14:01:38'),(38,'App\\Models\\User',3,'vibe-web','b45d84f8ce345aed1289915569ef6fc9452933d282feab0901582a9b76478e6e','[\"*\"]',NULL,NULL,'2026-09-23 17:07:36','2026-09-23 17:07:36'),(39,'App\\Models\\User',3,'vibe-web','1599396722db7f617232e2f5bd151d8f1512c347d6b743c2d1792ece8d488cb6','[\"*\"]','2026-09-23 17:11:26',NULL,'2026-09-23 17:11:25','2026-09-23 17:11:26'),(42,'App\\Models\\User',3,'vibe-web','eeaaf4f4e8c12814707a0ad9b474739f3de27d2bf1a251b42a5d5f8a3c2e1e9b','[\"*\"]','2026-09-23 17:16:50',NULL,'2026-09-23 17:16:45','2026-09-23 17:16:50'),(43,'App\\Models\\User',3,'vibe-web','82882de51c6f367cd49b2515c7893b0eb6e24c9a2f31dae2c0ec106cca7ad192','[\"*\"]','2026-09-25 14:15:27',NULL,'2026-09-25 12:41:52','2026-09-25 14:15:27'),(44,'App\\Models\\User',3,'vibe-web','80f62ce44ed46888a259a0b609acc0bb9114e65a0fc96f6cb189b41f5784faea','[\"*\"]','2026-09-25 14:05:02',NULL,'2026-09-25 14:05:01','2026-09-25 14:05:02'),(45,'App\\Models\\User',3,'vibe-web','be28b484f3e9bc2ac73296f398a48dbbd011693a5a166c930cf037a4a4203bf2','[\"*\"]','2026-09-27 16:36:53',NULL,'2026-09-27 15:41:50','2026-09-27 16:36:53'),(46,'App\\Models\\User',3,'vibe-web','0839478665bf0bca34530b77509ce3a1636323a253b341f93b3b213924a2ae7d','[\"*\"]','2026-09-27 16:38:45',NULL,'2026-09-27 16:02:18','2026-09-27 16:38:45'),(47,'App\\Models\\User',3,'vibe-web','94bf6f6769b738be955695bb57ff449352575ef161586ea5807782df2a25ba57','[\"*\"]','2026-09-27 16:48:31',NULL,'2026-09-27 16:37:08','2026-09-27 16:48:31'),(48,'App\\Models\\User',9,'vibe-web','68392e3b22070f33fac55c2190e4b80d1ce7ae727d3a592bb38e60800373fb86','[\"*\"]','2026-09-27 16:46:37',NULL,'2026-09-27 16:40:36','2026-09-27 16:46:37'),(49,'App\\Models\\User',3,'vibe-web','f6cb2994adfbbcc2c86db26a6f1da11672addc6233e77c80e2c0db7de99ac831','[\"*\"]','2026-09-27 17:06:42',NULL,'2026-09-27 17:06:42','2026-09-27 17:06:42');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playlist_video`
--

DROP TABLE IF EXISTS `playlist_video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlist_video` (
  `playlist_id` bigint unsigned NOT NULL,
  `video_id` bigint unsigned NOT NULL,
  `position` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`playlist_id`,`video_id`),
  KEY `playlist_video_video_id_foreign` (`video_id`),
  CONSTRAINT `playlist_video_playlist_id_foreign` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `playlist_video_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playlist_video`
--

LOCK TABLES `playlist_video` WRITE;
/*!40000 ALTER TABLE `playlist_video` DISABLE KEYS */;
/*!40000 ALTER TABLE `playlist_video` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playlists`
--

DROP TABLE IF EXISTS `playlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `playlists` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `playlists_user_id_name_unique` (`user_id`,`name`),
  CONSTRAINT `playlists_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `playlists`
--

LOCK TABLES `playlists` WRITE;
/*!40000 ALTER TABLE `playlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `playlists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `show_liked_videos` tinyint(1) NOT NULL DEFAULT '0',
  `allow_following` tinyint(1) NOT NULL DEFAULT '1',
  `allow_comments` tinyint(1) NOT NULL DEFAULT '1',
  `interests` json DEFAULT NULL,
  `onboarding_completed` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Usuario Teste','usuario_teste','teste@vibe.local',NULL,NULL,NULL,0,0,1,1,NULL,0,NULL,'$2y$12$sB/9VJgZ4UFfbCEf8uKhWOgZdLH4tHt8FB1qH2VOILSbWC1Y8QcAW',NULL,'2026-08-04 02:51:05','2026-08-04 02:51:05'),(2,'HENDRIK DE SOUZA DAMACENO','HSprogramador','hendriksouza@gmail.com',NULL,NULL,NULL,0,0,1,1,'[\"investimentos\", \"dividendos\", \"renda fixa\", \"empreendedorismo\", \"tecnologia\", \"esportes\", \"entretenimento\", \"educa├º├úo\", \"futebol\", \"basquete\"]',1,NULL,'$2y$12$kBmbGzdZ6V21EOCxn6KJrO1Q9Ues6TYR8CB/KKChBvvIRf8TBHHnq',NULL,'2026-09-16 02:28:22','2026-09-23 17:16:21'),(3,'Hendrik. Souza','hendrik_souza','hendriksouza97@gmail.com',NULL,'https://res.cloudinary.com/pnif69gu/image/upload/v1789831925/vibe-shorts/profiles/php4406_niugnx.jpg','https://res.cloudinary.com/pnif69gu/image/upload/v1789567492/vibe-shorts/profiles/phpECAF_osooyw.jpg',0,0,1,1,'[\"futebol\", \"esportes radicais\", \"muscula├º├úo e fitness\", \"lutas e artes marciais\", \"corrida de rua\"]',1,NULL,'$2y$12$.2s7kBGX4EPC/h.VMIjz3.ENI3b0eA23HL6tKjvMACe9wyfxC7ep2',NULL,'2026-09-16 11:15:55','2026-09-19 15:32:13'),(4,'Teste Vibe','teste1790170086','teste1790170086@example.com',NULL,NULL,NULL,0,0,1,1,NULL,0,NULL,'$2y$12$/u50Kvl5dX9doM7YLqNdAeSWdlsAMlyNnhj.VaWg7oun9xQ2bhyUy',NULL,'2026-09-23 13:28:08','2026-09-23 13:28:08'),(5,'HENDRIK DE SOUZA DAMACENO','HStester','hendrikdamaceno@gmail.com',NULL,NULL,NULL,0,0,1,1,'[\"investimentos\", \"futebol\", \"m├║sica\", \"humor e memes\", \"ci├¬ncia e curiosidades\", \"viagens e turismo\", \"fotografia e v├¡deo\", \"colecion├íveis e geek\", \"desenvolvimento pessoal\", \"intelig├¬ncia artificial\"]',1,NULL,'$2y$12$s5Ob.Gxhia0qvzehkOVUlO2yoowAbIc6EmcMdka6oBehdm9vGg9em',NULL,'2026-09-23 13:30:20','2026-09-23 13:31:02'),(6,'QA Vibe','qa1790171837','qa1790171837@example.com',NULL,NULL,NULL,0,0,1,1,NULL,0,NULL,'$2y$12$QbjiiIuYcfQtpbGK6XnAEOeYg6d6.GDpdd.iMWmu.C9SwebTiw8Oi',NULL,'2026-09-23 13:57:18','2026-09-23 13:57:18'),(7,'QA Vibe','qa1790172057','qa1790172057@example.com',NULL,NULL,NULL,0,0,1,1,NULL,0,NULL,'$2y$12$L71i.qlfHXGmQt5x6k7y/.fwWY82/rh8p748odFys0uLA7NhRRiJe',NULL,'2026-09-23 14:00:58','2026-09-23 14:00:58'),(8,'QA Vibe','qa1790172097','qa1790172097@example.com',NULL,NULL,NULL,0,0,1,1,NULL,0,NULL,'$2y$12$wVIIe5MJR88qdaIjm3iqzehNjnvuxnNAF3bD0IxCtSSq4FYmtHiVS',NULL,'2026-09-23 14:01:37','2026-09-23 14:01:37'),(9,'Ricardo','Ricardo','ricardopinturas1989@gmail.com',NULL,NULL,NULL,0,0,1,1,'[]',1,NULL,'$2y$12$sf3ekXqt6GFUPELHr0Z1besB5MxK55wd.MU9rB3uh24BU0EdJyE46',NULL,'2026-09-27 16:40:27','2026-09-27 16:41:26');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_likes`
--

DROP TABLE IF EXISTS `video_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `video_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `video_likes_video_id_user_id_unique` (`video_id`,`user_id`),
  KEY `video_likes_user_id_foreign` (`user_id`),
  CONSTRAINT `video_likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `video_likes_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_likes`
--

LOCK TABLES `video_likes` WRITE;
/*!40000 ALTER TABLE `video_likes` DISABLE KEYS */;
INSERT INTO `video_likes` VALUES (2,2,2,'2026-09-16 02:35:11','2026-09-16 02:35:11'),(3,3,3,'2026-09-17 01:24:10','2026-09-17 01:24:10'),(4,5,3,'2026-09-19 15:36:17','2026-09-19 15:36:17');
/*!40000 ALTER TABLE `video_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_reports`
--

DROP TABLE IF EXISTS `video_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_reports` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `video_id` bigint unsigned NOT NULL,
  `reason` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `video_reports_user_id_video_id_unique` (`user_id`,`video_id`),
  KEY `video_reports_video_id_foreign` (`video_id`),
  CONSTRAINT `video_reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `video_reports_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_reports`
--

LOCK TABLES `video_reports` WRITE;
/*!40000 ALTER TABLE `video_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `video_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `video_views`
--

DROP TABLE IF EXISTS `video_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video_views` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `video_id` bigint unsigned NOT NULL,
  `watched_seconds` int unsigned NOT NULL DEFAULT '0',
  `viewed_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `video_views_user_id_viewed_at_index` (`user_id`,`viewed_at`),
  KEY `video_views_video_id_viewed_at_index` (`video_id`,`viewed_at`),
  CONSTRAINT `video_views_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `video_views_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `video_views`
--

LOCK TABLES `video_views` WRITE;
/*!40000 ALTER TABLE `video_views` DISABLE KEYS */;
INSERT INTO `video_views` VALUES (1,3,3,0,'2026-09-27 16:02:28'),(2,3,2,0,'2026-09-27 16:03:58'),(3,3,5,0,'2026-09-27 16:04:02'),(4,3,4,0,'2026-09-27 16:04:04');
/*!40000 ALTER TABLE `video_views` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `videos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `description` varchar(2200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cloudinary_public_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_seconds` smallint unsigned DEFAULT NULL,
  `visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `pinned_at` timestamp NULL DEFAULT NULL,
  `allow_comments` tinyint(1) NOT NULL DEFAULT '1',
  `allow_reuse` tinyint(1) NOT NULL DEFAULT '1',
  `is_ai_generated` tinyint(1) NOT NULL DEFAULT '0',
  `age_restricted` tinyint(1) NOT NULL DEFAULT '0',
  `high_quality` tinyint(1) NOT NULL DEFAULT '1',
  `view_count` bigint unsigned NOT NULL DEFAULT '0',
  `shares_count` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `videos_cloudinary_public_id_unique` (`cloudinary_public_id`),
  KEY `videos_user_id_visibility_index` (`user_id`,`visibility`),
  KEY `videos_created_at_index` (`created_at`),
  CONSTRAINT `videos_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `videos`
--

LOCK TABLES `videos` WRITE;
/*!40000 ALTER TABLE `videos` DISABLE KEYS */;
INSERT INTO `videos` VALUES (1,1,'Meu primeiro v├¡deo no Vibe',NULL,'https://example.com/demo-video.mp4',NULL,NULL,15,'public',NULL,NULL,1,1,0,0,1,0,0,'2026-08-04 03:09:10','2026-08-04 03:09:10'),(2,1,'Meu primeiro v├¡deo enviado para o Vibe',NULL,'https://res.cloudinary.com/pnif69gu/video/upload/v1785816129/vibe-shorts/videos/phpF6DE_l4hwgk.mp4',NULL,'vibe-shorts/videos/phpF6DE_l4hwgk',39,'public',NULL,NULL,1,1,0,0,1,21,1,'2026-08-04 04:02:52','2026-09-27 16:03:58'),(3,3,'videos de teste',NULL,'https://res.cloudinary.com/pnif69gu/video/upload/v1789587745/vibe-shorts/videos/phpE5CD_rzzduu.mp4',NULL,'vibe-shorts/videos/phpE5CD_rzzduu',2,'public',NULL,NULL,1,1,0,0,1,16,0,'2026-09-16 19:42:30','2026-09-27 16:02:44'),(4,3,'estamos no caminho #drone #brasilia #filmagem',NULL,'https://res.cloudinary.com/pnif69gu/video/upload/v1789734497/vibe-shorts/videos/php26EC_zbwqru.webm','https://res.cloudinary.com/pnif69gu/image/upload/v1789734499/vibe-shorts/thumbnails/php26ED_abksru.jpg','vibe-shorts/videos/php26EC_zbwqru',32,'public',NULL,NULL,1,1,0,0,1,3,0,'2026-09-18 12:28:25','2026-09-27 16:04:03'),(5,3,'#drone filmagens aereas',NULL,'https://res.cloudinary.com/pnif69gu/video/upload/v1789734977/vibe-shorts/videos/php8A4A_s2rbrd.webm','https://res.cloudinary.com/pnif69gu/image/upload/v1789734981/vibe-shorts/thumbnails/php8A4B_hexp0v.jpg','vibe-shorts/videos/php8A4A_s2rbrd',9,'public',NULL,NULL,1,1,0,0,1,2,0,'2026-09-18 12:36:27','2026-09-27 16:04:02');
/*!40000 ALTER TABLE `videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-27 17:22:08
