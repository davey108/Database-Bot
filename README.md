# Discord Censorship and Fun Game Bot
----
**Overview**
- This is a bot use for discord chat forum only which has multiple fun features
----
**Features**:
- Censorship : Censor inappropriate text and give the user appropriate warnings.
- Kick-after-3 : The user is automatically kicked from the server if 3 warnings have been breached.
- Daily Credits: Users can log in every 24 hours for daily credits.
- Credits Features: Users can use their earned credits to play variety of games. Every games consumes credits, however, winning the games will also gives significant credits amount.
- Games: Play text based games to earn credit and become the best on the server!
- Database Integration: Users' data are stored in mysql database through mysql library integration with node js. This reduce the chance of losing datas and keep users' data safe even when there are outages.
----
## Required Downloads for this Bot
- To run the bot, you will need the below tools:
1. MySQL - Download the MySQL installer from here: https://dev.mysql.com/downloads/installer/ . You only need MySQL Command Line interface to manage/ check your database to guarantee accuracy between the bot and the real data stored. <br>
For setting up a mysql database: https://docs.oracle.com/javacomponents/advanced-management-console-2/install-guide/installing-and-configuring-mysql-database-advanced-management-console.htm
2. Discord Account and Bot App creation: You must create your own empty bot from Discord and then paste the data of this bot over. You must also obtain your own authorization code for the bot to go online in your servers. A good set up guide for such task can be found here: https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token
3. Node JS - The Bot is built and compile through Node JS. You will need to have Node JS to compile and run the bot. You can download Node JS here: https://nodejs.org/en/download/

### Other extra side things
- These are other extra things you might want to do before running the bot, but these are not necessary:
1. Download WebStorm - Javascript IDE that is very friendly and easy to learn, can also help you work with Git to stage your file and give you color code about your changes and whether or not you have commit the latest copy on git or not. JetBrains offer a 30-days free trial but you can get a 1 - year license of WebStorm (and among other industry standard tools as well) if you are a student of a university. 
Link to download can be found here: https://www.jetbrains.com/webstorm/download/
2. NPM Install All Dependencies - After you have downloaded Node JS, you might want to check out the list of dependencies and install the latest version through Node Package Manager (npm). List of dependencies can be found in <code>package.json</code>
----
## To Run the Bot:
0. Unzip the file. Fill out the fields for server, host, and password in <code>sql_file.js</code> and <code>database_functions.js</code> with your identity of your MySQL server.
1. After you have set up MySQL, run <code>sql_file.js</code>. This will set up the database and the tables for this bot to use.
2. Run <code>db_bot.js</code>. If the bot has sucessfully go online, there will be a message "Logged on...." otherwise, you might have to reinstall some dependencies or check code base or you can report the issue here on Git. <br>
**Note**: The command to run the files from Node JS is: node *filename.extension* <br>
**Note 2**: For any dependencies installation, you must be inside the project folder before running npm. The reason why is npm will look for a <code>node_modules</code> file to install into or it will make a new one on that directory. 
