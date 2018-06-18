# Analyto

Personally Hosted Analytics system for small projects

## Dependencies
You need the accounts of the following services and get the respective keys
1. Firebase (Private access key)
2. MapBox (API Key)
3. IPStack (API Key)

## Setup Instructions
1. Copy `config.json.example` as `config.json` and edit accordingly.
2. In `client.js` edit the third last line with the domain of the analytics server
3. Place your firebase key `json` file in root of project as `firebase-key.json`
4. Install the dependencies using `npm install`
5. Start the server by `npm start` or `node index.js`
6. Add the following script in the page (or template) you want to be tracked -
	```
	<script src="<ANALYTICS_DOMAIN>/client.js"></script>
	```
7. Place the MapBox API key in the required places in `public/js/map.js`
