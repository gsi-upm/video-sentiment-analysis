<?php

$phrase = $_GET['currentLine'];
$name = $_GET['name'];
$restricted = $_GET['restricted'];


$params = array(
    'input' => $phrase,
    'informat' => 'text',
    'intype' => 'direct',
    'outformat' => 'json-ld',
    'algo' => $name
);

$contextData = array(
    'method' => 'POST',
    'content'=> http_build_query($params)
);

$context = stream_context_create(array('http' => $contextData));

// Send to correct server address
if ($restricted == 'true') {
    $link = 'http://demos.gsi.dit.upm.es/tomcat/RestrictedToNIF/RestrictedService';
} else {
    $link = 'http://demos.gsi.dit.upm.es/tomcat/SAGAtoNIF/Service';
}

$result = json_decode(file_get_contents($link, false, $context), true);

echo $result["entries"][0]["opinions"][0]["marl:polarityValue"];

?>
