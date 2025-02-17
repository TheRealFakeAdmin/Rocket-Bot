const { debug } = require('console');
const { warn, log } = require('../public/async-logs');

const xml2js = require('xml2js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.run = function metar (_, msg, args) {

    if (args.length < 1) throw  "No station specified";

    args = args.join(' ');

    /* NOAA ADDS: https://aviationweather.gov/dataserver
        METAR: https://aviationweather.gov/dataserver/example?datatype=metar

        // dataSource: metars
        // stationString=CYOW
        // hoursBeforeNow=3
        // &most_recent=true

    Example: https://aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=CYOW&mostRecent=true&hoursBeforeNow=3

    Returns:
    =======

    HTTP/1.1 200 OK
    Server: Apache-Coyote/1.1
    Strict-Transport-Security: max-age=63072000; includeSubdomains; preload
    X-Frame-Options: SAMEORIGIN
    Content-Type: text/xml
    Vary: Accept-Encoding
    Cache-Control: private, max-age=600
    Date: Mon, 22 Aug 2022 01:18:50 GMT
    Connection: keep-alive

    <?xml version="1.0" encoding="UTF-8"?>
    <response xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              version="1.2" xsi:noNamespaceSchemaLocation="http://www.aviationweather.gov/static/adds/schema/metar1_2.xsd">
        <request_index>442255379</request_index>
        <data_source name="metars"/>
        <request type="retrieve"/>
        <errors/>
        <warnings/>
        <time_taken_ms>6</time_taken_ms>
        <data num_results="1">
            <METAR>
                <raw_text>CYOW 220100Z 23003KT 220V280 15SM FEW070 BKN260 20/19 A2995 RMK AC2CI5 DIST LTNG SE SLP144 DENSITY
                    ALT 1000FT
                </raw_text>
                <station_id>CYOW</station_id>
                <observation_time>2022-08-22T01:00:00Z</observation_time>
                <latitude>45.32</latitude>
                <longitude>-75.67</longitude>
                <temp_c>20.0</temp_c>
                <dewpoint_c>19.0</dewpoint_c>
                <wind_dir_degrees>230</wind_dir_degrees>
                <wind_speed_kt>3</wind_speed_kt>
                <visibility_statute_mi>15.0</visibility_statute_mi>
                <altim_in_hg>29.949802</altim_in_hg>
                <sea_level_pressure_mb>1014.4</sea_level_pressure_mb>
                <sky_condition sky_cover="FEW" cloud_base_ft_agl="7000"/>
                <sky_condition sky_cover="BKN" cloud_base_ft_agl="26000"/>
                <flight_category>VFR</flight_category>
                <metar_type>METAR</metar_type>
                <elevation_m>111.0</elevation_m>
            </METAR>
        </data>
    </response>


    Response file saved.
    > 2022-08-21T211850.200.xml

    Response code: 200 (OK); Time: 186ms (186 ms); Content length: 1399 bytes (1.4 kB)


    */

    // Parse the parameters
    // Build the URL

    var reqUrl = 'https://aviationweather.gov/adds/dataserver_current/httpparam?';
    reqUrl += 'dataSource=metars';
    reqUrl += '&requestType=retrieve&format=xml';
    reqUrl += '&stationString=' + `${args}`;
    reqUrl += '&mostRecent=true&hoursBeforeNow=3';

    // msg.channel.send("requestString: "+requestString);

    // Retrieve the data

//    var request = new XMLHttpRequest();

    fetch(reqUrl)
        .then(async r => {
            try {
                const resp = await r.text();

                // convert XML to JSON
                xml2js.parseString(resp, (err, result) => { //
                    if(err) {
                        return debug(err);
                    }

                    if (typeof result.response !== "object" || !Array.isArray(result.response.data) || result.response.data.length < 1 || !Array.isArray(result.response.data[0].METAR)) return;

                    // `result` is a JavaScript object

                    const metar = result.response.data[0].METAR[0]; // JSON Object; Try metar.raw_text

                    // debug(json);

                    //msg.channel.send("Result: "  + json);

                    // TODO add response for no report received
                    //if (!isnull(result.response.data[0])) {
                        msg.channel.send(metar.raw_text.toString());
                    //} else {
                    //    msg.channel.send("No report for " + $args);
                    //}

                });
            } catch (e) {
                warn(e);
            }
        })
        .catch(e => {
            warn(e);
        })

};


exports.conf = {
    enabled: true,
    guildOnly: false,
    permLevel: 1,
    type: 5
};

exports.help = {
    name: `metar`,
    aliases: [],
    description: `Retrieve the most recent METAR for an airport.`,
    usage: `metar <ICAO airport code> (e.g., metar cyow)`
};
