const express = require("express");
var cors = require("cors");
var app = express();

app.use(cors());
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});

const { Orders } = require("shopify-admin-api");

app.get("/", async (req, res) => {
  const service = new Orders(
    "https://just-cakes-bakeshop.myshopify.com/",
    "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"
  );
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
          if (quantity >= 15) {
            disableDate.push(date);
          }
        });
      })
      .catch(({ message }) => {
        res.send({ error: message }, 500);
      });
  } catch ({ message }) {
    res.send({ error: message }, 500);
  }
  res.send(disableDate);
});
