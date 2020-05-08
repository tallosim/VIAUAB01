<?php
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'gtfs');

function opendb() {
    $link = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

    mysqli_query($link, "set character_set_results='utf-8'");

    if($link === false){
        die("ERROR: Could not connect. " . mysqli_connect_error());
    }

    return $link;
}
?>