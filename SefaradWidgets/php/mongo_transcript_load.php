<?php

$connection = new MongoClient();

$db = $connection->transcript_database;

if (empty($_GET['name'])) {
    echo implode(',', $db->getCollectionNames());
} else {
    $name = $_GET['name'];
    $collection = $db->$name;
    $cursor = $collection->find();

    $allDocs = [];
    $i = 0;
    foreach($cursor as $docs) {
        $allDocs[$i] = $docs;
        $i++;
    }
    echo json_encode($allDocs);
}

?>
