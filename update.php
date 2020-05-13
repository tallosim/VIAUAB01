<?php
require_once "config.php";

if(!GetStatus()) {
    SetStaus(true);

    set_time_limit(6000);
    DownloadGtfs();
    UnzipGtfs();
    MakeMySQLDB();
    
    SetStaus(false);
}
else {
    echo "ERROR";
}


function MakeMySQLDB()
{
    $mysql_host = "localhost";
    $mysql_database = "gtfs";
    $mysql_user = "root";
    $mysql_password = "";
    # MySQL with PDO_MYSQL  
    $db = new PDO("mysql:host=$mysql_host;dbname=$mysql_database", $mysql_user, $mysql_password, array(PDO::MYSQL_ATTR_LOCAL_INFILE => true));
    $query = file_get_contents("gtfs.sql");
    $stmt = $db->prepare($query);
    if ($stmt->execute())
        echo "MySQL database built.\n";
    else
        echo "MySQL database bulding failed.\n";
}

function DownloadGtfs() {
    $url = "https://www.bkk.hu/gtfs/budapest_gtfs.zip";

    if (file_put_contents("budapest_gtfs.zip", file_get_contents($url))) {
        echo "File downloaded successfully.\n";
    } else {
        echo "File downloading failed.\n";
    }
}

function UnzipGtfs()
{
    $zip = new ZipArchive;
    $res = $zip->open("budapest_gtfs.zip");
    if ($res === TRUE) {
        $path = "C:/xampp/mysql/budapest_gtfs/";

        $zip->extractTo($path);
        $zip->close();

        echo "File unziped.\n";
    } else {
        echo "File unziping failed.\n";
    }
}
?>