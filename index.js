const express = require("express");
var cors = require("cors");
const bodyParser=require('body-parser')
const fs=require('fs')
var app = express();

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
      .then((data) => {
        const DateAndquantity = [];
        data.forEach(({ line_items }) => {
          line_items.forEach(({ properties, fulfillable_quantity }) => {
            const quantity = fulfillable_quantity;

            const date = properties.find(({ name }) => name === "Buy from");
            if (date && date.value) {
              const orderDate = new Date(date.value).toDateString();
              const index = DateAndquantity.findIndex(

                ({ date }) => date === orderDate
              );
              if (index >= 0) {
                DateAndquantity[index].quantity += quantity;
              } else {
                DateAndquantity.push({ date: orderDate, quantity });
              }
            }
          });
        });
        DateAndquantity.forEach(({ date, quantity }) => {
          let range = undefined;
          try{
            range = JSON.parse(fs.readFileSync('./constant/dates.json')).find(({date:dbDate})=>dbDate==date).range

          }catch(e){

          }
       if(quantity <range){
            return;
      }
       if (quantity >=range ) {
            disableDate.push(date);
          }else if(  quantity >= 15){
            disableDate.push(date);

          }
        })
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
  let jsonData=JSON.parse(fs.readFileSync('./constant/dates.json'));
  let check=false;
  jsonData.map((item,index)=>{
    if(item.date===req.body.date){
      jsonData[index]=req.body;
      check =true;
    }
  })
  if(!check){
    jsonData.push(req.body)
  }

 fs.writeFileSync('./constant/dates.json',JSON.stringify(jsonData))
//  fs.writeFileSync('./constant/range.json',JSON.stringify(req.body.range))
res.json({
  success:true
})
}catch({ message }) {
  console.log(message)
  res.send({ error: message }, 500);
}
})
app.get('/by-range',async(req,res)=>{
try{
  res.send({
    data:JSON.parse(fs.readFileSync('./constant/dates.json'))
  })
}catch({message}){
  res.send({ error: message }, 500);
}
})