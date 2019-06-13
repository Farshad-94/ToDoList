//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//Mongoose setups
mongoose.connect("mongodb+srv://admin-Farshad:Test123@cluster0-do5i6.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Check the mailbox."
});
const item2 = new Item({
  name: "Get your daily exercise at 7 PM."
});

const defaultItems = [item1, item2];


const listSchema = {name: String, items: [itemsSchema]};
const List = mongoose.model("List", listSchema);



//Express Routes

app.get("/", function(req, res) {

  Item.find({}, function(err, results) {

    if (results.length === 0) {

      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      });

      res.render("/");

    } else {
      res.render("list", {listTitle: "Today",newListItems: results});
    }
  });
});


app.post("/", function(req, res) {

  //saving the inserted data of our ToDoList
  const itemName = req.body.newItem;

  //tapping into value of list list
  const listName = req.body.list;


  const item = new Item ({
    name: itemName
  });

// check to see where (route) the item was added into
 if (listName == "Today"){
    item.save();
    res.redirect("/");
   } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//using express routing parameter to render custom lists
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name ,newListItems: foundList.items});
      }
    }
  });
});


//deleting items from home route and other custom routes
app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;   //getting ID of checked item
    const listName = req.body.listName;        //getting the name of list

    if (listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, function(err){
        if (err){
          console.log("Was not able to delete checked item");
        }
        res.redirect("/");
      });
    } else {
      List.findOneAndUpdate({name:listName}, {$pull:{items: {_id: checkedItemId}}}, function(err, foundList){
        if (!err) {
          res.redirect("/" + listName);
        }
      });
    }
});


app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
