<?php
require_once "config.php";

if (isset($_GET["fromPlace"]) && !empty($_GET["fromPlace"]) && isset($_GET["toPlace"]) && !empty($_GET["toPlace"]) && isset($_GET["date"]) && !empty($_GET["date"]) && isset($_GET["time"])) {
    $url_query = array("fromPlace" => "", "toPlace" => "", "date" => "", "time" => "");

    $url_query["fromPlace"] = trim($_GET["fromPlace"]);
    $url_query["toPlace"] = trim($_GET["toPlace"]);
    $url_query["date"] = trim($_GET["date"]);

    if (!empty($_GET["time"])) {
        $url_query["time"] = trim($_GET["time"]);
    }
    $link = opendb();
    MakeResponse($url_query, $link);
    mysqli_close($link);
    //echo json_encode(json_decode(file_get_contents("response.json"))->data->plan->from);
}

function GetBKKApi($url_query)
{
    $api_query = sprintf("https://futar.bkk.hu/api/query/v1/ws/otp/api/where/plan-trip.json?key=bkk-web&version=3&fromPlace=%s&toPlace=%s&date=%s&time=%s", $url_query["fromPlace"], $url_query["toPlace"], $url_query["date"], $url_query["time"]);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $api_query);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HEADER, FALSE);

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

function GooglePolylineDecode($string)
{
    /**
     * @category  Mapping
     * @package   Polyline
     * @author    E. McConville <emcconville@emcconville.com>
     * @copyright 2009-2015 E. McConville
     * @license   http://www.gnu.org/licenses/lgpl.html LGPL v3
     * @version   GIT: $Id$
     * @link      https://github.com/emcconville/google-map-polyline-encoding-tool
     */

    $points = array();
    $index = $i = 0;
    $previous = array(0, 0);
    while ($i < strlen($string)) {
        $shift = $result = 0x00;
        do {
            $bit = ord(substr($string, $i++)) - 63;
            $result |= ($bit & 0x1f) << $shift;
            $shift += 5;
        } while ($bit >= 0x20);

        $diff = ($result & 1) ? ~($result >> 1) : ($result >> 1);
        $number = $previous[$index % 2] + $diff;
        $previous[$index % 2] = $number;
        $index++;
        $points[] = $number * 1 / pow(10, 5);
    }
    return $points;
}

function MakeResponse($url_query, $link)
{
    $bkk_response = json_decode(GetBKKApi($url_query));

    if ($bkk_response->code == 200) {
        $plan = $bkk_response->data->entry->plan;

        $response = json_decode(file_get_contents("json/response.json"));

        $response->data->plan->from = $plan->from;
        $response->data->plan->to = $plan->to;

        foreach ($plan->itineraries as $element) {
            $itinerary = json_decode(file_get_contents("json/itinerary.json"));

            $itinerary->duration = $element->duration;
            $itinerary->startTime = $element->startTime;
            $itinerary->endTime = $element->endTime;
            $itinerary->transfers = $element->transfers;
            $itinerary->walkDistance = $element->walkDistance;

            foreach ($element->legs as $leg) {
                if ($leg->mode == "WALK") {
                    $walk = json_decode(file_get_contents("json/walk.json"));

                    $walk->startTime = $leg->startTime;
                    $walk->endTime = $leg->endTime;
                    $walk->duration = $leg->duration;
                    $walk->distance = $leg->distance;
                    $walk->from = $leg->from;
                    $walk->to = $leg->to;

                    $coordinates = GooglePolylineDecode($leg->legGeometry->points);
                    for ($i=0; $i < $leg->legGeometry->length; $i++) { 
                        array_push($walk->geometry, [$coordinates[2 * $i + 1], $coordinates[2 * $i]]);
                    }

                    array_push($itinerary->steps, $walk);
                }
                if ($leg->mode == "RAIL" || $leg->mode == "BUS" || $leg->mode == "TRAM" || $leg->mode == "TROLLEYBUS" || $leg->mode == "SUBWAY") {
                    $route = json_decode(file_get_contents("json/route.json"));

                    $route->mode = $leg->mode;
                    $route->startTime = $leg->startTime;
                    $route->endTime = $leg->endTime;
                    $route->duration = $leg->duration;
                    $route->distance = $leg->distance;
                    $route->from = $leg->from;
                    $route->to = $leg->to;
                    $route->headsign = $leg->headsign;
                    $route->route = $leg->route;
                    $route->tripId = substr($leg->tripId, 4);
                    $route->routeColor = "#" . $leg->routeColor;
                    $route->routeTextColor = "#" . $leg->routeTextColor;

                    if ($route->routeColor == "#1E1E1E") {
                        $route->mode = "NIGHTBUS";
                    }

                    $coordinates = GooglePolylineDecode($leg->legGeometry->points);
                    for ($i=0; $i < $leg->legGeometry->length; $i++) { 
                        array_push($route->geometry, [$coordinates[2 * $i + 1], $coordinates[2 * $i]]);
                    }

                    $coordinates = GetStopsMySQL(substr($leg->tripId, 4), $leg->from->stopIndex, $leg->to->stopIndex, $link);
                    while ($coordinate =  mysqli_fetch_array($coordinates)) {
                        array_push($route->stops, [$coordinate["lon"], $coordinate["lat"]]);
                    }
                    array_push($itinerary->steps, $route);
                }
            }

            array_push($response->data->plan->itineraries, $itinerary);
        }

        echo json_encode($response);
    }
    if ($bkk_response->code == 500) {
        //valami nem jó itt
        
        $response = array("code" => 500, "status" => $bkk_response->status, "text" => $bkk_response->text);
        echo "ERROR";
    }
}

function GetStopsMySQL($routeId, $fromStopIndex, $toStopIndex, $link)
{
    $SQL_query = sprintf('SELECT s.stop_lat AS "lat", s.stop_lon AS "lon"
    FROM stops s 
    INNER JOIN stop_times st ON st.stop_id = s.stop_id 
    WHERE st.trip_id = "%s" AND st.stop_sequence BETWEEN %s AND %s 
    ORDER BY st.stop_sequence;', mysqli_real_escape_string($link, $routeId), mysqli_real_escape_string($link, $fromStopIndex + 1), mysqli_real_escape_string($link, $toStopIndex - 1));

    $result = mysqli_query($link, $SQL_query);
    return $result;
}
?>