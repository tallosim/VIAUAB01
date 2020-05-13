DROP DATABASE IF EXISTS gtfs;
CREATE DATABASE gtfs
	DEFAULT CHARACTER SET utf8
	DEFAULT COLLATE utf8_general_ci;
USE gtfs;

DROP TABLE IF EXISTS shapes;
-- shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence
CREATE TABLE `shapes` (
	shape_id VARCHAR(4) NOT NULL,
	shape_pt_sequence VARCHAR(8)  NOT NULL,
    shape_pt_lat DECIMAL(8,6),
	shape_pt_lon DECIMAL(8,6),
    shape_dist_traveled DECIMAL(6,1),
    CONSTRAINT shape_id_pt_sequence PRIMARY KEY (shape_id, shape_pt_sequence)
);

DROP TABLE IF EXISTS calendar_dates;
-- service_id,date,exception_type
CREATE TABLE `calendar_dates` (
    service_id VARCHAR(20),
    service_date DATE,
    exception_type INT(2),
	CONSTRAINT service_id_date PRIMARY KEY (service_id, service_date)
);

DROP TABLE IF EXISTS routes;
-- agency_id,route_id,route_short_name,route_long_name,route_type,route_desc,route_color,route_text_color,route_sort_order
CREATE TABLE `routes` (
	agency_id VARCHAR(3),
	route_id VARCHAR(6) NOT NULL PRIMARY KEY,
	route_short_name VARCHAR(50),
	route_long_name VARCHAR(64),
	route_type INT(2),
	route_desc VARCHAR(64),
	route_color VARCHAR(20),
	route_text_color VARCHAR(20),
    route_sort_order INT(3),
	KEY `route_type` (route_type)
);

DROP TABLE IF EXISTS trips;
-- trip_id,service_id,route_id,trip_headsign,direction_id,block_id,shape_id,wheelchair_accessible,bikes_allowed,boarding_door
CREATE TABLE `trips` (
	route_id VARCHAR(6),
	trip_id VARCHAR(16) NOT NULL PRIMARY KEY,
	service_id VARCHAR(20),
	trip_headsign VARCHAR(64),
	direction_id TINYINT(1),
    block_id VARCHAR(24),
	shape_id VARCHAR(4),
    wheelchair_accessible INT(2),
    bikes_allowed INT(1),
    boarding_door INT(2),
	-- FOREIGN KEY (shape_id) REFERENCES shapes(shape_id),
    -- FOREIGN KEY (route_id) REFERENCES routes(route_id),
    -- FOREIGN KEY (service_id) REFERENCES calendar_dates(service_id),
	KEY `route_id` (route_id),
	KEY `service_id` (service_id),
	KEY `direction_id` (direction_id)
);


DROP TABLE IF EXISTS stops;
-- stop_id,stop_name,stop_lat,stop_lon,stop_code,location_type,parent_station,wheelchair_boarding,stop_direction
CREATE TABLE `stops` (
	stop_id VARCHAR(10) NOT NULL PRIMARY KEY,
	stop_name VARCHAR(64),
	stop_lat DECIMAL(8,6),
	stop_lon DECIMAL(8,6),
	stop_code VARCHAR(10),
	location_type INT(2),
	parent_station VARCHAR(10),
	wheelchair_boarding INT(2),
	stop_directions INT(4)
);


DROP TABLE IF EXISTS stop_times;
-- trip_id,stop_id,arrival_time,departure_time,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled
CREATE TABLE `stop_times` (
	trip_id VARCHAR(16),
	stop_id VARCHAR(10),
	arrival_time TIME,
	departure_time TIME,
	stop_sequence INT(3),
    stop_headsign VARCHAR(64),
	pickup_type INT(2),
	drop_off_type INT(2),
	shape_dist_traveled VARCHAR(8),
	-- FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
	-- FOREIGN KEY (stop_id) REFERENCES stops(stop_id),
	KEY `trip_id` (trip_id),
	KEY `stop_id` (stop_id),
	KEY `stop_sequence` (stop_sequence),
	KEY `pickup_type` (pickup_type),
	KEY `drop_off_type` (drop_off_type)
);


LOAD DATA INFILE 'C:/xampp/mysql/budapest_gtfs/shapes.txt' INTO TABLE shapes FIELDS TERMINATED BY ',' IGNORE 1 LINES;

LOAD DATA INFILE 'C:/xampp/mysql/budapest_gtfs/calendar_dates.txt' INTO TABLE calendar_dates FIELDS TERMINATED BY ',' IGNORE 1 LINES;

LOAD DATA INFILE 'C:/xampp/mysql/budapest_gtfs/routes.txt' INTO TABLE routes FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' IGNORE 1 LINES;

LOAD DATA INFILE 'C:/xampp/mysql/budapest_gtfs/stops.txt' INTO TABLE stops FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' IGNORE 1 LINES;

LOAD DATA INFILE 'C:/xampp/mysql/budapest_gtfs/trips.txt' INTO TABLE trips FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' IGNORE 1 LINES;

LOAD DATA INFILE 'C:/xampp/mysql/budapest_gtfs/stop_times.txt' INTO TABLE stop_times FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' IGNORE 1 LINES;