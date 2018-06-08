var restify = require('restify');
var builder = require('botbuilder');
var azure = require('botbuilder-azure');
const cognitiveServices = require('botbuilder-cognitiveservices');

var docDbClient = new azure.DocumentDbClient(documentDbOptions);
var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);

var documentDbOptions = {
    host: 'https://jeans.documents.azure.com:443/', 
    masterKey: 'NBA8LiWLMAjh2eiI1ED7NiVF2PNJTBspm1fnCFMutWPGJUFyclEirUwZI0Y2ptVNFCusMdaIknKZFDDqbYuo0w==', 
    database: 'botdocs',   
    collection: 'botdata'
};


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();

// This is a dinner reservation bot that uses a waterfall technique to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Welcome to the dinner reservation.");
        builder.Prompts.time(session, "Please provide a reservation date and time (e.g.: June 6th at 5pm)");
    },
    function (session, results) {
        session.dialogData.reservationDate = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.number(session, "How many people are in your party?");
    },
    function (session, results) {
        session.dialogData.partySize = results.response;
        builder.Prompts.text(session, "Whose name will this reservation be under?");
    },
    function (session, results){
        session.dialogData.reservationName = results.response;
        builder.Prompts.text(session, 'What is the hotel name you want to reserve?');
    },
    function (session, results){
        session.dialogData.hotelName = results.response;
        session.send(`Reservation confirmed. Reservation details: <br/>Date/Time: ${session.dialogData.reservationDate} <br/>Party size: ${session.dialogData.partySize} <br/>Reservation name: ${session.dialogData.reservationName} <br/>Hotel Name: ${session.dialogData.hotelName}`);
        session.endDialog();
    }
   /* function (session, results) {
        session.dialogData.reservationName = results.response;
        
        // Process request and display reservation details
        session.send(`Reservation confirmed. Reservation details: <br/>Date/Time: ${session.dialogData.reservationDate} <br/>Party size: ${session.dialogData.partySize} <br/>Reservation name: ${session.dialogData.reservationName}`);
        session.endDialog();
    }*/
]).set('storage', inMemoryStorage); // Register in-memory storage

var recognizer = new cognitiveServices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId, 
    subscriptionKey: process.env.QnASubscriptionKey
});

var basicQnAMakerDialog = new cognitiveServices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3}
);


// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
//var bot = new builder.UniversalBot(connector, function (session) {
    
  //   session.send("You said: %s", session.message.text);
    //bot.dialog('/', basicQnAMakerDialog);
//});


/*var bot = new builder.UniversalBot(connector);
bot.dialog('/', qnaMakerDialog);*/

/*bot.dialog('/',[
   function(session) {
       builder.Prompts.text(session, 'What is your name?');
   },
   function(session , args , next) {
       session.send('Hello, ' + args.response);
   }
]);*/
