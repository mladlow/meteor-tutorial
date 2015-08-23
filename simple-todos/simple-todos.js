Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
  Meteor.publish("tasks", function() {
    return Tasks.find({
      $or: [
    { isPrivate: {$ne: true} },
           { owner: this.userId}
    ]
    });
  });
}

if (Meteor.isClient) {
  Meteor.subscribe("tasks");

  Template.body.helpers({
    tasks: function () {
             if (Session.get("hideCompleted")) {
               return Tasks.find({checked: {$ne: true}}, { sort: {createdAt: -1} } );
             } else {
               return Tasks.find({}, { sort: {createdAt: -1}});
             }
           },
    // This helper is called by the input to set it's checked value.
    hideCompleted: function() {
                     return Session.get("hideCompleted");
                   },
    incompleteCount: function() {
                       return Tasks.find({checked: {$ne: true}}).count();
                     }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();

      var text = event.target.text.value;

      Meteor.call("addTask", text);

      // Clear form
      event.target.text.value = "";
    },
    "change .hide-completed input": function(event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.helpers({
    isOwner: function() {
               return this.owner === Meteor.userId();
             }
  });

  Template.task.events({
    "click .toggle-checked": function() {
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function() {
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function() {
      Meteor.call("setPrivate", this._id, ! this.isPrivate);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
  addTask: function(text) {
             // Make sure the user is logged in before inserting a task
             if (! Meteor.userId()) {
               throw new Meteor.Error("not-authorized");
             }

             Tasks.insert({
               text: text,
             createdAt: new Date(),
             owner: Meteor.userId(),
             username: Meteor.user().username
             });
           },
  deleteTask: function(taskId) {
                var task = Tasks.findOne(taskId);
                console.log(task.owner);
                if (typeof task.owner != 'undefined' && 
                  task.owner !== Meteor.userId()) {
                  throw new Meteor.Error("not-authorized");
                }
                Tasks.remove(taskId);
              },
  setChecked: function(taskId, setChecked) {
                var task = Tasks.findOne(taskId);
                if (task.isPrivate && task.owner !== Meteor.userId()) {
                  throw new Meteor.Error("not-authorized");
                }
                Tasks.update(taskId, { $set: {checked: setChecked} });
              },
  setPrivate: function(taskId, setToPrivate) {
                var task = Tasks.findOne(taskId);

                if (task.owner !== Meteor.userId()) {
                  throw new Meteor.Error("not-authorized");
                }

                Tasks.update(taskId, { $set: {isPrivate: setToPrivate} });
              }

});
