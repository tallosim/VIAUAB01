<?php
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'gtfs');

function SetStaus($status) {
    $text = "";
    if ($status) { $text = "true"; }
    else { $text = "false"; }
    file_put_contents('status.md', "update=" . $text);
}

function GetStatus() {
    $text = file_get_contents('status.md', false, null, 8);
    if ($text == "true") { return true; }
    else if ($text == "false") { return false; }
    else { return false; }
}

function opendb() {
    $link = mysqli_connect(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

    mysqli_query($link, "set character_set_results='utf-8'");

    if($link === false){
        die("ERROR: Could not connect. " . mysqli_connect_error());
    }

    return $link;
}
?>