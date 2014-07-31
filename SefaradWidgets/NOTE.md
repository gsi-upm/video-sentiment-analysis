Brief Note
----------
These widgets function when added to the Sefarad framework, but they only interact with each other at the moment.
Furthermore, they directly use the HTML and CSS from the SentiVid Widget.
This has the potential to cause ID conflicts in the future and does not make for very clean code.
Ideally, the HTML should be created and manipulated in a more dynamic manner.

The videoWidget is currently set to use *transcript_database* as its database.
To save a transcript from a live analysis, it would require using the SentiVid Controller to collect the data and add it to a database.
Then, the *mongo_transcript_load.php* file would need to be adjusted to make use of that database.

Overall, the widgets are a bit rough as they stand, but they function as intended.
With some modification, they should be able to adjust synchronously and interact with other components in the framework as desired.
