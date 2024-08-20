-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 20-08-2024 a las 16:34:41
-- Versión del servidor: 8.0.30
-- Versión de PHP: 7.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `fedemet_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ci` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ci_exp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nit` varchar(155) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dir` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `ci`, `ci_exp`, `nit`, `fono`, `correo`, `dir`, `fecha_registro`) VALUES
(1, 'PEDRO MARTINEZ', '231231', 'LP', '', '', NULL, '', '2023-04-26'),
(2, 'MARIA GONZALES CASAS', '1231231', 'CB', '34324111', '666666; 7777777', 'MARIA@GMAIL.COM', 'LOS OLIVOS', '2023-04-26'),
(3, 'PABLO SANCHEZ', '43434', 'CB', '111111', '', '', '', '2023-04-26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracions`
--

CREATE TABLE `configuracions` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre_sistema` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razon_social` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ciudad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dir` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `web` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actividad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `configuracions`
--

INSERT INTO `configuracions` (`id`, `nombre_sistema`, `alias`, `razon_social`, `nit`, `ciudad`, `dir`, `fono`, `web`, `actividad`, `correo`, `logo`) VALUES
(1, 'SISTEMA WEB DE PRONÓSTICO DE VENTAS CON ENFOQUE EN ALGORITMOS DE  MACHINE LEARNING', 'FEDEMET', 'FEDEMET S.A.', '10000000000', 'LA PAZ', 'LA PAZ', '222222', '', 'ACTIVIDAD', 'FEDEMET@GMAIL.COM', 'Logo1723652441995.jpg');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_ventas`
--

CREATE TABLE `detalle_ventas` (
  `id` bigint UNSIGNED NOT NULL,
  `venta_id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `cantidad` double NOT NULL,
  `precio` decimal(24,2) NOT NULL,
  `subtotal` decimal(24,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `detalle_ventas`
--

INSERT INTO `detalle_ventas` (`id`, `venta_id`, `producto_id`, `cantidad`, `precio`, `subtotal`) VALUES
(5, 3, 1, 10, 20.00, 200.00),
(6, 5, 1, 1, 20.00, 20.00),
(8, 6, 1, 3, 20.00, 60.00),
(9, 7, 7, 4, 12.00, 48.00),
(10, 7, 2, 1, 35.00, 35.00),
(11, 8, 3, 1, 100.00, 100.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `fecha_stocks`
--

CREATE TABLE `fecha_stocks` (
  `id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `fecha` date NOT NULL,
  `stock` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `fecha_stocks`
--

INSERT INTO `fecha_stocks` (`id`, `producto_id`, `fecha`, `stock`) VALUES
(1, 1, '2023-04-27', 93),
(2, 7, '2023-04-28', 86),
(3, 2, '2023-04-28', 99),
(4, 3, '2023-04-28', 69),
(6, 3, '2024-03-14', 169);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_accions`
--

CREATE TABLE `historial_accions` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `accion` varchar(155) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `datos_original` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `datos_nuevo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `modulo` varchar(155) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `historial_accions`
--

INSERT INTO `historial_accions` (`id`, `user_id`, `accion`, `descripcion`, `datos_original`, `datos_nuevo`, `modulo`, `fecha`, `hora`) VALUES
(1, 1, 'CREACIÓN', 'EL USUARIO admin CREO UN NUEVO PROVEEDOR', '{\"razon_social\":\"PROVEEDOR #4\",\"nit\":\"33333\",\"dir\":\"\",\"fono\":\"6666677\",\"nombre_contacto\":\"\",\"descripcion\":\"\",\"fecha_registro\":\"2024-08-20\"}', NULL, 'PROVEEDORES', '2024-08-20', '12:18:57'),
(2, 1, 'MODIFICACIÓN', 'EL USUARIO admin MODIFICO UN USAURIO', '{\"id\":4,\"usuario\":\"MQUISPE\",\"nombre\":\"MARIA\",\"paterno\":\"QUISPE\",\"materno\":\"QUISPE\",\"ci\":\"3333\",\"ci_exp\":\"CB\",\"dir\":\"ZONA LOS OLIVOS\",\"correo\":\"\",\"fono\":\"67676767\",\"tipo\":\"VENDEDOR\",\"foto\":\"user_default.png\",\"password\":\"$2a$10$ihA3LU.qKPDk6VQ/uI8AHODpBETgW/8BfU.Y5wf1GlWku.SwQ7Ht.\",\"acceso\":1,\"estado\":1,\"fecha_registro\":\"2024-08-20T04:00:00.000Z\"}', '{\"nombre\":\"MARIA\",\"paterno\":\"QUISPE\",\"materno\":\"QUISPE\",\"ci\":\"3333\",\"ci_exp\":\"CB\",\"dir\":\"ZONA LOS OLIVOS\",\"correo\":\"\",\"fono\":\"67676767\",\"fecha_registro\":\"2024-08-20\",\"tipo\":\"VENDEDOR\",\"foto\":\"user_default.png\",\"acceso\":1}', 'USAURIOS', '2024-08-20', '12:23:21'),
(3, 1, 'ELIMINACIÓN', 'EL USUARIO admin ELIMINO UN USUARIO', 'null', NULL, 'USUARIOS', '2024-08-20', '12:23:34'),
(4, 1, 'ELIMINACIÓN', 'EL USUARIO admin ELIMINO UN USUARIO', '{\"id\":4,\"usuario\":\"MQUISPE\",\"nombre\":\"MARIA\",\"paterno\":\"QUISPE\",\"materno\":\"QUISPE\",\"ci\":\"3333\",\"ci_exp\":\"CB\",\"dir\":\"ZONA LOS OLIVOS\",\"correo\":\"\",\"fono\":\"67676767\",\"tipo\":\"VENDEDOR\",\"foto\":\"user_default.png\",\"password\":\"$2a$10$ihA3LU.qKPDk6VQ/uI8AHODpBETgW/8BfU.Y5wf1GlWku.SwQ7Ht.\",\"acceso\":1,\"estado\":1,\"fecha_registro\":\"2024-08-20T04:00:00.000Z\"}', NULL, 'USUARIOS', '2024-08-20', '12:24:40'),
(5, 1, 'MODIFICACIÓN', 'EL USUARIO admin MODIFICO UNA MARCA', '{\"id\":1,\"nombre\":\"CATEGORÍA 1\",\"descripcion\":null,\"estado\":1}', '{\"nombre\":\"MARCA 1\",\"descripcion\":\"\"}', 'MARCAS', '2024-08-20', '12:34:01'),
(6, 1, 'MODIFICACIÓN', 'EL USUARIO admin MODIFICO UNA MARCA', '{\"id\":3,\"nombre\":\"CATEGORIA 2\",\"descripcion\":null,\"estado\":1}', '{\"nombre\":\"MARCA 2\",\"descripcion\":\"\"}', 'MARCAS', '2024-08-20', '12:34:10'),
(7, 1, 'CREACIÓN', 'EL USUARIO admin CREO UN NUEVO MARCA', '{\"nombre\":\"MARCA 3\",\"descripcion\":\"DESC MARCA 3\"}', NULL, 'MARCAS', '2024-08-20', '12:34:16'),
(8, 1, 'ELIMINACIÓN', 'EL USUARIO admin ELIMINO UNA MARCA', '{\"id\":4,\"nombre\":\"MARCA 3\",\"descripcion\":\"DESC MARCA 3\",\"estado\":1}', NULL, 'MARCAS', '2024-08-20', '12:34:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ingreso_productos`
--

CREATE TABLE `ingreso_productos` (
  `id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `proveedor_id` bigint UNSIGNED NOT NULL,
  `precio_compra` decimal(8,2) NOT NULL,
  `cantidad` double NOT NULL,
  `lote` varchar(155) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_fabricacion` date NOT NULL,
  `fecha_caducidad` date NOT NULL,
  `tipo_ingreso_id` bigint UNSIGNED NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ingreso_productos`
--

INSERT INTO `ingreso_productos` (`id`, `producto_id`, `proveedor_id`, `precio_compra`, `cantidad`, `lote`, `fecha_fabricacion`, `fecha_caducidad`, `tipo_ingreso_id`, `descripcion`, `fecha_registro`) VALUES
(1, 1, 1, 20.00, 100, '1', '2023-02-02', '2025-02-02', 1, '', '2023-04-25'),
(2, 2, 1, 30.00, 100, '2', '2023-04-25', '2024-04-25', 2, '', '2023-04-25'),
(3, 3, 1, 100.00, 70, '3', '2023-03-03', '2026-03-03', 1, '', '2023-04-25'),
(4, 1, 1, 20.00, 10, '10', '2023-04-27', '2025-04-27', 1, '', '2023-04-27'),
(5, 7, 2, 11.00, 90, '322323', '2023-01-01', '2025-01-01', 1, '', '2023-04-28'),
(7, 3, 1, 30.00, 100, '2022111', '2024-03-03', '2025-02-21', 1, '', '2024-03-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `kardex_productos`
--

CREATE TABLE `kardex_productos` (
  `id` bigint UNSIGNED NOT NULL,
  `lugar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_registro` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_id` bigint UNSIGNED DEFAULT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `detalle` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` decimal(24,2) NOT NULL,
  `tipo_is` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad_ingreso` double DEFAULT NULL,
  `cantidad_salida` double DEFAULT NULL,
  `cantidad_saldo` double NOT NULL,
  `cu` decimal(24,2) NOT NULL,
  `monto_ingreso` decimal(24,2) DEFAULT NULL,
  `monto_salida` decimal(24,2) DEFAULT NULL,
  `monto_saldo` decimal(24,2) NOT NULL,
  `fecha` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `kardex_productos`
--

INSERT INTO `kardex_productos` (`id`, `lugar`, `tipo_registro`, `registro_id`, `producto_id`, `detalle`, `precio`, `tipo_is`, `cantidad_ingreso`, `cantidad_salida`, `cantidad_saldo`, `cu`, `monto_ingreso`, `monto_salida`, `monto_saldo`, `fecha`) VALUES
(1, NULL, 'INGRESO', 1, 1, 'VALOR INICIAL', 20.00, 'INGRESO', 100, NULL, 100, 20.00, 2000.00, NULL, 2000.00, '2023-04-25'),
(2, NULL, 'INGRESO', 2, 2, 'VALOR INICIAL', 35.00, 'INGRESO', 100, NULL, 100, 35.00, 3500.00, NULL, 3500.00, '2023-04-25'),
(3, NULL, 'INGRESO', 3, 3, 'VALOR INICIAL', 100.00, 'INGRESO', 70, NULL, 70, 100.00, 7000.00, NULL, 7000.00, '2023-04-25'),
(6, NULL, 'SALIDA', 3, 1, 'SALIDA DE PRODUCTO', 20.00, 'EGRESO', NULL, 3, 97, 20.00, NULL, 60.00, 1940.00, '2023-04-25'),
(11, NULL, 'VENTA', 5, 1, 'VENTA DE PRODUCTO', 20.00, 'EGRESO', NULL, 10, 87, 20.00, NULL, 200.00, 1740.00, '2023-04-26'),
(12, NULL, 'INGRESO', 4, 1, 'INGRESO DE PRODUCTO', 20.00, 'INGRESO', 10, NULL, 97, 20.00, 200.00, NULL, 1940.00, '2023-04-27'),
(13, NULL, 'VENTA', 6, 1, 'VENTA DE PRODUCTO', 20.00, 'EGRESO', NULL, 1, 96, 20.00, NULL, 20.00, 1920.00, '2023-04-27'),
(15, NULL, 'VENTA', 8, 1, 'VENTA DE PRODUCTO', 20.00, 'EGRESO', NULL, 3, 93, 20.00, NULL, 60.00, 1860.00, '2023-04-27'),
(16, NULL, 'INGRESO', 5, 7, 'VALOR INICIAL', 12.00, 'INGRESO', 90, NULL, 90, 12.00, 1080.00, NULL, 1080.00, '2023-04-28'),
(17, NULL, 'VENTA', 9, 7, 'VENTA DE PRODUCTO', 12.00, 'EGRESO', NULL, 4, 86, 12.00, NULL, 48.00, 1032.00, '2023-04-28'),
(18, NULL, 'VENTA', 10, 2, 'VENTA DE PRODUCTO', 35.00, 'EGRESO', NULL, 1, 99, 35.00, NULL, 35.00, 3465.00, '2023-04-28'),
(19, NULL, 'VENTA', 11, 3, 'VENTA DE PRODUCTO', 100.00, 'EGRESO', NULL, 1, 69, 100.00, NULL, 100.00, 6900.00, '2023-04-28'),
(21, NULL, 'INGRESO', 7, 3, 'INGRESO DE PRODUCTO', 100.00, 'INGRESO', 100, NULL, 169, 100.00, 10000.00, NULL, 16900.00, '2024-03-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marcas`
--

CREATE TABLE `marcas` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(600) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `marcas`
--

INSERT INTO `marcas` (`id`, `nombre`, `descripcion`, `estado`) VALUES
(1, 'MARCA 1', '', 1),
(3, 'MARCA 2', '', 1),
(4, 'MARCA 3', 'DESC MARCA 3', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` bigint UNSIGNED NOT NULL,
  `codigo_almacen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo_producto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `precio` decimal(24,2) NOT NULL,
  `stock_min` double NOT NULL,
  `stock_actual` double NOT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria_id` bigint UNSIGNED NOT NULL,
  `fecha_registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `codigo_almacen`, `codigo_producto`, `nombre`, `descripcion`, `precio`, `stock_min`, `stock_actual`, `imagen`, `categoria_id`, `fecha_registro`) VALUES
(1, 'A001', 'P001', 'PASTILLAS A', '', 20.00, 10, 93, '', 3, '2023-04-24'),
(2, 'A001', 'P002', 'GEL ANTIBACTERIAL', '', 35.00, 5, 99, NULL, 1, '2023-04-24'),
(3, 'A001', 'P003', 'PRODUCTO 3', '', 100.00, 10, 169, NULL, 1, '2023-04-24'),
(7, 'A00111', 'P004', 'PRODUCTO 4', '', 12.00, 12, 86, '1682696496_7.jpg', 1, '2023-04-24'),
(10, 'A002222', 'P0044', 'PRODUCTO NUEVO P0044', 'DESC', 99.00, 10, 0, '', 3, '2023-05-19'),
(11, 'A003', 'P006', 'PRODUCTO #6', '', 300.00, 10, 0, '', 1, '2024-03-14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedors`
--

CREATE TABLE `proveedors` (
  `id` bigint UNSIGNED NOT NULL,
  `razon_social` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dir` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_contacto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_registro` date NOT NULL,
  `estado` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `proveedors`
--

INSERT INTO `proveedors` (`id`, `razon_social`, `nit`, `dir`, `fono`, `nombre_contacto`, `descripcion`, `fecha_registro`, `estado`) VALUES
(1, 'PEPE S.A.', '3333', '', '777777', 'JOSE PAREDES', '', '2023-04-24', 1),
(2, 'PROVEEDOR SRL', '34343', '', '2222', '', '', '2023-04-28', 1),
(4, 'PROVEEDOR #3', '6767676767', 'ZONA LOS PEDREGALES', '77657677', 'JUAN PERES', '77657677', '2024-08-20', 1),
(5, 'PROVEEDOR #4', '33333', '', '6666677', '', '', '2024-08-20', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `salida_productos`
--

CREATE TABLE `salida_productos` (
  `id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `cantidad` int NOT NULL,
  `fecha_salida` date NOT NULL,
  `tipo_salida_id` bigint UNSIGNED NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `salida_productos`
--

INSERT INTO `salida_productos` (`id`, `producto_id`, `cantidad`, `fecha_salida`, `tipo_salida_id`, `descripcion`, `fecha_registro`) VALUES
(3, 1, 3, '2023-04-25', 1, '', '2023-04-25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('_SetfqH_qWBG1HmWNAcXPPgArnCSlxP5', 1724258075, '{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"passport\":{\"user\":1}}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_ingresos`
--

CREATE TABLE `tipo_ingresos` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tipo_ingresos`
--

INSERT INTO `tipo_ingresos` (`id`, `nombre`, `descripcion`) VALUES
(1, 'INGRESO TIPO 1', ''),
(2, 'TIPO INGRESO 2', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_salidas`
--

CREATE TABLE `tipo_salidas` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tipo_salidas`
--

INSERT INTO `tipo_salidas` (`id`, `nombre`, `descripcion`) VALUES
(1, 'SALIDA 1', ''),
(2, 'TIPO DE SALIDA 2', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `usuario` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `paterno` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `materno` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ci` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ci_exp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dir` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('ADMINISTRADOR','GERENCIA','SUPERVISOR','VENDEDOR') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `acceso` int NOT NULL,
  `estado` int NOT NULL DEFAULT '1',
  `fecha_registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `usuario`, `nombre`, `paterno`, `materno`, `ci`, `ci_exp`, `dir`, `correo`, `fono`, `tipo`, `foto`, `password`, `acceso`, `estado`, `fecha_registro`) VALUES
(1, 'admin', 'admin', 'admin', NULL, '', '', '', NULL, '', 'ADMINISTRADOR', NULL, '$2y$10$KYjM1KaTVguDQqAW5JO40u0CnJ2BlSxAlDFaYdvEmFceIBNu1StP6', 1, 1, '2023-01-11'),
(2, 'JPERES', 'JUAN', 'PERES', 'MAMANI', '1234', 'LP', 'LOS OLIVOS', '', '777777', 'SUPERVISOR', 'user_default.png', '$2a$10$0Kr.30pCwyDD2Ee8aA5xD.XP.M0LwmyBbB/rkFMiWRtSJgxf8NyB2', 1, 1, '2023-04-24'),
(3, 'ECONDORI', 'EDUARDO', 'CONDORI', 'MAMANI', '2222', 'LP', 'ZONA LOS PEDREGALES', 'eduardo@gmail.com', '77777777', 'SUPERVISOR', 'eduardo1723843153882.jpg', '$2a$10$NhuMflCFsQvhJ.gx1Nrfw.4wEyFplYs1c1HF1Rh2j2IASDmfUfati', 1, 1, '2024-08-16'),
(4, 'MQUISPE', 'MARIA', 'QUISPE', 'QUISPE', '3333', 'CB', 'ZONA LOS OLIVOS', '', '67676767', 'VENDEDOR', 'user_default.png', '$2a$10$ihA3LU.qKPDk6VQ/uI8AHODpBETgW/8BfU.Y5wf1GlWku.SwQ7Ht.', 1, 1, '2024-08-20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `cliente_id` bigint UNSIGNED NOT NULL,
  `nit` varchar(155) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` decimal(24,2) NOT NULL,
  `descuento` double(8,2) NOT NULL,
  `total_final` decimal(24,2) NOT NULL,
  `estado` varchar(155) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id`, `user_id`, `cliente_id`, `nit`, `total`, `descuento`, `total_final`, `estado`, `fecha_registro`) VALUES
(3, 1, 1, '231231', 200.00, 0.00, 80.00, 'CANCELADO', '2023-04-26'),
(5, 1, 1, '231231', 20.00, 0.00, 20.00, 'CANCELADO', '2023-04-27'),
(6, 1, 3, '43434', 60.00, 0.00, 120.00, 'CANCELADO', '2023-04-27'),
(7, 1, 2, '1231231', 83.00, 0.00, 83.00, 'CANCELADO', '2023-04-28'),
(8, 2, 2, '1231231', 100.00, 0.00, 100.00, 'CANCELADO', '2023-04-28');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `configuracions`
--
ALTER TABLE `configuracions`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `detalle_ordens_orden_id_foreign` (`venta_id`),
  ADD KEY `detalle_ordens_producto_id_foreign` (`producto_id`);

--
-- Indices de la tabla `fecha_stocks`
--
ALTER TABLE `fecha_stocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fecha_stocks_producto_id_foreign` (`producto_id`);

--
-- Indices de la tabla `historial_accions`
--
ALTER TABLE `historial_accions`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ingreso_productos`
--
ALTER TABLE `ingreso_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ingreso_productos_producto_id_foreign` (`producto_id`),
  ADD KEY `ingreso_productos_proveedor_id_foreign` (`proveedor_id`),
  ADD KEY `ingreso_productos_tipo_ingreso_id_foreign` (`tipo_ingreso_id`);

--
-- Indices de la tabla `kardex_productos`
--
ALTER TABLE `kardex_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kardex_productos_producto_id_foreign` (`producto_id`);

--
-- Indices de la tabla `marcas`
--
ALTER TABLE `marcas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `proveedors`
--
ALTER TABLE `proveedors`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `salida_productos`
--
ALTER TABLE `salida_productos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `salida_productos_producto_id_foreign` (`producto_id`),
  ADD KEY `salida_productos_tipo_salida_id_foreign` (`tipo_salida_id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indices de la tabla `tipo_ingresos`
--
ALTER TABLE `tipo_ingresos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tipo_salidas`
--
ALTER TABLE `tipo_salidas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_usuario_unique` (`usuario`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orden_ventas_cliente_id_foreign` (`cliente_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `configuracions`
--
ALTER TABLE `configuracions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `fecha_stocks`
--
ALTER TABLE `fecha_stocks`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `historial_accions`
--
ALTER TABLE `historial_accions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `ingreso_productos`
--
ALTER TABLE `ingreso_productos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `kardex_productos`
--
ALTER TABLE `kardex_productos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `marcas`
--
ALTER TABLE `marcas`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `proveedors`
--
ALTER TABLE `proveedors`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `salida_productos`
--
ALTER TABLE `salida_productos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tipo_ingresos`
--
ALTER TABLE `tipo_ingresos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tipo_salidas`
--
ALTER TABLE `tipo_salidas`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `fecha_stocks`
--
ALTER TABLE `fecha_stocks`
  ADD CONSTRAINT `fecha_stocks_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
