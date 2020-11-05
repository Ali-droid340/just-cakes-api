const express = require("express");

var cors = require("cors");
const bodyParser=require('body-parser')
const fs=require('fs')
var app = express();
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : '50.62.177.41',
  user     : 'heroku',
  password : 'sOFp8YL0kiXP',
  database:'calander'
});
 

app.use(cors());
const port = process.env.PORT || 3000;

var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(urlencodedParser)
app.use(jsonParser)
app.use(express.json())
app.use( express.static('./constant'));

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});

const { Orders } = require("shopify-admin-api");
const service = new Orders(
  "https://just-cakes-bakeshop.myshopify.com/",
  "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"
);
app.get("/", async (req, res) => {
  
  const disableDate = [];
  try {
    await service
      .list()
      .then( async (data) => {
        const DateAndquantity = [];
        const selectDates =new Promise(resolve=>{
          connection.query('SELECT * from manage_dates', function (error, results, fields) {
            if (error) throw error;
            resolve(results)
          }); 
        });
      const rangedDates=  await selectDates;
    
        data.forEach(({ line_items }) => {
          line_items.forEach(({ properties, fulfillable_quantity }) => {
            const quantity = fulfillable_quantity;

            const date = properties.find(({ name }) => name === "Buy from" || name === "Pickup Date");
            if (date && date.value) {
              const orderDate = new Date(date.value).toDateString();
              const index = DateAndquantity.findIndex(

                ({ date }) => date === orderDate
              );
              if (index >= 0) {
                DateAndquantity[index].quantity += quantity;
              } else {
                const dateToPush = { date: orderDate, quantity };
                DateAndquantity.push(dateToPush);
              }
            }
          });
        });
        const comparedRanges = []
        DateAndquantity.forEach(({ date, quantity }) => {
          let range = undefined;
          try{
            for(let i = 0; i < rangedDates.length; i++)
            {
              const dbDate = rangedDates[i].date;

              if(dbDate == date){
                range = rangedDates[i].dateRange;
                comparedRanges.add(i);
              }
            }
          }
          catch(e)
          {

          }
          if (quantity >=range) {
            disableDate.push(date);
          }
          else if (quantity >= 15)
            disableDate.push(date);
        })

        for(let i = 0; i < rangedDates.length; i++)
        {
          if(!comparedRanges.find(x => x == i) && rangedDates[i].dateRange == 0)
            disableDate.push(rangedDates[i].date)
        }
      })
      .catch(({ message }) => {
        res.send({ error: message }, 500);
      });
    // res.json(JSON.parse(fs.readFileSync('./constant/dates.json')))
  } catch ({ message }) {
    res.send({ error: message }, 500);
  }
  res.send(disableDate);
});


app.post('/',async(req,res)=>{
try{

  const selectDates =new Promise(resolve=>{
    connection.query(`select * FROM manage_dates where date ='${req.body.date}'`, function (error, results, fields) {
      if (error) throw error;
      resolve(results)
    }); 
  });
const rangedDates=  await selectDates;
if(!Boolean(rangedDates.length)){
  const dateInsert =new Promise(resolve=>{
    connection.query(`INSERT INTO manage_dates (date, dateRange)
    VALUES ('${req.body.date}', ${req.body.range});`, function (error, results, fields) {
      if (error) throw error;
      resolve(results)
    }); 
  });

  await dateInsert;
  res.json({
    success:true
  })
}else{
  const updateDate =new Promise(resolve=>{
    connection.query(`UPDATE manage_dates SET dateRange=${req.body.range} WHERE date='${req.body.date}';`, function (error, results, fields) {
      if (error) throw error;
      resolve(results)
    }); 
  });
  await updateDate;
res.json({
  success:true
})
}

}catch(message) {
  res.status(500).send({ error: message });
}
})
app.get('/by-range',async(req,res)=>{


try{
  const selectDates =new Promise(resolve=>{
    connection.query('SELECT * from manage_dates', function (error, results, fields) {
      if (error) throw error;
      resolve(results)
    }); 
  });

  const results = await selectDates;
  
  res.send({
    data:results.map(({date,dateRange})=>{
      return {date,range:dateRange}
    })
  })
}catch({message}){
  res.send({ error: message }, 500);
}
})