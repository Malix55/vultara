## Create your own .env file

You need to create your own .env file in this /server folder for configuration purpose. This file is ignored, together with all dependencies in node_modules, when uploaded to GitHub repo. The file name is `.env`. For local deployment, set `AWS_DEPLOY=local`. Make sure you update the ATLASTRIALDB_* variable by replacing the `username` and `password` with the credentials assigned to you, so your nodejs server can access the MongoDB Atlas databases. Your credentials to the MongoDB Atlas database server should have been emailed to you separately. If not, contact the administrator for the access info. The content of the `.env` file is as following:

ATLASTRIALDB_LOCAL=mongodb+srv://username:password@freeclusterfortrial.7h1bc.mongodb.net/libraries?retryWrites=true&w=majority

ATLASTRIALDB_LOCALDATAANALYTICS=mongodb+srv://username:password@freeclusterfortrial.7h1bc.mongodb.net/dataAnalyticsDb?retryWrites=true&w=majority

ATLASTRIALDB_NONPRODJWTUSERACCESSDB=mongodb+srv://username:password@freeclusterfortrial.7h1bc.mongodb.net/nonProdJwtUserAccessDb?retryWrites=true&w=majority

AUTH_STRATEGY=jwt

AWS_DEPLOY=local