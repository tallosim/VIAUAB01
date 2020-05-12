<?php
require_once "config.php";
if (isset($_GET["type"]) && !empty($_GET["type"])) {
    if ($_GET["type"] == "plan-trip" && isset($_GET["fromPlace"]) && !empty($_GET["fromPlace"]) && isset($_GET["toPlace"]) && !empty($_GET["toPlace"]) && isset($_GET["date"]) && !empty($_GET["date"]) && isset($_GET["time"])) {
        $url_query = array("fromPlace" => "", "toPlace" => "", "date" => "", "time" => "");

        $url_query["fromPlace"] = trim($_GET["fromPlace"]);
        $url_query["toPlace"] = trim($_GET["toPlace"]);
        $url_query["date"] = trim($_GET["date"]);

        if (!empty($_GET["time"])) {
            $url_query["time"] = trim($_GET["time"]);
        }
        $link = opendb();
        echo MakeResponse($url_query, $link);
        mysqli_close($link);
        //echo json_encode(json_decode(file_get_contents("response.json"))->data->plan->from);
    } else if ($_GET["type"] == "trip" & isset($_GET["tripId"]) && !empty($_GET["tripId"])) {
        $url_query = array("tripId" => "", "fromStopIndex" => "", "toStopIndex" => "");

        $url_query["tripId"] = trim($_GET["tripId"]);
        $url_query["fromStopIndex"] = trim($_GET["fromStopIndex"]);
        $url_query["toStopIndex"] = trim($_GET["toStopIndex"]);
    } else {
        $response = array("code" => 500, "status" => "ERROR", "text" => "URL QUERY ERROR!");
        echo json_encode($response);
    }
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

function GetLocationIQApi($lat, $lon)
{
    $api_query = sprintf("https://eu1.locationiq.com/v1/reverse.php?key=2a4d7ec5256685&lat=%s&lon=%s&format=json", $lat, $lon);
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

        $fromAddress = json_decode(GetLocationIQApi($response->data->plan->from->lat, $response->data->plan->from->lon));
        $toAddress = json_decode(GetLocationIQApi($response->data->plan->to->lat, $response->data->plan->to->lon));

        $response->data->plan->from->{"address"} = $fromAddress->address;
        $response->data->plan->to->{"address"} = $toAddress->address;


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
                    for ($i = 0; $i < $leg->legGeometry->length; $i++) {
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

                    if ($route->to->stopIndex - $route->from->stopIndex > 1) {
                        $coordinates = GetStopsMySQL($link, $route->tripId, $route->from->stopIndex, $route->to->stopIndex);
                        if ($coordinates == "SQL STOPS ERROR") {
                            $response = array("code" => 500, "status" => "ERROR", "text" => "SQL STOPS ERROR");
                            return json_encode($response);
                        }
                        while ($coordinate =  mysqli_fetch_array($coordinates)) {
                            array_push($route->stops, [$coordinate["lon"], $coordinate["lat"]]);
                        }
                    }

                    // $coordinates = GooglePolylineDecode($leg->legGeometry->points);
                    // for ($i = 0; $i < $leg->legGeometry->length; $i++) {
                    //     array_push($route->geometry, [$coordinates[2 * $i + 1], $coordinates[2 * $i]]);
                    // }

                    $coordinates = GetTripShapeMySQL($link, $route->tripId, $route->from->stopCode, $route->to->stopCode);
                    if ($coordinates == "SQL SHAPE ERROR") {
                        $response = array("code" => 500, "status" => "ERROR", "text" => "SQL SHAPE ERROR");
                        return json_encode($response);
                    }
                    while ($coordinate =  mysqli_fetch_array($coordinates)) {
                        array_push($route->geometry, [$coordinate["lon"], $coordinate["lat"]]);
                    }

                    array_push($itinerary->steps, $route);
                }
            }

            array_push($response->data->plan->itineraries, $itinerary);
        }

        return json_encode($response);
    }
    if ($bkk_response->code == 400) {
        $response = array("code" => 400, "status" => $bkk_response->status, "text" => $bkk_response->text);
        return json_encode($response);
    }
    if ($bkk_response->code == 500) {
        $response = array("code" => 500, "status" => $bkk_response->status, "text" => $bkk_response->text);
        return json_encode($response);
    }
}

function GetStopsMySQL($link, $tripId, $fromStopIndex, $toStopIndex, $offset = 1)
{
    $SQL_query = sprintf(
        'SELECT s.stop_lat AS "lat", s.stop_lon AS "lon"
    FROM stops s 
    INNER JOIN stop_times st ON st.stop_id = s.stop_id 
    WHERE st.trip_id = "%s" AND st.stop_sequence BETWEEN %s AND %s 
    ORDER BY st.stop_sequence;',
        mysqli_real_escape_string($link, $tripId),
        mysqli_real_escape_string($link, $fromStopIndex + $offset),
        mysqli_real_escape_string($link, $toStopIndex - $offset)
    );

    $result = mysqli_query($link, $SQL_query);
    if (mysqli_num_rows($result) == 0) {
        return "SQL STOPS ERROR";
    }
    return $result;
}

function GetTripShapeMySQL($link, $tripId, $fromStopCode, $toStopCode)
{
    $tripId = mysqli_real_escape_string($link, $tripId);

    $fromShapeSeq = GetTripShapeSeqMySQL($link, $tripId, $fromStopCode);
    $toShapeSeq = GetTripShapeSeqMySQL($link, $tripId, $toStopCode);

    if ($fromShapeSeq == "SQL SHAPE ERROR" || $toShapeSeq == "SQL SHAPE ERROR") {
        return "SQL SHAPE ERROR";
    }

    $SQL_query = sprintf(
        'SELECT s.shape_pt_lat AS "lat", s.shape_pt_lon AS "lon"
        FROM shapes s 
        INNER JOIN trips t on t.shape_id = s.shape_id 
        WHERE t.trip_id = "%s" AND s.shape_pt_sequence BETWEEN %s AND %s
        ORDER BY s.shape_dist_traveled;',
        $tripId, $fromShapeSeq, $toShapeSeq
    );

    $result = mysqli_query($link, $SQL_query);
    return $result;
}

function GetTripShapeSeqMySQL($link, $tripId, $stopCode)
{
    $stopCode = mysqli_real_escape_string($link, $stopCode);
    $result = null;

    $make_query = true;
    $precision = 0.0001;
    $count = 0;

    while ($make_query) {
        $SQL_query = sprintf(
            'SELECT s.shape_pt_sequence AS "seq"
            FROM shapes s 
            INNER JOIN trips t on t.shape_id = s.shape_id 
            WHERE t.trip_id = "%s" AND ABS(s.shape_pt_lat - (SELECT s.stop_lat FROM stops s WHERE s.stop_id = "%s")) < %s AND ABS(s.shape_pt_lon - (SELECT s.stop_lon FROM stops s WHERE s.stop_id = "%s")) < %s
            ORDER BY s.shape_dist_traveled;',
            $tripId, $stopCode, $precision, $stopCode, $precision
        );
        $result = mysqli_query($link, $SQL_query);
        $num = mysqli_num_rows($result);
        if (0 < $num && $num<= 3 || $count > 10) {
            $make_query = false;
        }
        else if ($num == 0) {
            $precision *= 2;
        }
        else if ($num >= 0) {
            $precision /= 2;
        }
        $count++;
    }

    if($count > 10) {
        return "SQL SHAPE ERROR";
    }   
    else {
        return mysqli_fetch_array($result)[0];
    }
}
?>