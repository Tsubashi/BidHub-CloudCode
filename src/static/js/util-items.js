function showImg() {
  $("#newimg").attr("src", $("#imgurl").val());
}

function createItem() {

  var newItem = JSON.stringify(
          {
              "name": $("#itemname").val(),
              "donorname": $("#donorname").val(),
              "price": parseInt($("#price").val()),
              "imageurl": $("#imgurl").val(),
              "description": $("#descriptionbody").val()
          }
  );

  $.ajax({
      type: "POST",
      url: "https://auction.ucrpc.org/parse/classes/Item",
      beforeSend: function(xhr){
          xhr.setRequestHeader('X-Parse-Application-Id', 'UCRPCAuction');
          xhr.setRequestHeader('X-Parse-REST-API-Key', 'aa7118fa-67e8-4497-b45d-aa935647b3af');
      },
      data: newItem,
      success: function () {
          location.reload();
      },
      contentType:"application/json; charset=utf-8",
      dataType:"json"
  });
}
