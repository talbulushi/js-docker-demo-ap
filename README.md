# js-docker-demo-app: developing with Docker

This demo app shows a simple user profile app set up using 
- `index.html` with pure js and css styles
- nodejs backend with express module 
- mongodb for data storage

### To start the application (with docker compose)

Step 1: Run docker compose file. This command will build two mongoDB componenets to create the backend infra within a docker network called  `<repo-name>_mongo-network`. Once this is created you can access mongo Express UI.

    docker-compose -f docker-compose.yaml up

Step 2: Check that the network is created with the two containers for mongo DB

    docker network ls 

Step 3: open mongo-express from your browser

    http://localhost:8080

Step 4: Build the app docker container.

    docker build -t <image-name:tag> .

Step 5: Activate the container for your app image.

    docker run -d -p 3000:3000 --name <container-name>  --network <default-network-created> <image-name:tag> 

Step 6: Check the existance of the previous container within the default network created from step 1.
    docker netowrk inspect <default-network-created>

Step 7: Access the app from your browser 

    http://localhost:3000

_Note: Notice that when you edit the profile of the current user, the data gets updated in the backend (port 8080) under `my-db/users`._ 


### To start the application (without docker compose)

Step 1: Create docker network

    docker network create mongo-network 

Step 2: start mongodb 

    docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password --name mongodb --net mongo-network mongo    

Step 3: start mongo-express
    
    docker run -d -p 8081:8081 -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin -e ME_CONFIG_MONGODB_ADMINPASSWORD=password --net mongo-network --name mongo-express -e ME_CONFIG_MONGODB_SERVER=mongodb mongo-express   

_NOTE: creating docker-network in optional. You can start both containers in a default network. In this case, just emit `--net` flag in `docker run` command_

Step 4: open mongo-express from browser

    http://localhost:8081

Step 5: create `user-account` _db_ and `users` _collection_ in mongo-express

Step 6: Start your nodejs application locally - go to `app` directory of project 

    npm install 
    node server.js
    
Step 7: Access you nodejs application UI from browser

    http://localhost:3000

### With Docker Compose

#### To start the application

Step 1: start mongodb and mongo-express

    docker-compose -f docker-compose.yaml up
    
_You can access the mongo-express under localhost:8080 from your browser_
    
Step 2: in mongo-express UI - create a new database "my-db"

Step 3: in mongo-express UI - create a new collection "users" in the database "my-db"       
    
Step 4: start node server 

    npm install
    node server.js
    
Step 5: access the nodejs application from browser 

    http://localhost:3000

#### To build a docker image from the application

    docker build -t my-app:1.0 .       
    
The dot "." at the end of the command denotes location of the Dockerfile.

##### Flow diagram 
        [Page Loads]
             |
             v
   ----------------------
   |  Actions Section  |
   | Add New | Search  |
   ----------------------
       |          |
       |          |
       v          v
[Add Profile]   [Search Profile]
  (form)          (enter userid)
       |          |
       |          |
       v          v
  [Click Create]  [Click Load]
       |          |
       |          |
       v          v
  Server: POST /add-profile     Server: GET /get-profile/:userid
       |                          |
       v                          v
  Returns new profile             Returns profile if found
       |                          |
       +--------------------------+
       |
       v
   [Edit Profile Section]
   (inputs pre-filled with user data)
       |
       v
  [Click Save]
       |
       v
  Server: POST /update-profile
       |
       v
   Profile updated
       |
       v
(Optional) Back to Actions Section
